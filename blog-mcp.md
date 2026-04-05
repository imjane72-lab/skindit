# Next.js 프로젝트에 MCP 서버 붙이기 — Claude가 내 DB를 읽게 된 이유

> **목차**
> - MCP가 뭔데
> - REST API가 있는데 왜 또 만들어야 하지?
> - 서버 한 줄로 띄우기 — McpServer + stdio
> - Tool 설계: AI한테 어디까지 열어줄 것인가
> - 식약처 API를 Tool로 감싸기
> - Puppeteer를 MCP에 태우면 생기는 일
> - DB에 직접 접근하는 Tool, 보안은?
> - Resource로 사용자 컨텍스트 넘기기
> - Claude Desktop 연동, 실제로 써보면
> - 👉🏻 핵심 요약

---

## MCP가 뭔데

MCP(Model Context Protocol)는 AI 모델이 외부 데이터에 접근할 수 있게 해주는 프로토콜이에요. Anthropic에서 만들었고, 쉽게 말하면 **Claude한테 "이 함수 쓸 수 있어"라고 알려주는 규격**이에요.

저는 화장품 성분 분석 서비스 skindit을 만들고 있었는데, 웹 UI 말고 **Claude Desktop에서도 성분 검색이나 분석 기록 조회가 되면 좋겠다**고 생각했어요. MCP가 딱 그 역할이었어요.

Claude Desktop에서 이런 대화가 가능해져요:

```
나: "나이아신아마이드 성분 정보 알려줘"
Claude: (search_ingredient Tool 호출) → 식약처 데이터 기반 응답

나: "내 최근 피부 일지 보여줘"
Claude: (query_diary Tool 호출) → DB에서 일지 데이터 조회 후 응답
```

AI가 단순히 "알고 있는 지식"으로 답하는 게 아니라, **실제 데이터를 조회해서 답하는 구조**예요.

---

## REST API가 있는데 왜 또 만들어야 하지?

솔직히 처음엔 이 생각이 들었어요. skindit 웹에는 이미 `/api/history`, `/api/diary`, `/api/oliveyoung` 같은 API가 다 있거든요. 근데 MCP와 REST API는 **호출 주체가 다릅니다.**

| 구분 | REST API | MCP Tool |
|------|----------|----------|
| **호출 주체** | 브라우저 (사용자 클릭) | AI 모델 (Claude가 판단해서 호출) |
| **인증** | NextAuth 세션 | 로컬 실행 (별도 인증 불필요) |
| **응답 형식** | JSON (프론트 렌더링용) | 텍스트 (AI가 이해하는 형태) |
| **용도** | 웹 UI 서빙 | AI 대화 컨텍스트 제공 |

REST API는 **프론트엔드가 소비하는 데이터**, MCP Tool은 **AI가 소비하는 데이터**예요. 같은 DB를 보지만 인터페이스가 완전히 달라요.

---

## 서버 한 줄로 띄우기 — McpServer + stdio

MCP 서버의 뼈대는 놀라울 정도로 간단해요.

```typescript
// apps/mcp-server/src/index.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "skindit",
  version: "1.0.0",
});

// ... Tool, Resource 등록 ...

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("skindit MCP server running on stdio");
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
```

`StdioServerTransport`는 표준 입출력(stdin/stdout)으로 통신해요. Claude Desktop이 이 프로세스를 띄우고, 파이프로 JSON-RPC 메시지를 주고받는 구조예요. HTTP 서버를 따로 안 띄워도 돼요.

참고로 `console.error`를 쓴 이유가 있어요. stdout은 MCP 프로토콜 통신용이라 일반 로그를 찍으면 프로토콜이 깨져요. **로그는 반드시 stderr로** 보내야 해요.

---

## Tool 설계: AI한테 어디까지 열어줄 것인가

skindit MCP 서버에는 7개의 Tool이 있어요.

