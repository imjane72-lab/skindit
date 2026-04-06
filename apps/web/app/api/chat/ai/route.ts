import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError, rateLimit, getIp } from "@/lib/api-utils"
import { TOOL_DEFINITIONS, executeTool } from "@/lib/chat-tools"

const MAX_TOOL_ITERATIONS = 5

const SYSTEM_PROMPT = `너는 피부과 경력 30년차 유쾌한 여자 의사야. 말투는 친한 언니처럼 친근하되, 문장 끝은 반드시 존댓말로 마무리해. 예: "좋아요", "바르세요", "추천해요", "해보세요".

절대 규칙:
- 물어본 것만 대답해. 안 물어본 건 말하지 마.
- 되물어보지 마. 바로 답변해. ("어떤 제품 쓰세요?" 같은 역질문 금지)
- 추가 질문 유도 금지. ("혹시 이것도 궁금하지 않아요?" 금지)
- 핵심 2-4문장. 길게 쓰지 마.

[사용자 데이터 접근]
당신은 사용자의 피부 데이터에 접근할 수 있는 도구들이 있습니다:
- get_skin_profile: 피부 타입, 고민, 메모 조회
- query_diary: 피부 일지 (날짜, 상태, 제품, 트러블, 식단)
- search_analysis: 과거 성분 분석 기록
- analyze_trouble_pattern: 트러블 패턴 통계 분석
- search_ingredient: 식약처 성분 정보 조회
- check_regulation: 성분 규제 정보 확인
- search_similar_products: 성분이 유사한 제품 벡터 검색 (RAG). 유사 제품 추천이나 대체품 찾기에 사용

사용자가 자신의 피부 이력, 과거 분석, 일지, 트러블 원인에 대해 물으면 반드시 도구를 사용해서 실제 데이터를 확인하세요.
일반적인 피부 지식 질문에는 도구 없이 바로 답변하세요.

추천 시: 구체적 성분명 + 아침/저녁 구분 + 이유 1줄. 시술은 시술명 + 효과 + 대략 가격대.
정확성: 확실한 사실만. 지어내기 금지.
No-Answer: 모르거나 확실하지 않으면 "정확한 정보를 찾기 어려워요. 피부과 전문의와 상담해보세요"로 답변. 추측하지 마.`

interface ContentBlock {
  type: string
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
}

interface ClaudeMessage {
  role: "user" | "assistant"
  content: string | ContentBlock[]
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  // 2. Rate limit
  const ip = getIp(req.headers)
  const limit = rateLimit(ip)
  if (!limit.ok) {
    return apiError(limit.msg || "Too many requests", 429)
  }

  // 3. API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return apiError("ANTHROPIC_API_KEY is not configured", 500)
  }

  // 4. Parse request
  const body = await req.json()
  const { message } = body as { message: string }

  if (!message || message.trim().length === 0) {
    return apiError("메시지를 입력해주세요.", 400)
  }

  const userId = session.user.id

  // 5. Load recent chat history for context
  const recentMessages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  // Build conversation messages (oldest first)
  const conversationMessages: ClaudeMessage[] = recentMessages
    .reverse()
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

  // Add new user message
  conversationMessages.push({ role: "user", content: message })

  // 6. Tool-use loop
  let finalText = ""

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3200,
        system: SYSTEM_PROMPT,
        tools: TOOL_DEFINITIONS,
        messages: conversationMessages,
      }),
    })

    const data = await res.json()

    if (data.error) {
      return apiError(data.error.message || "AI 응답 실패", 500)
    }

    const content = data.content as ContentBlock[]
    const stopReason = data.stop_reason as string

    if (stopReason === "end_turn" || stopReason !== "tool_use") {
      // Extract text from content blocks
      finalText = content
        .filter((b) => b.type === "text")
        .map((b) => b.text || "")
        .join("")
      break
    }

    // Claude wants to use tools
    conversationMessages.push({ role: "assistant", content })

    const toolResults: ContentBlock[] = []
    for (const block of content.filter((b) => b.type === "tool_use")) {
      const result = await executeTool(
        block.name!,
        block.input || {},
        userId,
      )
      toolResults.push({
        type: "tool_result",
        id: block.id!, // tool_use_id
        text: result,  // content
      } as unknown as ContentBlock)
    }

    conversationMessages.push({
      role: "user",
      content: toolResults.map((t) => ({
        type: "tool_result" as const,
        tool_use_id: (t as unknown as { id: string }).id,
        content: (t as unknown as { text: string }).text,
      })) as unknown as ContentBlock[],
    })
  }

  if (!finalText) {
    finalText = "죄송해요, 잠시 문제가 생겼어요. 다시 한번 말해주세요!"
  }

  // 7. Persist messages
  await prisma.chatMessage.createMany({
    data: [
      { userId, role: "user", content: message },
      { userId, role: "assistant", content: finalText },
    ],
  })

  return apiResponse({ content: finalText })
}
