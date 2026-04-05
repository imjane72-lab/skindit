import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// ─── Prisma Client (싱글톤) ───
const prisma = new PrismaClient();

// ─── 식약처 API 설정 ───
const MFDS_KEY = process.env.MFDS_API_KEY || "";
const MFDS_BASE = "https://apis.data.go.kr/1471000";

// ─── MCP 서버 생성 ───
const server = new McpServer({
  name: "skindit",
  version: "1.0.0",
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool 1: 식약처 성분 검색
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "search_ingredient",
  "식약처 공공데이터에서 화장품 성분 정보를 조회합니다. 성분의 효능, 용도, 영문명을 확인할 수 있습니다.",
  {
    name: z.string().describe("검색할 성분명 (한글). 예: 나이아신아마이드"),
  },
  async ({ name }) => {
    if (!MFDS_KEY) {
      return {
        content: [{ type: "text" as const, text: "MFDS_API_KEY가 설정되지 않았습니다." }],
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(
        `${MFDS_BASE}/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntInfoService01?serviceKey=${encodeURIComponent(MFDS_KEY)}&type=json&numOfRows=5&INGR_KOR_NAME=${encodeURIComponent(name)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          content: [{ type: "text" as const, text: `식약처 API 응답 오류: ${res.status}` }],
        };
      }

      const data = await res.json();
      const items = data?.body?.items;

      if (!items || items.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `"${name}" 성분을 식약처 데이터에서 찾을 수 없습니다.`,
          }],
        };
      }

      const item = items[0];
      const result = {
        name_ko: item.INGR_KOR_NAME || name,
        name_en: item.INGR_ENG_NAME || "N/A",
        purpose: item.ORIGIN_MAJOR_KOR_NAME || "N/A",
        source: "식약처 화장품 원료성분정보",
      };

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `식약처 API 호출 실패: ${err instanceof Error ? err.message : "Unknown error"}`,
        }],
      };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool 2: 성분 규제 정보 확인
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "check_regulation",
  "화장품 성분의 규제 정보를 확인합니다. 금지 성분인지, 사용 제한이 있는지 확인할 수 있습니다.",
  {
    name: z.string().describe("확인할 성분명 (한글). 예: 하이드로퀴논"),
  },
  async ({ name }) => {
    if (!MFDS_KEY) {
      return {
        content: [{ type: "text" as const, text: "MFDS_API_KEY가 설정되지 않았습니다." }],
      };
    }

    try {
      const res = await fetch(
        `${MFDS_BASE}/CsmtcsReglMaterialInfoService/getCsmtcsReglMaterialInfoService?serviceKey=${encodeURIComponent(MFDS_KEY)}&type=json&numOfRows=5&INGR_KOR_NAME=${encodeURIComponent(name)}`
      );

      if (!res.ok) {
        return {
          content: [{ type: "text" as const, text: `규제 API 응답 오류: ${res.status}` }],
        };
      }

      const data = await res.json();
      const items = data?.body?.items;

      if (!items || items.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              name,
              regulated: false,
              detail: "규제 정보 없음 (금지/제한 목록에 없음)",
            }, null, 2),
          }],
        };
      }

      const item = items[0];
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
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `규제 API 호출 실패: ${err instanceof Error ? err.message : "Unknown error"}`,
        }],
      };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool 3: 피부 일지 조회
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "query_diary",
  "사용자의 피부 일지를 조회합니다. 날짜 범위, 피부 상태로 필터링할 수 있습니다.",
  {
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
    const daysBack = days ?? 30;
    const maxRows = limit ?? 20;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const where: Record<string, unknown> = {
      userId,
      date: { gte: startDate },
    };
    if (condition) where.condition = condition;

    const entries = await prisma.skinDiary.findMany({
      where,
      orderBy: { date: "desc" },
      take: maxRows,
    });

    if (entries.length === 0) {
      return {
        content: [{
          type: "text" as const,
          text: `최근 ${daysBack}일간 일지가 없습니다.${condition ? ` (필터: ${condition})` : ""}`,
        }],
      };
    }

    const formatted = entries.map((e) => {
      const d = new Date(e.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        date: dateStr,
        condition: e.condition,
        products: e.products,
        troubles: e.troubles,
        foods: e.foods,
        note: e.note || null,
      };
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ total: entries.length, entries: formatted }, null, 2),
      }],
    };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool 4: 분석 기록 검색
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "search_analysis",
  "사용자의 성분 분석 기록을 검색합니다. 특정 성분이 포함된 분석, 점수 범위 등으로 필터링할 수 있습니다.",
  {
    userId: z.string().describe("사용자 ID"),
    type: z
      .enum(["SINGLE", "ROUTINE"])
      .optional()
      .describe("분석 유형. SINGLE=단일 제품, ROUTINE=루틴 궁합"),
    keyword: z
      .string()
      .optional()
      .describe("성분명 또는 제품명 키워드 검색"),
    minScore: z
      .number()
      .optional()
      .describe("최소 종합 점수 (0-100)"),
    limit: z
      .number()
      .optional()
      .describe("최대 조회 건수 (기본값: 10)"),
  },
  async ({ userId, type, keyword, minScore, limit }) => {
    const maxRows = limit ?? 10;

    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;
    if (minScore !== undefined) where.score = { gte: minScore };

    let entries = await prisma.analysisHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: keyword ? 50 : maxRows, // 키워드 검색 시 넉넉히 가져와서 필터
    });

    // 키워드 필터링 (성분 텍스트에서 검색)
    if (keyword) {
      const kw = keyword.toLowerCase();
      entries = entries
        .filter((e) => e.ingredients.toLowerCase().includes(kw))
        .slice(0, maxRows);
    }

    if (entries.length === 0) {
      return {
        content: [{
          type: "text" as const,
          text: `조건에 맞는 분석 기록이 없습니다.${keyword ? ` (키워드: ${keyword})` : ""}`,
        }],
      };
    }

    const formatted = entries.map((e) => ({
      id: e.id,
      type: e.type,
      score: e.score,
      ingredients: e.ingredients.substring(0, 200) + (e.ingredients.length > 200 ? "..." : ""),
      concerns: e.concerns,
      createdAt: e.createdAt.toISOString().split("T")[0],
    }));

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ total: entries.length, analyses: formatted }, null, 2),
      }],
    };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool 5: 피부 프로필 조회
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "get_skin_profile",
  "사용자의 피부 프로필(피부 타입, 고민, 메모)을 조회합니다.",
  {
    userId: z.string().describe("사용자 ID"),
  },
  async ({ userId }) => {
    const profile = await prisma.skinProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return {
        content: [{
          type: "text" as const,
          text: "피부 프로필이 아직 설정되지 않았습니다.",
        }],
      };
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          skinTypes: profile.skinTypes,
          concerns: profile.concerns,
          note: profile.note || null,
          updatedAt: profile.updatedAt.toISOString().split("T")[0],
        }, null, 2),
      }],
    };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool 6: 트러블 패턴 분석
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "analyze_trouble_pattern",
  "피부 상태가 나빴던 날의 공통 패턴(제품, 음식, 트러블)을 분석합니다. 일지 데이터를 기반으로 통계를 계산합니다.",
  {
    userId: z.string().describe("사용자 ID"),
    days: z
      .number()
      .optional()
      .describe("분석 기간 (최근 N일, 기본값: 30)"),
  },
  async ({ userId, days }) => {
    const daysBack = days ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const allEntries = await prisma.skinDiary.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: "desc" },
    });

    if (allEntries.length === 0) {
      return {
        content: [{
          type: "text" as const,
          text: `최근 ${daysBack}일간 일지 데이터가 없습니다.`,
        }],
      };
    }

    const stats = {
      total: allEntries.length,
      good: allEntries.filter((e) => e.condition === "good").length,
      normal: allEntries.filter((e) => e.condition === "normal").length,
      bad: allEntries.filter((e) => e.condition === "bad").length,
    };

    // 나쁜 날에 자주 등장한 제품
    const badDayProducts: Record<string, number> = {};
    const badDayFoods: Record<string, number> = {};
    const badDayTroubles: Record<string, number> = {};

    allEntries
      .filter((e) => e.condition === "bad")
      .forEach((e) => {
        (e.products as string[]).forEach((p) => {
          badDayProducts[p] = (badDayProducts[p] || 0) + 1;
        });
        (e.foods as string[]).forEach((f) => {
          badDayFoods[f] = (badDayFoods[f] || 0) + 1;
        });
        (e.troubles as string[]).forEach((t) => {
          badDayTroubles[t] = (badDayTroubles[t] || 0) + 1;
        });
      });

    // 좋은 날에 자주 등장한 제품
    const goodDayProducts: Record<string, number> = {};
    allEntries
      .filter((e) => e.condition === "good")
      .forEach((e) => {
        (e.products as string[]).forEach((p) => {
          goodDayProducts[p] = (goodDayProducts[p] || 0) + 1;
        });
      });

    const sortDesc = (obj: Record<string, number>) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          period: `최근 ${daysBack}일`,
          stats,
          bad_day_patterns: {
            products: sortDesc(badDayProducts),
            foods: sortDesc(badDayFoods),
            troubles: sortDesc(badDayTroubles),
          },
          good_day_patterns: {
            products: sortDesc(goodDayProducts),
          },
        }, null, 2),
      }],
    };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Resource: 사용자 피부 프로필
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.resource(
  "skin_profile",
  "skindit://profile/{userId}",
  async (uri) => {
    const userId = uri.pathname.split("/").pop();
    if (!userId) {
      return {
        contents: [{
          uri: uri.href,
          text: "userId가 필요합니다.",
          mimeType: "text/plain",
        }],
      };
    }

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

    if (!user) {
      return {
        contents: [{
          uri: uri.href,
          text: "사용자를 찾을 수 없습니다.",
          mimeType: "text/plain",
        }],
      };
    }

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 서버 시작
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("skindit MCP server running on stdio");
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