| Tool | 하는 일 | 데이터 소스 |
|------|---------|------------|
| `search_ingredient` | 성분 정보 검색 | 식약처 API |
| `check_regulation` | 금지/제한 성분 확인 | 식약처 API |
| `query_diary` | 피부 일지 조회 | PostgreSQL |
| `search_analysis` | 분석 기록 검색 | PostgreSQL |
| `get_skin_profile` | 피부 프로필 조회 | PostgreSQL |
| `analyze_trouble_pattern` | 트러블 패턴 통계 | PostgreSQL |
| `search_oliveyoung` | 제품 전성분 추출 | 올리브영 크롤링 |

설계할 때 가장 고민했던 건 **읽기만 열고, 쓰기는 안 열었다**는 점이에요. AI가 일지를 수정하거나 분석 기록을 삭제하는 건 위험하다고 판단했어요. Tool 하나를 만들 때마다 "이걸 AI가 마음대로 호출해도 괜찮은가?"를 기준으로 판단했어요.

MCP Tool 등록은 `server.tool()`로 하는데, 파라미터 검증을 Zod로 해요:

```typescript
// apps/mcp-server/src/index.ts

server.tool(
  "query_diary",                    // Tool 이름
  "사용자의 피부 일지를 조회합니다.", // 설명 (AI가 이걸 보고 호출 판단)
  {                                  // 파라미터 스키마 (Zod)
    userId: z.string().describe("사용자 ID"),
    condition: z
      .enum(["good", "normal", "bad"])
      .optional()
      .describe("피부 상태 필터. good=좋음, normal=보통, bad=나쁨"),
    days: z
      .number()
      .optional()
      .describe("최근 N일간 조회 (기본값: 30)"),
    limit: z
      .number()
      .optional()
      .describe("최대 조회 건수 (기본값: 20)"),
  },
  async ({ userId, condition, days, limit }) => {
    // 실제 로직
  }
);
```

여기서 **`.describe()`가 진짜 중요해요.** AI는 이 설명을 보고 어떤 값을 넣을지 결정하거든요. "피부 상태 필터"라고만 쓰면 Claude가 "좋음"을 넣을지 "good"을 넣을지 모르는데, `good=좋음, normal=보통, bad=나쁨`까지 써주면 정확하게 넣어줘요.

---

## 식약처 API를 Tool로 감싸기

skindit은 식약처 공공데이터 API를 쓰고 있어요. 성분 정보 조회랑 규제 정보 확인, 두 개의 API를 각각 Tool로 감쌌어요.

```typescript
// apps/mcp-server/src/index.ts — search_ingredient Tool

server.tool(
  "search_ingredient",
  "식약처 공공데이터에서 화장품 성분 정보를 조회합니다.",
  {
    name: z.string().describe("검색할 성분명 (한글). 예: 나이아신아마이드"),
  },
  async ({ name }) => {
    if (!MFDS_KEY) {
      return {
        content: [{ type: "text" as const, text: "MFDS_API_KEY가 설정되지 않았습니다." }],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `${MFDS_BASE}/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntInfoService01?serviceKey=${encodeURIComponent(MFDS_KEY)}&type=json&numOfRows=5&INGR_KOR_NAME=${encodeURIComponent(name)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await res.json();
    const items = data?.body?.items;
    const item = items[0];

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          name_ko: item.INGR_KOR_NAME || name,
          name_en: item.INGR_ENG_NAME || "N/A",
          purpose: item.ORIGIN_MAJOR_KOR_NAME || "N/A",
          source: "식약처 화장품 원료성분정보",
        }, null, 2),
      }],
    };
  }
);
```

여기서 `AbortController`로 3초 타임아웃을 건 이유가 있어요. 식약처 API가 간헐적으로 응답이 느릴 때가 있는데, MCP Tool이 오래 걸리면 Claude가 "Tool 호출 실패"로 처리해버려요. 그래서 **차라리 빠르게 실패하고 에러 메시지를 돌려주는 게 나았어요.**

규제 정보 확인도 비슷한 구조인데, 여기서 한 가지 더 고민한 게 있었어요. 응답에 `banned`, `limited` 같은 boolean 플래그를 넣었거든요:

```typescript
// apps/mcp-server/src/index.ts — check_regulation Tool

