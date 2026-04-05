"use client"

import Md from "@/components/ui/Md"
import { SITE_URL } from "@/lib/constants"
import type { CompareRes } from "@/types/analysis"

interface CompareResultProps {
  cRes: CompareRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
}

export default function CompareResult({ cRes, t, reset, lang, historyId }: CompareResultProps) {
  return (
    <div className="anim-scale-in">
      {/* Summary */}
      <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50 p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-pink-400 text-2xl shadow-sm">
          ⚖️
        </div>
        <p className="mb-2 text-sm font-bold text-gray-900">
          <Md>{cRes.summary}</Md>
        </p>
        <p className="text-sm leading-relaxed text-gray-600">
          <Md>{cRes.recommendation}</Md>
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4">
        {/* Shared */}
        {cRes.shared?.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5 border-b border-emerald-200 pb-2">
              <span className="text-base">🤝</span>
              <span className="text-sm font-bold text-emerald-800">
                {t("공통 성분", "Shared Ingredients")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cRes.shared.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Only A / Only B */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5 border-b border-purple-200 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-purple-400 text-[10px] font-bold text-white shadow-sm">
                A
              </span>
              <span className="text-xs font-bold text-purple-700">
                {t("A에만 있는 성분", "Only in A")}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {(cRes.only_a || []).map((s, i) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold text-gray-800">
                    {s.name}
                  </span>
                  {s.note && (
                    <span className="ml-1 text-gray-500">
                      · {s.note}
                    </span>
                  )}
                </div>
              ))}
              {(!cRes.only_a || cRes.only_a.length === 0) && (
                <p className="text-xs text-gray-400">
                  {t("없음", "None")}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5 border-b border-orange-200 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-orange-400 text-[10px] font-bold text-white shadow-sm">
                B
              </span>
              <span className="text-xs font-bold text-orange-700">
                {t("B에만 있는 성분", "Only in B")}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {(cRes.only_b || []).map((s, i) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold text-gray-800">
                    {s.name}
                  </span>
                  {s.note && (
                    <span className="ml-1 text-gray-500">
                      · {s.note}
                    </span>
                  )}
                </div>
              ))}
              {(!cRes.only_b || cRes.only_b.length === 0) && (
                <p className="text-xs text-gray-400">
                  {t("없음", "None")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Caution Combos */}
      {cRes.forbidden_combos && cRes.forbidden_combos.length > 0 && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-base">🚫</span>
            <p className="text-sm font-bold text-rose-800">{t("주의 콤보", "Caution Combos")}</p>
          </div>
          {cRes.forbidden_combos.map((combo, i) => (
            <div key={i} className="mb-2 last:mb-0 rounded-xl border border-rose-100 bg-white/60 p-3">
              <p className="text-xs font-bold text-rose-600 mb-0.5">{combo.ingredients}</p>
              <p className="text-[11px] leading-relaxed text-gray-600"><Md>{combo.reason}</Md></p>
            </div>
          ))}
        </div>
      )}

      {/* Usage Guide */}
      {cRes.usage_guide && (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-base">📋</span>
            <p className="text-sm font-bold text-sky-800">{t("사용 가이드", "Usage Guide")}</p>
          </div>
          {(() => {
            const guide = cRes.usage_guide!;
            return (
              <div className="space-y-2">
                {guide.best_time && <div className="flex gap-2 items-start"><span className="shrink-0">⏰</span><div><p className="text-[10px] font-bold text-sky-600">사용 시간</p><p className="text-xs text-gray-600">{guide.best_time}</p></div></div>}
                {guide.effect_timeline && <div className="flex gap-2 items-start"><span className="shrink-0">📅</span><div><p className="text-[10px] font-bold text-sky-600">효과 시기</p><p className="text-xs text-gray-600">{guide.effect_timeline}</p></div></div>}
                {guide.beginner_tips?.map((tip, i) => <p key={i} className="text-xs text-gray-600 ml-6">· {tip}</p>)}
              </div>
            );
          })()}
        </div>
      )}

      {/* Verdict */}
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-base">💬</span>
          <p className="text-sm font-bold text-amber-800">
            {t("최종 의견", "Verdict")}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-gray-700">
          <Md>{cRes.verdict}</Md>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            const title = "skindit 성분 비교 결과"
            const text = `${cRes.summary}\n\n${cRes.verdict || ""}`
            const shareUrl = historyId ? `${SITE_URL}/share/${historyId}` : `${SITE_URL}?tab=compare`
            if (navigator.share) {
              navigator
                .share({ title, text, url: shareUrl })
                .catch(() => {})
            } else {
              navigator.clipboard.writeText(
                `${title}\n${text}\n${shareUrl}`
              )
              alert(
                lang === "ko"
                  ? "비교 결과 복사했어요! 친구한테 보내주세요~"
                  : "Result copied!"
              )
            }
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 py-3.5 text-sm font-semibold text-purple-600 transition-all hover:bg-purple-100"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          {t("결과 공유", "Share")}
        </button>
        <button
          onClick={reset}
          className="hover:bg-pastel-lavender/30 flex-1 rounded-2xl border border-gray-200 bg-white/80 py-3.5 text-sm font-semibold text-gray-500 backdrop-blur transition-all hover:border-purple-200 hover:text-purple-600"
        >
          {t("← 새 비교", "← New")}
        </button>
      </div>
    </div>
  )
}
