"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SITE_URL } from "@/lib/constants"

/* ── 마크다운 파서 ── */
function Md({ children }: { children: string }) {
  if (!children) return null
  if (!children.includes("**") && !children.includes("\n")) return <>{children}</>
  return <>{children.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold text-gray-800">{part.slice(2, -2)}</strong>
      : part
  )}</>
}

/* ── 섹션 컴포넌트 ── */
function Section({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl ${color} p-4 mb-3`}>
      <p className="mb-2 text-xs font-extrabold flex items-center gap-1.5 text-gray-800">{icon} {title}</p>
      {children}
    </div>
  )
}

/* ── 성분 알약 버튼 ── */
function HistoryPill({ name, detail, good }: { name: string; detail: string; good: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="w-full">
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition-all ${open ? good ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
        <span className={`h-5 w-5 shrink-0 rounded-full ${good ? "bg-emerald-400" : "bg-rose-400"} inline-flex items-center justify-center text-[9px] font-bold text-white`}>{good ? "✓" : "!"}</span>
        <span className="flex-1">{name}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`shrink-0 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && detail && (
        <div className="mt-1.5 rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs leading-relaxed text-gray-600 whitespace-pre-line">
          {detail}
        </div>
      )}
    </div>
  )
}

/* ── 전체 결과 뷰 ── */
function FullResultView({ item, displayType }: { item: HistoryItem; displayType: DisplayType }) {
  const rj = item.resultJson || {}

  // 단일 성분 분석
  if (displayType === "single") {
    const starIngs = (rj.star_ingredients as Array<{name: string; benefit?: string; best_time?: string; synergy?: string[]}>) || []
    const watchOut = (rj.watch_out as Array<{name: string; reason?: string; alternative?: string}>) || []
    const safetyRatings = (rj.safety_ratings as Array<{name: string; score: number; note?: string}>) || []
    const forbiddenCombos = (rj.forbidden_combos as Array<{ingredients: string; reason: string}>) || []
    const usageGuide = rj.usage_guide as {best_time?: string; effect_timeline?: string; beginner_tips?: string[]} | undefined
    const concernAnalysis = (rj.concern_analysis as Array<{concern: string; score: number; comment: string}>) || []

    return (
      <div className="space-y-3">
        {Boolean(rj.overall_comment) && (
          <Section icon="💜" title="종합 의견" color="bg-purple-50">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.overall_comment)}</Md></p>
          </Section>
        )}

        {concernAnalysis.length > 0 && (
          <Section icon="🫧" title="피부 고민별 분석" color="bg-gray-50/80">
            <div className="hide-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
              {concernAnalysis.map((c, i) => (
                <div key={i} className="min-w-50 max-w-55 shrink-0 rounded-xl border border-gray-100 bg-white p-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">{c.concern}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.score >= 80 ? "bg-emerald-50 text-emerald-600" : c.score >= 60 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}>{c.score}점</span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600">{c.comment}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {starIngs.length > 0 && (
          <Section icon="⭐" title="주목 성분" color="bg-emerald-50/60">
            <div className="space-y-2">
              {starIngs.map((ing, i) => {
                const extra = [ing.benefit || "", ing.best_time ? `⏰ 사용 시간: ${ing.best_time}` : "", ing.synergy ? `💜 시너지: ${ing.synergy.join(", ")}` : ""].filter(Boolean).join("\n\n")
                return <HistoryPill key={i} name={ing.name} detail={extra} good />
              })}
            </div>
          </Section>
        )}

        {watchOut.length > 0 && (
          <Section icon="⚠️" title="주의 성분" color="bg-rose-50/60">
            <div className="space-y-2">
              {watchOut.map((ing, i) => (
                <HistoryPill key={i} name={ing.name} detail={`${ing.reason || ""}${ing.alternative ? `\n\n💡 대안: ${ing.alternative}` : ""}`} good={false} />
              ))}
            </div>
          </Section>
        )}

        {safetyRatings.length > 0 && (
          <Section icon="🛡" title="안전 등급" color="bg-gray-50/80">
            <div className="space-y-2.5">
              {safetyRatings.map((r, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{r.name}</span>
                    <span className={`text-xs font-bold ${r.score <= 2 ? "text-emerald-600" : r.score <= 6 ? "text-amber-600" : "text-rose-600"}`}>{r.score}/10</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full ${r.score <= 2 ? "bg-emerald-400" : r.score <= 6 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${r.score * 10}%` }} />
                  </div>
                  {r.note && <p className="mt-0.5 text-xs text-gray-400">{r.note}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {forbiddenCombos.length > 0 && (
          <Section icon="🚫" title="절대 금지 콤보" color="bg-rose-50/60">
            {forbiddenCombos.map((c, i) => (
              <div key={i} className="mb-2 last:mb-0 rounded-xl border border-rose-100 bg-white/60 p-3">
                <p className="text-sm font-bold text-rose-600 mb-1">{c.ingredients}</p>
                <p className="text-xs leading-relaxed text-gray-600"><Md>{c.reason}</Md></p>
              </div>
            ))}
          </Section>
        )}

        {usageGuide && (
          <Section icon="📋" title="사용 가이드" color="bg-sky-50/60">
            <div className="space-y-3">
              {usageGuide.best_time && (
                <div className="flex gap-2.5 items-start">
                  <span className="shrink-0 text-base">⏰</span>
                  <div><p className="text-xs font-bold text-sky-600 mb-0.5">최적 사용 시간</p><p className="text-sm text-gray-600 leading-relaxed">{usageGuide.best_time}</p></div>
                </div>
              )}
              {usageGuide.effect_timeline && (
                <div className="flex gap-2.5 items-start">
                  <span className="shrink-0 text-base">📅</span>
                  <div><p className="text-xs font-bold text-sky-600 mb-0.5">효과 체감 시기</p><p className="text-sm text-gray-600 leading-relaxed">{usageGuide.effect_timeline}</p></div>
                </div>
              )}
              {usageGuide.beginner_tips && usageGuide.beginner_tips.length > 0 && (
                <div className="flex gap-2.5 items-start">
                  <span className="shrink-0 text-base">💡</span>
                  <div>
                    <p className="text-xs font-bold text-sky-600 mb-1">초보자 주의사항</p>
                    {usageGuide.beginner_tips.map((tip, i) => <p key={i} className="text-sm text-gray-600 leading-relaxed mb-0.5">· {tip}</p>)}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {Boolean(rj.verdict) && (
          <Section icon="✨" title="Verdict" color="bg-amber-50">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.verdict)}</Md></p>
          </Section>
        )}
      </div>
    )
  }

  // 루틴 분석
  if (displayType === "routine") {
    const conflicts = (rj.conflicts as Array<{ingredients?: string[]; products?: string[]; severity: string; reason: string}>) || []
    const synergies = (rj.synergies as Array<{ingredients?: string[]; products?: string[]; reason: string}>) || []
    const orderSuggestion = (rj.order_suggestion as string[]) || []
    const recommendations = (rj.recommendations as string[]) || []
    const timeline = (rj.timeline as Array<{product: string; timing: string; reason: string}>) || []
    const usageGuide = rj.usage_guide as {effect_timeline?: string; beginner_tips?: string[]} | undefined

    return (
      <div className="space-y-3">
        {Boolean(rj.routine_comment) && (
          <Section icon="💜" title="종합 의견" color="bg-purple-50">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.routine_comment)}</Md></p>
          </Section>
        )}
        {conflicts.length > 0 && (
          <Section icon="⚠️" title="성분 충돌" color="bg-rose-50/60">
            {conflicts.map((c, i) => (
              <div key={i} className="mb-2 last:mb-0 rounded-xl border border-rose-100 bg-white/60 p-3">
                <p className="text-sm font-bold text-rose-600">{c.ingredients?.join(" × ")}</p>
                <p className="text-xs text-rose-400 mb-1">{c.products?.join(" + ")}</p>
                <p className="text-sm leading-relaxed text-gray-600"><Md>{c.reason}</Md></p>
              </div>
            ))}
          </Section>
        )}
        {synergies.length > 0 && (
          <Section icon="✨" title="시너지" color="bg-emerald-50/60">
            {synergies.map((s, i) => (
              <div key={i} className="mb-2 last:mb-0 rounded-xl border border-emerald-100 bg-white/60 p-3">
                <p className="text-sm font-bold text-emerald-600 mb-1">{s.ingredients?.join(" + ")}</p>
                <p className="text-sm leading-relaxed text-gray-600"><Md>{s.reason}</Md></p>
              </div>
            ))}
          </Section>
        )}
        {orderSuggestion.length > 0 && (
          <Section icon="#️⃣" title="추천 순서" color="bg-blue-50/60">
            {orderSuggestion.map((name, i) => (
              <div key={i} className="mb-1.5 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </div>
            ))}
          </Section>
        )}
        {timeline.length > 0 && (
          <Section icon="⏰" title="루틴 타임라인" color="bg-purple-50/60">
            <div className="grid grid-cols-2 gap-2">
              {timeline.map((t, i) => (
                <div key={i} className={`rounded-xl p-3 ${t.timing === "morning" || t.timing === "both" ? "bg-amber-50 border border-amber-100" : "bg-indigo-50 border border-indigo-100"}`}>
                  <p className="text-xs font-bold text-gray-700 mb-0.5">{t.timing === "morning" ? "🌅" : t.timing === "evening" ? "🌙" : "🌅🌙"} {t.product}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.reason}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
        {recommendations.length > 0 && (
          <Section icon="💡" title="개선 팁" color="bg-amber-50/60">
            {recommendations.map((tip, i) => (
              <div key={i} className="mb-1.5 flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-[10px] font-bold text-amber-700">{i + 1}</span>
                <span className="text-sm leading-relaxed text-gray-700">{tip}</span>
              </div>
            ))}
          </Section>
        )}
        {usageGuide && (
          <Section icon="📋" title="사용 가이드" color="bg-sky-50/60">
            {usageGuide.effect_timeline && <div className="flex gap-2 items-start mb-2"><span>📅</span><div><p className="text-xs font-bold text-sky-600">효과 체감 시기</p><p className="text-sm text-gray-600">{usageGuide.effect_timeline}</p></div></div>}
            {usageGuide.beginner_tips?.map((tip, i) => <p key={i} className="text-sm text-gray-600 mb-0.5">· {tip}</p>)}
          </Section>
        )}
        {Boolean(rj.verdict) && (
          <Section icon="✨" title="Verdict" color="bg-amber-50">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.verdict)}</Md></p>
          </Section>
        )}
      </div>
    )
  }

  // 비교 분석
  const names = getCompareNames(item)
  const shared = (rj.shared as Array<{name: string; note?: string}>) || []
  const onlyA = (rj.only_a as Array<{name: string; note?: string}>) || []
  const onlyB = (rj.only_b as Array<{name: string; note?: string}>) || []
  const forbiddenCombos = (rj.forbidden_combos as Array<{ingredients: string; reason: string}>) || []
  const usageGuide = rj.usage_guide as {best_time?: string; effect_timeline?: string; beginner_tips?: string[]} | undefined

  return (
    <div className="space-y-3">
      {Boolean(rj.summary) && (
        <Section icon="💜" title="비교 요약" color="bg-purple-50">
          <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.summary)}</Md></p>
        </Section>
      )}
      {shared.length > 0 && (
        <Section icon="🤝" title="공통 성분" color="bg-emerald-50/60">
          <div className="flex flex-wrap gap-1.5">{shared.map((s, i) => <span key={i} className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">{s.name}</span>)}</div>
        </Section>
      )}
      <div className="grid grid-cols-1 gap-2">
        <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100">
          <p className="text-xs font-bold text-purple-600 mb-2">A: {names.a}</p>
          {onlyA.length > 0 ? onlyA.map((s, i) => (
            <div key={i} className="mb-1.5 last:mb-0">
              <span className="text-sm font-medium text-gray-700">{s.name}</span>
              {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
            </div>
          )) : <p className="text-xs text-gray-400">고유 성분 없음</p>}
        </div>
        <div className="rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
          <p className="text-xs font-bold text-orange-600 mb-2">B: {names.b}</p>
          {onlyB.length > 0 ? onlyB.map((s, i) => (
            <div key={i} className="mb-1.5 last:mb-0">
              <span className="text-sm font-medium text-gray-700">{s.name}</span>
              {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
            </div>
          )) : <p className="text-xs text-gray-400">고유 성분 없음</p>}
        </div>
      </div>
      {forbiddenCombos.length > 0 && (
        <Section icon="🚫" title="금지 콤보" color="bg-rose-50/60">
          {forbiddenCombos.map((c, i) => (
            <div key={i} className="mb-2 last:mb-0 rounded-xl border border-rose-100 bg-white/60 p-3">
              <p className="text-sm font-bold text-rose-600 mb-1">{c.ingredients}</p>
              <p className="text-xs leading-relaxed text-gray-600"><Md>{c.reason}</Md></p>
            </div>
          ))}
        </Section>
      )}
      {usageGuide && (
        <Section icon="📋" title="사용 가이드" color="bg-sky-50/60">
          {usageGuide.best_time && <div className="flex gap-2 items-start mb-2"><span>⏰</span><div><p className="text-xs font-bold text-sky-600">사용 시간</p><p className="text-sm text-gray-600">{usageGuide.best_time}</p></div></div>}
          {usageGuide.effect_timeline && <div className="flex gap-2 items-start mb-2"><span>📅</span><div><p className="text-xs font-bold text-sky-600">효과 시기</p><p className="text-sm text-gray-600">{usageGuide.effect_timeline}</p></div></div>}
          {usageGuide.beginner_tips?.map((tip, i) => <p key={i} className="text-sm text-gray-600 mb-0.5">· {tip}</p>)}
        </Section>
      )}
      {Boolean(rj.recommendation) && (
        <Section icon="💡" title="추천" color="bg-emerald-50">
          <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.recommendation)}</Md></p>
        </Section>
      )}
      {Boolean(rj.verdict) && (
        <Section icon="✨" title="Verdict" color="bg-amber-50">
          <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.verdict)}</Md></p>
        </Section>
      )}
    </div>
  )
}

/* ── 타입 정의 ── */
interface HistoryItem {
  id: string
  date: string
  type: "SINGLE" | "ROUTINE"
  score: number
  ingredients: string
  concerns: string[]
  resultJson: Record<string, unknown>
  createdAt: string
}

type DisplayType = "single" | "routine" | "compare"

/* ── 유틸 함수 ── */
const getDisplayType = (item: HistoryItem): DisplayType => {
  if (item.type === "ROUTINE") return "routine"
  if (item.resultJson?.type === "compare") return "compare"
  return "single"
}

const scoreHex = (s: number) => (s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : "#fb7185")
const scoreColor = (s: number) => (s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-rose-600")

const TYPE_CONFIG = {
  single: {
    label: "단일 분석",
    icon: "💊",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    accent: "from-blue-400 to-sky-300",
  },
  routine: {
    label: "루틴 분석",
    icon: "🧴",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    accent: "from-purple-400 to-violet-300",
  },
  compare: {
    label: "성분 비교",
    icon: "⚖️",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    accent: "from-amber-400 to-orange-300",
  },
}

/* ── 미니 점수 링 ── */
function MiniScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const sw = 3
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="score-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={r} style={{ strokeWidth: sw }} />
        <circle
          className="score-ring-fill"
          cx={size / 2} cy={size / 2} r={r}
          stroke={scoreHex(score)}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ strokeWidth: sw }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-display text-[11px] font-extrabold ${scoreColor(score)}`}>{score}</span>
      </div>
    </div>
  )
}

/* ── 네비게이션 바 ── */
function NavBar() {
  const router = useRouter()
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-2xl">
      <button onClick={() => router.push("/")} className="flex items-center gap-3 border-none bg-transparent p-0">
        <div className="from-pastel-lavender-dark to-pastel-rose-dark relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br via-purple-400 shadow-md">
          <div className="absolute inset-0 bg-linear-to-t from-white/10 to-transparent" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative">
            <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
            <circle cx="9.5" cy="9.5" r="1.5" fill="rgba(179,157,219,0.7)" />
            <circle cx="13" cy="11" r="1" fill="rgba(244,143,177,0.6)" />
            <circle cx="10.5" cy="13" r="0.8" fill="rgba(179,157,219,0.5)" />
          </svg>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">skin</span>
          <span className="font-accent from-pastel-lavender-dark to-pastel-rose-dark bg-linear-to-r bg-clip-text text-[17px] font-semibold text-transparent italic">dit</span>
        </div>
      </button>
      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">History</span>
    </nav>
  )
}

/* ── 파싱 유틸 ── */
function getProductName(item: HistoryItem): string {
  return (item.resultJson?.productName as string) || ""
}

function getRoutineProducts(item: HistoryItem): string[] {
  const matches = item.ingredients?.match(/\[([^\]]+)\]/g)
  if (matches) return matches.map(n => n.replace(/[\[\]]/g, ""))
  return []
}

function getCompareNames(item: HistoryItem): { a: string; b: string } {
  // resultJson에서 이름 가져오기 (최신 형식)
  const rA = item.resultJson?.compareNameA as string | undefined
  const rB = item.resultJson?.compareNameB as string | undefined
  const cleanName = (n: string | undefined) => n && n !== "A 제품" && n !== "B 제품" ? n : ""

  if (cleanName(rA) || cleanName(rB)) {
    return { a: cleanName(rA) || "A", b: cleanName(rB) || "B" }
  }

  // ingredients 문자열에서 파싱 (새 형식: [이름]: 성분...)
  const ings = item.ingredients || ""
  const bracketMatch = ings.match(/\[비교\]\s*\[([^\]]+)\]:.*\/\s*\[([^\]]+)\]:/)
  if (bracketMatch) {
    return {
      a: bracketMatch[1] && bracketMatch[1] !== "A 제품" ? bracketMatch[1] : "A",
      b: bracketMatch[2] && bracketMatch[2] !== "B 제품" ? bracketMatch[2] : "B",
    }
  }

  // 옛날 형식 폴백
  const aMatch = ings.match(/A:\s*(.+?)\.{3}/)
  const bMatch = ings.match(/B:\s*(.+?)\.{3}/)
  return {
    a: (aMatch?.[1] || "A").trim().substring(0, 30),
    b: (bMatch?.[1] || "B").trim().substring(0, 30),
  }
}

function getCompareIngredients(item: HistoryItem): { a: string; b: string } {
  const ings = item.ingredients || ""
  // 새 형식: [비교] [이름]: 성분... / [이름]: 성분...
  const newMatch = ings.match(/\[비교\]\s*\[[^\]]*\]:\s*(.*?)\s*\/\s*\[[^\]]*\]:\s*(.*)/)
  if (newMatch) return { a: (newMatch[1] || "").trim(), b: (newMatch[2] || "").trim() }
  // 이전 형식: [비교] A: 성분... / B: 성분...
  const oldMatch = ings.match(/\[비교\]\s*A:\s*(.*?)\s*\/\s*B:\s*(.*)/)
  if (oldMatch) return { a: (oldMatch[1] || "").trim(), b: (oldMatch[2] || "").trim() }
  return { a: "", b: "" }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
  const w = weekdays[d.getDay()]
  return `${month}/${day} (${w})`
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
}

