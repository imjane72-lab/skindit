"use client"

interface CompareSetupProps {
  t: (ko: string, en: string) => string
  // A 제품
  compareA: string
  setCompareA: (v: string) => void
  compareNameA: string
  setCompareNameA: (v: string) => void
  // B 제품
  compareB: string
  setCompareB: (v: string) => void
  compareNameB: string
  setCompareNameB: (v: string) => void
  // 올리브영 검색 (A/B 키)
  compareOyQuery: Record<string, string>
  setCompareOyQuery: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >
  compareOyLoading: Record<string, boolean>
  handleCompareOySearch: (target: "A" | "B") => void
  // OCR (A/B 중 어느 쪽이 로딩 중인지)
  compareOcrLoading: "A" | "B" | null
  handleCompareOcr: (target: "A" | "B", file: File) => void
  // 분석 트리거
  canC: boolean
  analyzeCompare: () => void
}

/**
 * 두 제품 성분 비교 입력 폼.
 *
 * [동작]
 *   - A/B 두 제품의 성분을 받아 차이점/공통점/궁합을 분석
 *   - 각 제품은 올리브영 검색 / OCR / 직접 입력 3가지 경로 지원
 *   - A는 라임 톤, B는 피치 톤으로 시각적 구분
 *
 * [상태 모델]
 *   A/B 각각 별도 useState (compareA, compareB, compareNameA, compareNameB).
 *   배열로 통합하지 않은 이유: A/B는 의미가 비대칭(좌/우 비교)이라
 *   각각 명시적 변수가 디버깅·언어 전환 복원에 더 유리하다고 판단.
 */
export default function CompareSetup({
  t,
  compareA,
  setCompareA,
  compareNameA,
  setCompareNameA,
  compareB,
  setCompareB,
  compareNameB,
  setCompareNameB,
  compareOyQuery,
  setCompareOyQuery,
  compareOyLoading,
  handleCompareOySearch,
  compareOcrLoading,
  handleCompareOcr,
  canC,
  analyzeCompare,
}: CompareSetupProps) {
  const slots = [
    {
      label: "A" as const,
      value: compareA,
      set: setCompareA,
      name: compareNameA,
      setName: setCompareNameA,
      gradient: "from-pastel-lime-dark/10 to-lime-50/40",
      border: "border-lime-100",
    },
    {
      label: "B" as const,
      value: compareB,
      set: setCompareB,
      name: compareNameB,
      setName: setCompareNameB,
      gradient: "from-pastel-peach/60 to-orange-50/40",
      border: "border-orange-100",
    },
  ]

  return (
    <div className="anim-fade-up">
      <div className="mt-12 mb-12">
        <div className="mb-6 flex gap-2.5">
          <span className="mt-0.5 text-base">⚖️</span>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {t("두 제품 성분 비교", "Compare Two Products")}
            </p>
            <p className="text-xs text-gray-400">
              {t(
                "두 제품 전성분 넣으면 뭐가 다른지 알려줄게요!",
                "Paste ingredients of two products to see the differences"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {slots.map((p) => (
            <div
              key={p.label}
              className={`bg-linear-to-br ${p.gradient} border ${p.border} rounded-2xl p-4 shadow-sm`}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/60 text-[10px] font-extrabold text-gray-500">
                    {p.label}
                  </span>
                  <span className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">
                    {t(`제품 ${p.label}`, `Product ${p.label}`)}
                  </span>
                </div>
              </div>

              {/* ── 🛒 올리브영 검색 ── */}
              <div className="mb-2 flex gap-1.5">
                <input
                  value={compareOyQuery[p.label] || ""}
                  onChange={(e) =>
                    setCompareOyQuery((q) => ({
                      ...q,
                      [p.label]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCompareOySearch(p.label)
                  }}
                  placeholder={t("🛒 제품명 검색", "🛒 Search product")}
                  disabled={compareOyLoading[p.label]}
                  className="flex-1 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white disabled:opacity-50"
                />
                <button
                  onClick={() => handleCompareOySearch(p.label)}
                  disabled={
                    !compareOyQuery[p.label]?.trim() ||
                    compareOyLoading[p.label]
                  }
                  className="shrink-0 rounded-xl bg-pastel-lime-dark px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-[#8ab922] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {compareOyLoading[p.label] ? (
                    <span
                      className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    t("검색", "Search")
                  )}
                </button>
              </div>

              {/* ── 제품 이름 ── */}
              <input
                value={p.name}
                onChange={(e) => p.setName(e.target.value)}
                placeholder={t(
                  "제품 이름 (선택)",
                  "Product name (optional)"
                )}
                className="mb-2 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
              />

              {/* ── 성분 입력: 카메라 촬영 / 사진 선택 ── */}
              <label className="hover:bg-pastel-lime-dark/10 mb-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-lime-100 bg-white/60 px-3 py-2.5 text-[11px] font-semibold text-pastel-lime-dark transition-all hover:border-lime-200">
                {compareOcrLoading === p.label ? (
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border-2 border-pastel-lime-dark/30 border-t-pastel-lime-dark"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <>
                    <span className="text-xs">📷</span>
                    {t("성분표 사진 등록", "Add Ingredient Photo")}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleCompareOcr(p.label, f)
                    e.target.value = ""
                  }}
                />
              </label>

              {/* ── 전성분 직접 입력 ── */}
              <textarea
                value={p.value}
                onChange={(e) => p.set(e.target.value)}
                placeholder={t(
                  "여기에 자동으로 채워지거나, 직접 붙여넣어주세요",
                  "Ingredients auto-fill here, or paste manually"
                )}
                rows={3}
                className="w-full resize-y rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs leading-relaxed transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={analyzeCompare}
        disabled={!canC}
        className="w-full rounded-2xl bg-pastel-lime-dark py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {t("비교하기", "Compare Ingredients")}
      </button>
    </div>
  )
}
