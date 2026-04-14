"use client"

import { CONCERNS, SAMPLE_S_KO, SAMPLE_S_EN } from "@/constants/skin-data"

interface SingleSetupProps {
  t: (ko: string, en: string) => string
  lang: string
  // 피부 고민 멀티 선택
  concerns: string[]
  setConcerns: React.Dispatch<React.SetStateAction<string[]>>
  // 올리브영 제품 검색
  oyQuery: string
  setOyQuery: (v: string) => void
  oyLoading: boolean
  oyError: string
  oySuccess: string
  handleOySearch: () => void
  // 제품 이름 (선택)
  productName: string
  setProductName: (v: string) => void
  // OCR 카메라 업로드
  ocrLoading: boolean
  handleOcr: (file: File) => void
  // 전성분 직접 입력
  ings: string
  setIngs: (v: string) => void
  // 분석 트리거
  canS: boolean
  analyzeSingle: () => void
}

/**
 * 단일 제품 분석 입력 폼.
 *
 * [입력 경로 3가지]
 *   1) 올리브영 제품명 검색 → 크롤링으로 전성분 자동 채움
 *   2) OCR: 성분표 사진 업로드 → Claude vision으로 텍스트 추출
 *   3) 전성분 직접 붙여넣기
 *
 * [상태 관리 전략]
 *   모든 state/handler를 부모(page.tsx)가 소유하고 props로 전달.
 *   - 이유 1: 분석 결과(sRes)와 입력값이 부모의 saveResultState에서 함께 저장됨
 *   - 이유 2: 언어 전환 시 부모가 마지막 입력값(lastIngs/lastConcerns) 보관
 *   - 이유 3: OCR/올영 핸들러가 lib/ingredient-db, lib/api에 의존 → 부모에서 통합 관리
 */