/* ── 히스토리 메인 페이지 ── */
export default function HistoryPage() {
  const { status } = useSession()
  const router = useRouter()

  const [lang, setLang] = useState("ko")
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko") }, [])
  const t = (ko: string, en: string) => lang === "ko" ? ko : en

  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | DisplayType>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const LIMIT = 15

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin")
  }, [status, router])

  const [allItems, setAllItems] = useState<HistoryItem[]>([])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      // 비교와 단일 분석이 모두 SINGLE 타입으로 저장되므로, 전체를 가져와서 클라이언트에서 분류
      const apiType = filter === "routine" ? "ROUTINE" : filter === "single" || filter === "compare" ? "SINGLE" : undefined
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        ...(apiType && { type: apiType }),
      })
      const res = await fetch(`/api/history?${params}`)
      if (res.ok) {
        const data = await res.json()
        let raw: HistoryItem[] = data.data || data.items || []

        // 클라이언트에서 비교/단일 분류 필터링
        if (filter === "compare") {
          raw = raw.filter(item => item.resultJson?.type === "compare")
        } else if (filter === "single") {
          raw = raw.filter(item => item.resultJson?.type !== "compare")
        }

        setAllItems(raw)
        setTotalPages(Math.ceil(raw.length / LIMIT) || 1)
        setItems(raw.slice((page - 1) * LIMIT, page * LIMIT))
      }
    } catch { /* network error */ }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => {
    if (status === "authenticated") fetchHistory()
  }, [status, fetchHistory])

  // 페이지 변경 시 클라이언트에서 슬라이싱
  useEffect(() => {
    setItems(allItems.slice((page - 1) * LIMIT, page * LIMIT))
  }, [page, allItems])

  const handleDelete = async (id: string) => {
    if (!confirm(t("이 기록 지울까?", "Delete this?"))) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        const updated = allItems.filter(i => i.id !== id)
        setAllItems(updated)
        setTotalPages(Math.ceil(updated.length / LIMIT) || 1)
        if (expandedId === id) setExpandedId(null)
      }
    } catch { alert(t("삭제 실패했어요 ㅠ", "Delete failed ㅠ")) }
    finally { setDeleting(null) }
  }

  const handleFilterChange = (f: "all" | DisplayType) => {
    setFilter(f)
    setPage(1)
    setExpandedId(null)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-160 bg-white shadow-xl">
          <NavBar />
          <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 rounded-full border-3 border-purple-200 border-t-purple-500 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  // 요약 카운트
  const typeCounts = { single: 0, routine: 0, compare: 0 }
  items.forEach(item => { typeCounts[getDisplayType(item)]++ })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative mx-auto min-h-screen max-w-160 overflow-hidden bg-white shadow-xl">
        <NavBar />

        <div className="px-6 py-8 pb-24">
          {/* Header */}
          <div className="mb-6 anim-fade-up">
            <h1 className="font-display mb-1 text-2xl font-extrabold text-gray-900">{t("분석 기록", "Analysis History")}</h1>
            <p className="text-sm text-gray-400">{t("분석했던 성분이랑 결과를 다시 볼 수 있어요~", "Review your past analyses~")}</p>
          </div>

          {/* 필터 버튼 */}
          <div className="mb-6 flex gap-2 anim-fade-up" style={{ animationDelay: "0.05s" }}>
            {([
              { id: "all" as const, label: "전체", icon: "📋" },
              { id: "single" as const, label: "단일", icon: "💊" },
              { id: "routine" as const, label: "루틴", icon: "🧴" },
              { id: "compare" as const, label: "비교", icon: "⚖️" },
            ]).map(f => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                  filter === f.id
                    ? "from-pastel-lavender-dark to-pastel-rose-dark border-transparent bg-linear-to-r text-white shadow-md"
                    : "border-gray-200 bg-white text-gray-400 hover:border-purple-200 hover:text-purple-500"
                }`}
              >
                <span className="text-sm">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-3 border-purple-200 border-t-purple-500 animate-spin" />
              <p className="mt-4 text-xs text-gray-300">불러오는 중...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="anim-scale-in flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="bg-pastel-lavender/50 flex h-24 w-24 items-center justify-center rounded-full">
                  <div className="bg-pastel-lavender anim-float flex h-16 w-16 items-center justify-center rounded-full">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-purple-300">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="font-display mb-1 text-base font-bold text-gray-500">{t("아직 분석 기록이 없어요~", "No analysis history yet~")}</p>
              <p className="mb-6 text-xs text-gray-300">{t("성분 분석하면 여기에 쌓여요! ✨", "Analyses will appear here! ✨")}</p>
              <button
                onClick={() => router.push("/")}
                className="from-pastel-lavender-dark to-pastel-rose-dark rounded-full bg-linear-to-r px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
              >
                {t("첫 분석 해보기", "Try First Analysis")}
              </button>
            </div>
          ) : (
            /* 카드 리스트 */
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => {
                const displayType = getDisplayType(item)
                const config = TYPE_CONFIG[displayType]
                const isExpanded = expandedId === item.id
                const isCompare = displayType === "compare"

                return (
                  <div
                    key={item.id}
                    className="anim-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                    style={{ animationDelay: `${0.04 * (idx + 1)}s` }}
                  >
                    {/* 카드 헤더 */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="flex w-full items-center gap-3.5 border-none bg-transparent p-4 text-left"
                    >
                      {/* 점수 링 또는 비교 아이콘 */}
                      {isCompare ? (
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.bg}`}>
                          <span className="text-lg">{config.icon}</span>
                        </div>
                      ) : (
                        <MiniScoreRing score={item.score} />
                      )}

                      <div className="min-w-0 flex-1">
                        {/* 분석 타입 태그 + 날짜 */}
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${config.bg} ${config.text}`}>
                            {config.icon} {config.label}
                          </span>
                          <span className="text-[11px] text-gray-300">{formatDate(item.createdAt || item.date)}</span>
                        </div>

                        {/* Title */}
                        {displayType === "single" && (
                          <p className="truncate text-sm font-bold text-gray-800">
                            {getProductName(item) || "단일 제품 분석"}
                          </p>
                        )}
                        {displayType === "routine" && (
                          <p className="truncate text-sm font-bold text-gray-800">
                            {getRoutineProducts(item).join(" × ") || "루틴 궁합 분석"}
                          </p>
                        )}
                        {displayType === "compare" && (() => {
                          const names = getCompareNames(item)
                          return (
                            <p className="truncate text-sm font-bold text-gray-800">
                              {names.a} <span className="font-normal text-gray-400">vs</span> {names.b}
                            </p>
                          )
                        })()}

                        {/* 미리보기 텍스트 */}
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-400">
                          {displayType === "routine"
                            ? String(item.resultJson?.routine_comment || "루틴 분석 결과")
                            : displayType === "compare"
                            ? String(item.resultJson?.summary || "두 제품 비교 결과")
                            : String(item.resultJson?.overall_comment || item.ingredients?.replace(/^\[.*?\]\s*/, "")).substring(0, 60)}
                        </p>
                      </div>

                      {/* 비교 분석 외 점수 뱃지 */}
                      {!isCompare && (
                        <div className={`shrink-0 rounded-lg px-2 py-1 text-center ${item.score >= 80 ? "bg-emerald-50" : item.score >= 60 ? "bg-amber-50" : "bg-rose-50"}`}>
                          <span className={`text-xs font-extrabold ${scoreColor(item.score)}`}>{item.score}</span>
                        </div>
                      )}

                      {/* Chevron */}
                      <svg
                        width="14" height="14" viewBox="0 0 16 16" fill="none"
                        className={`shrink-0 text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {/* 펼쳐진 상세 내용 */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 anim-fade-up">
                        {/* Date */}
                        <p className="mb-3 text-[11px] text-gray-400">
                          {formatFullDate(item.createdAt || item.date)}
                        </p>

                        <FullResultView item={item} displayType={displayType} />

                        {/* Share + Delete */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const comment = String(item.resultJson?.overall_comment || item.resultJson?.routine_comment || item.resultJson?.summary || "")
                              const verdict = String(item.resultJson?.verdict || "")
                              const title = displayType === "compare" ? "skindit 성분 비교 결과" : `skindit 분석 결과: ${item.score}점`
                              const text = `${comment}\n${verdict}`.trim()
                              const shareUrl = `${SITE_URL}/share/${item.id}`
                              if (navigator.share) {
                                navigator.share({ title, text, url: shareUrl }).catch(() => {})
                              } else {
                                navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`)
                                alert("공유 링크가 복사되었어요!")
                              }
                            }}
                            className="flex items-center gap-1.5 text-xs text-purple-400 transition-colors hover:text-purple-600"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                            </svg>
                            <span>공유</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="flex items-center gap-1.5 text-xs text-gray-300 transition-colors hover:text-rose-500 disabled:opacity-40"
                          >
                            {deleting === item.id ? (
                              <div className="h-3.5 w-3.5 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin" />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1M2.5 4h11M6 7v5M10 7v5M3.5 4l.5 9a2 2 0 002 2h4a2 2 0 002-2l.5-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            <span>삭제</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && items.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 anim-fade-up" style={{ animationDelay: "0.3s" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:border-purple-200 hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - (arr[idx - 1] ?? 0) > 1
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-xs text-gray-300">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                          p === page
                            ? "from-pastel-lavender-dark to-pastel-rose-dark border-transparent bg-linear-to-r text-white shadow-md"
                            : "border-gray-200 bg-white text-gray-400 hover:border-purple-200 hover:text-purple-500"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:border-purple-200 hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
