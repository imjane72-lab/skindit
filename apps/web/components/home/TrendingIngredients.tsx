"use client"

import { useState } from "react"
import { TRENDING } from "@/constants/skin-data"
import { getTrendingCache } from "@/lib/ingredient-db"
import { callAIText } from "@/lib/api"

interface TrendingIngredientsProps {
  t: (ko: string, en: string) => string
  lang: string
}

/**
 * 메인 페이지 상단 "요즘 뜨는 성분" 섹션.
 *
 * [동작]
 *   - 칩 클릭 → 상세 정보 토글
 *   - 캐시 우선: 자체 큐레이션 DB(getTrendingCache)에 있으면 API 호출 0회
 *   - 캐시 미스 시에만 Claude 호출 (callAIText)
 *   - 한 번 가져온 정보는 trendInfo Map에 저장 → 같은 칩 재클릭 시 즉시 노출
 *
 * [상태 격리]
 *   trending 관련 state(trendOpen/trendInfo/trendLoading)를 모두 이 컴포넌트가 소유.
 *   부모 page.tsx에서 분리하여 단방향 props만 받도록 설계.
 */
export default function TrendingIngredients({ t, lang }: TrendingIngredientsProps) {
  const [trendOpen, setTrendOpen] = useState<string | null>(null)
  const [trendInfo, setTrendInfo] = useState<Record<string, string>>({})
  const [trendLoading, setTrendLoading] = useState(false)

  const loadTrendInfo = async (id: string, name: string) => {
    // 이미 가져온 적 있는 성분 → 토글만 하고 종료 (불필요한 호출 방지)
    if (trendInfo[id]) {
      setTrendOpen(trendOpen === id ? null : id)
      return
    }
    setTrendOpen(id)

    // 캐시된 자체 성분 DB에서 즉시 가져오기 (API 호출 0회)
    const cached = getTrendingCache(id, lang)
    if (cached) {
      setTrendInfo((p) => ({ ...p, [id]: cached }))
      return
    }

    // DB에 없는 성분만 AI 호출
    setTrendLoading(true)
    try {
      const raw = await callAIText(
        `스킨케어 성분 전문가. 반존대. ${lang === "ko" ? "한국어" : "English"}. 확실한 정보만. 추측하지 않기. 모르면 안 쓰기.`,
        `"${name}" 성분 가이드. 각 항목 1-2줄:

**작용** 피부에서 하는 일 (확실한 메커니즘만)
**사용 시간** 아침/저녁 + 이유
**주의 콤보** 같이 쓸 때 주의할 성분 (검증된 것만. 없으면 "특별한 주의 콤보 없음")
**시너지** 같이 쓰면 좋은 성분 2개
**꿀팁** 실전 팁 2개
**효과 시기** 언제부터?
**추천** ★(1-5) + 어떤 피부에 좋은지`
      )
      setTrendInfo((p) => ({ ...p, [id]: raw }))
    } catch {
      setTrendInfo((p) => ({
        ...p,
        [id]: lang === "ko" ? "정보를 못 불러왔어 ㅠ" : "Could not load info.",
      }))
    }
    setTrendLoading(false)
  }

  return (
    <div className="mb-8">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
        <span className="text-base">🧬</span>
        {t("요즘 뜨는 성분", "Trending Ingredients")}
      </p>
      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {TRENDING.map((tr) => (
          <button
            key={tr.id}
            onClick={() =>
              loadTrendInfo(tr.id, lang === "ko" ? tr.ko : tr.en)
            }
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
              trendOpen === tr.id
                ? "bg-pastel-lime-dark/10 border-pastel-lime-dark/40 text-gray-800 shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:border-pastel-lime-dark/30 hover:bg-pastel-lime-dark/5"
            }`}
          >
            <span>{tr.icon}</span>
            {lang === "ko" ? tr.ko : tr.en}
          </button>
        ))}
      </div>
      {trendOpen && (
        <div className="anim-fade-up mt-3 rounded-2xl border border-pastel-lime-dark/20 bg-pastel-lime-dark/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">
              {TRENDING.find((x) => x.id === trendOpen)?.icon}
            </span>
            <span className="text-sm font-bold text-gray-800">
              {lang === "ko"
                ? TRENDING.find((x) => x.id === trendOpen)?.ko
                : TRENDING.find((x) => x.id === trendOpen)?.en}
            </span>
          </div>
          {trendLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-pastel-lime-dark/30 border-t-pastel-lime-dark"
                style={{ animation: "spin 1s linear infinite" }}
              />
              {t("알아보는 중...", "Loading...")}
            </div>
          ) : (
            <p className="text-xs leading-relaxed whitespace-pre-line text-gray-600">
              {(trendInfo[trendOpen] || "")
                .replace(/^#{1,3}\s*/gm, "")
                .split(/(\*\*[^*]+\*\*)/)
                .map((part, i) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={i} className="font-bold text-gray-800">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    part
                  )
                )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