export default function SingleSetup({
  t,
  lang,
  concerns,
  setConcerns,
  oyQuery,
  setOyQuery,
  oyLoading,
  oyError,
  oySuccess,
  handleOySearch,
  productName,
  setProductName,
  ocrLoading,
  handleOcr,
  ings,
  setIngs,
  canS,
  analyzeSingle,
}: SingleSetupProps) {
  return (
    <div className="anim-fade-up">
      {/* ── 피부 고민 ── */}
      <div className="mt-12 mb-12">
        <div className="mb-3 flex gap-2.5">
          <span className="mt-0.5 text-base">🫧</span>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {t("피부 고민", "Skin Concerns")}
            </p>
            <p className="text-xs text-gray-400">
              {t("해당하는 거 다 골라주세요~", "Select all that apply")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((c) => {
            const sel = concerns.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() =>
                  setConcerns((p) =>
                    p.includes(c.id)
                      ? p.filter((x) => x !== c.id)
                      : [...p, c.id]
                  )
                }
                className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                  sel
                    ? c.color + " font-semibold shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="mr-1">{c.icon}</span>
                {t(c.ko, c.en)}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 🛒 올리브영 제품 검색 ── */}
      <div className="mb-8">
        <div className="mb-3 flex gap-2.5">
          <span className="mt-0.5 text-base">🛒</span>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {t("제품명으로 검색", "Search by Product Name")}
            </p>
            <p className="text-xs text-gray-400">
              {t(
                "올리브영에 등록된 제품만 검색 가능해요. 브랜드명 + 제품명을 함께 입력하면 더 정확해요!",
                "Only products on Olive Young are searchable. Enter brand + product name for best results!"
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={oyQuery}
            onChange={(e) => setOyQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleOySearch()
            }}
            placeholder={t("제품 이름으로 검색", "Search by product name")}
            disabled={oyLoading}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white focus:ring-2 focus:ring-pastel-lime-dark/20 disabled:opacity-50"
          />
          <button
            onClick={handleOySearch}
            disabled={!oyQuery.trim() || oyLoading}
            className="shrink-0 rounded-xl bg-pastel-lime-dark px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#8ab922] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {oyLoading ? (
              <span
                className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              t("검색", "Search")
            )}
          </button>
        </div>
        {oyError && <p className="mt-2 text-xs text-rose-500">{oyError}</p>}
        {oySuccess && (
          <div className="mt-3 rounded-xl border border-pastel-lime-dark/30 bg-pastel-lime-dark/10 px-4 py-3">
            <p className="text-xs font-bold text-[#6b9a0a]">{oySuccess}</p>
            <p className="mt-1 text-[11px] text-[#7dab18]">
              {t("전성분을 가져왔어요!", "Ingredients loaded!")}
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-gray-200" />
        <span className="text-xs font-semibold text-gray-400">
          {t("또는 직접 등록", "or add manually")}
        </span>
        <div className="h-px flex-1 bg-linear-to-l from-transparent via-gray-200 to-gray-200" />
      </div>

      {/* ── 제품 이름 (선택) ── */}
      <div className="mb-8">
        <div className="mb-2 flex gap-2.5">
          <span className="mt-0.5 text-base">🏷</span>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {t("제품 이름", "Product Name")}{" "}
              <span className="text-xs font-normal text-gray-400">
                {t("(선택)", "(optional)")}
              </span>
            </p>
            <p className="text-xs text-gray-400">
              {t(
                "기록에서 어떤 제품인지 구분하기 쉬워요~",
                "Makes it easy to identify in history"
              )}
            </p>
          </div>
        </div>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder={t(
            "예) 에스트라 아토배리어365 크림",
            "e.g. Aestura Atobarrier 365 Cream"
          )}
          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white focus:ring-2 focus:ring-pastel-lime-dark/20"
        />
      </div>

      {/* ── 📷 성분표 스캔 (메인) ── */}
      <div className="mb-8">
        {ocrLoading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-lime-200 bg-linear-to-br from-lime-50 to-lime-50 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <span
                className="inline-block h-6 w-6 rounded-full border-3 border-pastel-lime-dark/30 border-t-pastel-lime-dark"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
            <p className="text-sm font-bold text-gray-800">
              {t("성분 읽는 중...", "Reading ingredients...")}
            </p>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-pastel-lime-dark/20 bg-linear-to-br from-pastel-lime-dark/8 via-pastel-gold/5 to-pastel-olive/3 p-6 transition-all hover:border-pastel-lime-dark/40 hover:shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-lime-dark/15 text-2xl">
              📷
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">
                {t("성분표 사진 등록", "Add Ingredient Photo")}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {t(
                  "사진 찍거나 갤러리에서 골라주세요",
                  "Take a photo or choose from gallery"
                )}
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleOcr(f)
                e.target.value = ""
              }}
            />
          </label>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-gray-200" />
        <span className="text-xs font-semibold text-gray-400">
          {t("또는 직접 입력", "or paste manually")}
        </span>
        <div className="h-px flex-1 bg-linear-to-l from-transparent via-gray-200 to-gray-200" />
      </div>

      {/* ── 전성분 직접 입력 ── */}
      <div className="mb-8">
        <div className="mb-3 flex gap-2.5">
          <span className="mt-0.5 text-base">📋</span>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {t("전성분 붙여넣기", "Paste Ingredients")}
            </p>
            <p className="text-xs text-gray-400">
              {t(
                "올리브영이나 제품 상세페이지에서 복사해서 붙여넣어주세요~",
                "Copy from Hwahae app or product detail page and paste here"
              )}
            </p>
          </div>
        </div>
        <textarea
          value={ings}
          onChange={(e) => setIngs(e.target.value)}
          placeholder={t(
            "예) 정제수, 글리세린, 나이아신아마이드...",
            "e.g. Water, Glycerin, Niacinamide..."
          )}
          rows={6}
          className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm leading-relaxed text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white focus:ring-2 focus:ring-pastel-lime-dark/20"
        />
        <button
          onClick={() => setIngs(lang === "ko" ? SAMPLE_S_KO : SAMPLE_S_EN)}
          className="mt-2 border-none bg-transparent p-0 text-xs font-medium text-gray-400 underline underline-offset-2 transition-colors hover:text-pastel-lime-dark"
        >
          {t("샘플로 한번 해볼래? →", "Try with sample →")}
        </button>
      </div>

      <button
        onClick={analyzeSingle}
        disabled={!canS}
        className="w-full rounded-2xl bg-pastel-lime-dark py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {t("분석해볼까요?", "Analyze Ingredients")}
      </button>
    </div>
  )
}
