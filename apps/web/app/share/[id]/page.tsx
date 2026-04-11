"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

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
function Pill({ name, detail, good }: { name: string; detail: string; good: boolean }) {
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

/* ── 타입 정의 ── */
interface ShareData {
  id: string
  type: "SINGLE" | "ROUTINE"
  score: number
  resultJson: Record<string, unknown>
  lang: string
  createdAt: string
}

/* ── 결과 뷰 ── */
function SharedResultView({ data }: { data: ShareData }) {
  const rj = data.resultJson || {}
  const isRoutine = data.type === "ROUTINE"
  const isCompare = rj.type === "compare"

  if (!isRoutine && !isCompare) {
    // 단일 성분 분석
    const starIngs = (rj.star_ingredients as Array<{name: string; benefit?: string; best_time?: string; synergy?: string[]}>) || []
    const watchOut = (rj.watch_out as Array<{name: string; reason?: string; alternative?: string}>) || []
    const safetyRatings = (rj.safety_ratings as Array<{name: string; score: number; note?: string}>) || []
    const concernAnalysis = (rj.concern_analysis as Array<{concern: string; score: number; comment: string}>) || []

    return (
      <div className="space-y-3">
        {Boolean(rj.overall_comment) && (
          <Section icon="🌿" title="종합 의견" color="bg-green-50">
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
          <Section icon="✨" title="주목 성분" color="bg-emerald-50/60">
            <div className="space-y-2">
              {starIngs.map((ing, i) => {
                const extra = [ing.benefit || "", ing.best_time ? `⏰ 사용 시간: ${ing.best_time}` : "", ing.synergy ? `🌿 시너지: ${ing.synergy.join(", ")}` : ""].filter(Boolean).join("\n\n")
                return <Pill key={i} name={ing.name} detail={extra} good />
              })}
            </div>
          </Section>
        )}
        {watchOut.length > 0 && (
          <Section icon="⚠️" title="주의 성분" color="bg-rose-50/60">
            <div className="space-y-2">
              {watchOut.map((ing, i) => (
                <Pill key={i} name={ing.name} detail={`${ing.reason || ""}${ing.alternative ? `\n\n💡 대안: ${ing.alternative}` : ""}`} good={false} />
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
        {Boolean(rj.verdict) && (
          <Section icon="✨" title="Verdict" color="bg-amber-50">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.verdict)}</Md></p>
          </Section>
        )}
      </div>
    )
  }

  if (isRoutine) {
    const conflicts = (rj.conflicts as Array<{ingredients?: string[]; products?: string[]; severity: string; reason: string}>) || []
    const synergies = (rj.synergies as Array<{ingredients?: string[]; reason: string}>) || []
    const orderSuggestion = (rj.order_suggestion as string[]) || []
    const recommendations = (rj.recommendations as string[]) || []

    return (
      <div className="space-y-3">
        {Boolean(rj.routine_comment) && (
          <Section icon="🌿" title="종합 의견" color="bg-green-50">
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
        {Boolean(rj.verdict) && (
          <Section icon="✨" title="Verdict" color="bg-amber-50">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.verdict)}</Md></p>
          </Section>
        )}
      </div>
    )
  }

  // 비교 분석
  const shared = (rj.shared as Array<{name: string}>) || []
  const onlyA = (rj.only_a as Array<{name: string; note?: string}>) || []
  const onlyB = (rj.only_b as Array<{name: string; note?: string}>) || []

  return (
    <div className="space-y-3">
      {Boolean(rj.summary) && (
        <Section icon="🌿" title="비교 요약" color="bg-green-50">
          <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.summary)}</Md></p>
        </Section>
      )}
      {shared.length > 0 && (
        <Section icon="🤝" title="공통 성분" color="bg-emerald-50/60">
          <div className="flex flex-wrap gap-1.5">{shared.map((s, i) => <span key={i} className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">{s.name}</span>)}</div>
        </Section>
      )}
      {(onlyA.length > 0 || onlyB.length > 0) && (
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-2xl bg-green-50/50 p-4 border border-green-100">
            <p className="text-xs font-bold text-green-700 mb-2">A 전용 성분</p>
            {onlyA.length > 0 ? onlyA.map((s, i) => (
              <div key={i} className="mb-1.5 last:mb-0">
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
                {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
              </div>
            )) : <p className="text-xs text-gray-400">고유 성분 없음</p>}
          </div>
          <div className="rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
            <p className="text-xs font-bold text-orange-600 mb-2">B 전용 성분</p>
            {onlyB.length > 0 ? onlyB.map((s, i) => (
              <div key={i} className="mb-1.5 last:mb-0">
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
                {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
              </div>
            )) : <p className="text-xs text-gray-400">고유 성분 없음</p>}
          </div>
        </div>
      )}
      {Boolean(rj.verdict) && (
        <Section icon="✨" title="Verdict" color="bg-amber-50">
          <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.verdict)}</Md></p>
        </Section>
      )}
    </div>
  )
}

/* ── 공유 페이지 ── */
export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/share/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl">
          <Nav />
          <div className="flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-3 border-green-200 border-t-green-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl">
          <Nav />
          <div className="px-6 py-16 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-sm font-bold text-gray-700 mb-1">분석 결과를 찾을 수 없어요</p>
            <p className="text-xs text-gray-400 mb-6">링크가 만료되었거나 잘못된 링크일 수 있어요.</p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-linear-to-r from-pastel-lavender-dark via-green-500 to-pastel-rose-dark shadow-md"
            >
              skindit 홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  const rj = data.resultJson || {}
  const productName = String(rj.productName || "")
  const isRoutine = data.type === "ROUTINE"
  const isCompare = rj.type === "compare"
  const title = isCompare ? "성분 비교 결과" : isRoutine ? "루틴 궁합 분석" : productName || "성분 분석 결과"
  const dateStr = new Date(data.createdAt).toLocaleDateString("ko-KR")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl">
        <Nav />

        <div className="px-6 py-8 pb-24">
          {/* Header */}
          <div className="bg-linear-to-r from-pastel-lavender-dark via-green-500 to-pastel-rose-dark px-6 py-6 rounded-2xl mb-6">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">skindit 분석 결과</p>
            <h1 className="font-display text-white text-lg font-extrabold">{title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {!isCompare && <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold text-white">{data.score}점</span>}
              <span className="text-white/60 text-xs">{dateStr}</span>
            </div>
          </div>

          {/* Result */}
          <SharedResultView data={data} />

          {/* CTA */}
          <div className="mt-8 rounded-2xl border border-green-100 bg-green-50/50 p-5 text-center">
            <p className="text-sm font-bold text-gray-700 mb-1">나도 성분 분석해보고 싶다면?</p>
            <p className="text-xs text-gray-400 mb-4">화장품 성분을 AI가 분석해드려요</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-linear-to-r from-pastel-lavender-dark via-green-500 to-pastel-rose-dark shadow-md hover:shadow-lg transition-all"
            >
              skindit 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 네비게이션 바 ── */
function Nav() {
  const router = useRouter()
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/80 h-14 px-6 flex items-center justify-between">
      <button onClick={() => router.push("/")} className="flex items-center gap-3 bg-transparent border-none p-0">
        <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-pastel-lavender-dark via-green-500 to-pastel-rose-dark flex items-center justify-center shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-t from-white/10 to-transparent" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative">
            <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
          </svg>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="font-display text-[17px] font-extrabold text-gray-900 tracking-tight">skin</span>
          <span className="font-accent text-[17px] font-semibold italic text-transparent bg-clip-text bg-linear-to-r from-pastel-lavender-dark to-pastel-rose-dark">dit</span>
        </div>
      </button>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shared</span>
    </nav>
  )
}