const banned = item.PROH_NATIONAL?.includes("한국") || false;
const limited = item.LIMIT_NATIONAL?.includes("한국") || false;

return {
  content: [{
    type: "text" as const,
    text: JSON.stringify({
      name,
      banned,
      limited,
      detail: banned
        ? `한국 포함 금지 성분 (${item.PROH_NATIONAL})`
        : limited
          ? `한국 사용 제한 (${item.LIMIT_NATIONAL})`
          : "규제 대상 아님",
      source: "식약처 화장품 규제정보",
    }, null, 2),
  }],
};
```

Claude한테 "이 성분 괜찮아?"라고 물으면, `banned: true`를 보고 **명확하게 "금지 성분"이라고 대답**할 수 있어요. 구조화된 데이터를 넘기면 AI의 할루시네이션도 줄어들어요.

---

## Puppeteer를 MCP에 태우면 생기는 일

가장 재밌는 Tool이에요. 올리브영에서 제품을 검색하고 전성분을 크롤링하는 건데, 이걸 MCP Tool로 감싸면 Claude한테 "메디힐 세럼 전성분 가져와"라고 말하는 것만으로 크롤링이 돌아가요.

```typescript
// apps/mcp-server/src/index.ts — search_oliveyoung Tool

server.tool(
  "search_oliveyoung",
  "올리브영에서 제품을 검색하고 전성분 목록을 가져옵니다.",
  {
    keyword: z.string().describe("검색할 제품명. 예: 메디힐 PDRN 모공 탄력 세럼"),
  },
  async ({ keyword }) => {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ..."
      );

      // 1단계: 검색
      await page.goto(
        `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(keyword.trim())}`,
        { waitUntil: "networkidle2", timeout: 20000 }
      );

      // 2단계: 첫 번째 제품 정보 추출
      const productInfo = await page.evaluate(() => {
        const link = document.querySelector(".prd_info a.prd_name") as HTMLAnchorElement | null;
        if (!link) return null;
        const brand = (document.querySelector(".prd_info .tx_brand") as HTMLElement | null)
          ?.textContent?.trim() || "";
        return { url: link.href, name: link.textContent?.trim() || "", brand };
      });

      // 3단계: 상세 페이지 → 전성분 추출
      await page.goto(productInfo.url, { waitUntil: "networkidle2", timeout: 20000 });
      // ... 전성분 파싱 로직 ...
```

근데 웹사이트의 `/api/oliveyoung`에도 같은 기능이 있어요. 왜 두 번 만들었을까요?

**환경이 완전히 다르기 때문이에요:**

| 구분 | 웹 API (`/api/oliveyoung`) | MCP Tool (`search_oliveyoung`) |
|------|--------------------------|-------------------------------|
| **실행 환경** | Vercel 서버리스 | 로컬 머신 |
| **Chromium** | `@sparticuz/chromium-min` (50MB 경량) | 시스템 Chrome (풀 버전) |
| **headless** | `"shell"` 모드 (서버리스 호환) | `true` (일반 headless) |
| **성분 추출** | "상품정보 제공고시" 버튼 클릭 → "모든 성분" 파싱 | `#prdDetail` 탭 클릭 → 정규식 파싱 |
| **타임아웃** | 60초 (Vercel maxDuration) | 20초 |

Vercel 서버리스에서는 일반 Puppeteer가 안 돌아가요. Chrome 바이너리 크기 제한 때문에 `@sparticuz/chromium-min`이라는 경량 Chromium을 써야 하고, headless 모드도 `"shell"`이어야 아코디언 클릭 같은 인터랙션이 작동해요. MCP는 로컬에서 도니까 이런 제약이 없어요.

그리고 전성분 추출 방식도 달라요. 웹 API는 "상품정보 제공고시" 버튼을 클릭해서 아코디언을 펼치는 방식이고, MCP는 `#prdDetail` 탭을 클릭한 뒤 정규식으로 파싱해요. **같은 사이트인데 추출 전략을 다르게 가져간 건, 두 환경에서 각각 테스트해보고 더 안정적인 방식을 선택**했기 때문이에요.

특히 Puppeteer를 MCP에 태울 때 주의할 점이 하나 있었어요. **반드시 `browser.close()`를 보장해야 해요:**

```typescript
// apps/mcp-server/src/index.ts

    } catch (err) {
      if (browser) await browser.close();  // 에러 시에도 반드시 닫기
      return {
        content: [{
          type: "text" as const,
          text: `올리브영 검색 실패: ${err instanceof Error ? err.message : "Unknown error"}`,
        }],
      };
    }
```

MCP Tool은 AI가 반복 호출할 수 있어요. 브라우저를 안 닫으면 Chrome 프로세스가 쌓이면서 메모리가 터지거든요. 처음에 이걸 놓쳐서 한 번 터졌어요.

---

## DB에 직접 접근하는 Tool, 보안은?

MCP 서버에서 Prisma로 PostgreSQL에 직접 쿼리를 날려요. 처음엔 "AI가 DB에 직접 접근하는 게 괜찮은가?" 싶었는데, 몇 가지 제약을 걸어서 해결했어요.

**1. 읽기 전용 — 쓰기 Tool은 하나도 없어요**

```typescript
// apps/mcp-server/src/index.ts — query_diary Tool

const entries = await prisma.skinDiary.findMany({   // findMany (읽기)
  where,
  orderBy: { date: "desc" },
  take: maxRows,
});
```

`create`, `update`, `delete`는 아예 안 만들었어요. AI가 "일지 삭제해줘"라고 해도 그런 Tool이 없으니 실행 자체가 불가능해요.

**2. 조회 범위 제한**

```typescript
// apps/mcp-server/src/index.ts — search_analysis Tool

let entries = await prisma.analysisHistory.findMany({
  where,
  orderBy: { createdAt: "desc" },
  take: keyword ? 50 : maxRows,  // 최대 50개만 조회
});
```

전체 테이블을 스캔하지 못하게 `take`로 항상 상한을 걸어뒀어요.

**3. 응답 데이터 가공**

```typescript
// apps/mcp-server/src/index.ts — search_analysis Tool

const formatted = entries.map((e) => ({
  id: e.id,
  type: e.type,
  score: e.score,
  ingredients: e.ingredients.substring(0, 200) + (e.ingredients.length > 200 ? "..." : ""),
  concerns: e.concerns,
  createdAt: e.createdAt.toISOString().split("T")[0],
}));
```

원본 데이터를 그대로 넘기지 않고, 필요한 필드만 골라서 가공해요. 성분 텍스트도 200자로 잘라서 넘겨요. AI한테 불필요하게 긴 데이터를 넘기면 토큰도 낭비되고, 혹시 모를 개인정보 노출도 줄일 수 있어요.

**4. 로컬 실행 전제**

MCP 서버 자체가 `stdio` 기반이라, 로컬에서만 돌아가요. 네트워크에 노출되지 않으니 외부 공격 면은 없어요. Claude Desktop이 프로세스를 띄우고, 같은 머신에서 파이프로 통신하는 구조예요.

---

## Resource로 사용자 컨텍스트 넘기기

Tool 외에 Resource도 하나 만들었어요. Tool이 "함수 호출"이라면, Resource는 **"데이터 제공"**에 가까워요.

```typescript
// apps/mcp-server/src/index.ts

server.resource(
  "skin_profile",
  "skindit://profile/{userId}",
  async (uri) => {
    const userId = uri.pathname.split("/").pop();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        skinProfile: true,
      },
    });

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          user: {
            id: user.id,
            name: user.name,
            createdAt: user.createdAt.toISOString().split("T")[0],
          },
          profile: user.skinProfile
            ? {
                skinTypes: user.skinProfile.skinTypes,
                concerns: user.skinProfile.concerns,
                note: user.skinProfile.note,
              }
            : null,
        }, null, 2),
        mimeType: "application/json",
      }],
    };
  }
);
```

`skindit://profile/{userId}` 형태의 커스텀 URI를 쓰고 있어요. Claude가 이 Resource를 읽으면 해당 사용자의 피부 타입, 고민 목록, 메모를 한 번에 가져갈 수 있어요.

Tool과 Resource의 차이를 정리하면:

| 구분 | Tool | Resource |
|------|------|----------|
| **호출 방식** | AI가 파라미터 넣고 실행 | AI가 URI로 데이터 조회 |
| **용도** | 동작 수행 (검색, 분석) | 컨텍스트 제공 (프로필, 설정) |
| **예시** | `search_ingredient("나이아신아마이드")` | `skindit://profile/abc123` |

---

## Claude Desktop 연동, 실제로 써보면

Claude Desktop에서 MCP 서버를 연결하려면 설정 파일에 추가하면 돼요:

```json
// claude-desktop-config.json

{
  "mcpServers": {
    "skindit": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/Users/jane/Desktop/skin/apps/mcp-server",
      "env": {
        "DATABASE_URL": "your-database-url-here",
        "MFDS_API_KEY": "your-mfds-api-key-here"
      }
    }
  }
}
```

이 설정을 `~/.claude/claude_desktop_config.json`에 넣고 Claude Desktop을 재시작하면, Claude가 skindit의 7개 Tool과 1개 Resource를 인식해요.

실제로 Claude Desktop에서 대화하면 이런 흐름이에요:

```
나: "하이드로퀴논 규제 정보 알려줘"
→ Claude가 check_regulation Tool 호출
→ 식약처 API에서 데이터 조회
→ { banned: true, detail: "한국 포함 금지 성분" }
→ Claude: "하이드로퀴논은 한국에서 화장품 사용이 금지된 성분이에요."
```

**AI가 추측이 아니라 실제 데이터를 기반으로 답하는 게 핵심**이에요. "아마 금지일 거예요" 같은 애매한 답변이 아니라, 식약처 공식 데이터를 조회해서 정확하게 알려줘요.

---

## 👉🏻 핵심 요약

| 구분 | 내용 |
|------|------|
| **MCP란** | AI가 외부 데이터/기능에 접근하는 표준 프로토콜 |
| **서버 구성** | McpServer + StdioServerTransport (Node.js) |
| **등록된 Tool** | 7개 (식약처 API 2 + DB 조회 4 + 크롤링 1) |
| **등록된 Resource** | 1개 (피부 프로필) |
| **보안 원칙** | 읽기 전용, 조회 범위 제한, 로컬 실행 |
| **클라이언트** | Claude Desktop |

MCP를 도입하면서 가장 크게 느낀 건, **웹 UI와 AI 인터페이스가 같은 데이터를 다른 방식으로 소비한다**는 거예요.

웹에서는 사용자가 클릭해서 성분을 검색하고, 결과를 카드 UI로 보지만, MCP에서는 AI가 자연어 대화 속에서 필요한 시점에 알아서 Tool을 호출하고, 그 데이터를 사람이 읽기 좋은 문장으로 바꿔줘요.

**같은 서비스를 두 가지 인터페이스로 제공하는 셈**이에요. 하나는 사람이 직접 조작하는 웹, 하나는 AI가 중간에서 대신 조작해주는 대화형. 두 개가 같은 DB를 바라보고 있으니까 데이터 정합성도 보장되고요.

MCP를 고려하고 있다면, REST API처럼 "엔드포인트를 만든다"는 개념보다 **"AI한테 어떤 능력을 줄 것인가"**로 접근하는 게 좋은 것 같아요. Tool 하나가 API 엔드포인트 하나와 1:1로 대응할 필요도 없고, AI가 실제로 호출했을 때 유의미한 단위로 설계하는 게 중요했어요.
