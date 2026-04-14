"use client"

import { SAMPLE_R } from "@/constants/skin-data"
import type { Product } from "@/types/analysis"

interface RoutineSetupProps {
  t: (ko: string, en: string) => string
  // 루틴 제품 목록
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  // 올리브영 검색 (제품마다 별도 상태)
  routineOyQuery: Record<number, string>
  setRoutineOyQuery: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >
  routineOyLoading: Record<number, boolean>
  handleRoutineOySearch: (productId: number) => void
  // OCR (제품마다 별도 로딩)
  routineOcrLoading: Record<number, boolean>
  handleRoutineOcr: (productId: number, file: File) => void
  // 분석 트리거
  canR: boolean
  analyzeRoutine: () => void
  // 시각적 단계 그라디언트 토큰
  STEP_COLORS: string[]
  STEP_BORDERS: string[]
}

/**
 * 루틴 궁합 분석 입력 폼.
 *
 * [동작]
 *   - 제품을 2개 이상 입력 → "궁합 체크" 버튼으로 분석 트리거
 *   - 각 제품마다 올리브영 검색 / OCR / 직접 입력 3가지 경로 제공
 *   - "+ 제품 추가" 버튼으로 동적 추가, "×" 버튼으로 삭제 (최소 2개 유지)
 *
 * [상태 모델]
 *   - products: 제품 배열 (id/name/ingredients) — 부모가 소유
 *   - routineOyQuery, routineOyLoading: 제품 id를 키로 한 Record
 *     → 여러 제품이 동시에 검색 가능하도록 분리 보관
 *   - 같은 패턴이 OCR 로딩에도 적용
 */
export default function RoutineSetup({
  t,
  products,
  setProducts,
  routineOyQuery,
  setRoutineOyQuery,
  routineOyLoading,
  handleRoutineOySearch,
  routineOcrLoading,
  handleRoutineOcr,
  canR,
  analyzeRoutine,
  STEP_COLORS,
  STEP_BORDERS,
}: RoutineSetupProps) {
  return (
    <div className="anim-fade-up">
      <div className="mt-12 mb-12">
        <div className="mb-6 flex gap-2.5">
          <span className="mt-0.5 text-base">🧴</span>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {t("루틴 제품 입력", "Your Routine")}
            </p>
            <p className="text-xs text-gray-400">
              {t(
                "같이 쓰는 제품 2개 이상 넣어주세요!",
                "Enter 2+ products you use together"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {products.map((p, i) => (
            <div
              key={p.id}
              className={`bg-linear-to-br ${STEP_COLORS[i % STEP_COLORS.length]} border ${STEP_BORDERS[i % STEP_BORDERS.length]} anim-fade-up rounded-2xl p-4 shadow-sm`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/60 text-[10px] font-extrabold text-gray-500">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">
                    Step {i + 1}
                  </span>
                </div>
                {products.length > 2 && (
                  <button
                    onClick={() =>
                      setProducts((ps) => ps.filter((x) => x.id !== p.id))
                    }
                    className="border-none bg-transparent px-1 text-lg leading-none text-gray-400 transition-colors hover:text-rose-500"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* ── 🛒 올리브영 검색 ── */}
              <div className="mb-2 flex gap-1.5">
                <input
                  value={routineOyQuery[p.id] || ""}
                  onChange={(e) =>
                    setRoutineOyQuery((q) => ({
                      ...q,
                      [p.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRoutineOySearch(p.id)
                  }}
                  placeholder={t("🛒 제품명 검색", "🛒 Search product")}
                  disabled={routineOyLoading[p.id]}
                  className="flex-1 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white disabled:opacity-50"
                />
                <button
                  onClick={() => handleRoutineOySearch(p.id)}
                  disabled={
                    !routineOyQuery[p.id]?.trim() || routineOyLoading[p.id]
                  }
                  className="shrink-0 rounded-xl bg-pastel-lime-dark px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-[#8ab922] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {routineOyLoading[p.id] ? (
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
                onChange={(e) =>
                  setProducts((ps) =>
                    ps.map((x) =>
                      x.id === p.id ? { ...x, name: e.target.value } : x
                    )
                  )
                }
                placeholder={t(
                  "제품 이름 (선택)",
                  "Product name (optional)"
                )}
                className="mb-2 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
              />

              {/* ── 성분 입력: 카메라 촬영 / 사진 선택 ── */}
              <label className="hover:bg-pastel-lime-dark/10 mb-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-lime-100 bg-white/60 px-3 py-2.5 text-[11px] font-semibold text-pastel-lime-dark transition-all hover:border-lime-200">
                {routineOcrLoading[p.id] ? (
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
                    if (f) handleRoutineOcr(p.id, f)
                    e.target.value = ""
                  }}
                />
              </label>

              {/* ── 전성분 직접 입력 ── */}
              <textarea
                value={p.ingredients}
                onChange={(e) =>
                  setProducts((ps) =>
                    ps.map((x) =>
                      x.id === p.id
                        ? { ...x, ingredients: e.target.value }
                        : x
                    )
                  )
                }
                placeholder={t(
                  "여기에 자동으로 채워지거나, 직접 붙여넣어주세요!",
                  "Ingredients auto-fill here, or paste manually"
                )}
                rows={3}
                className="w-full resize-y rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs leading-relaxed transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() =>
              setProducts((p) => [
                ...p,
                { id: Date.now(), name: "", ingredients: "" },
              ])
            }
            className="hover:bg-pastel-lime-dark/10 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-500 transition-all hover:border-lime-200 hover:text-lime-700"
          >
            + {t("제품 추가", "Add product")}
          </button>
          <button
            onClick={() => setProducts(SAMPLE_R)}
            className="border-none bg-transparent p-0 text-xs font-medium text-gray-400 underline underline-offset-2 transition-colors hover:text-pastel-lime-dark"
          >
            {t("샘플로 해볼래? →", "Try sample →")}
          </button>
        </div>
      </div>

      <button
        onClick={analyzeRoutine}
        disabled={!canR}
        className="w-full rounded-2xl bg-pastel-lime-dark py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {t("궁합 체크해볼까요?", "Check Compatibility")}
      </button>
    </div>
  )
}
