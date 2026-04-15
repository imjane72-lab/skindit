"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SITE_URL } from "@/lib/constants"
import NavBar from "@/components/ui/NavBar"
import Md from "@/components/ui/Md"
import ResultSection from "@/components/analysis/shared/ResultSection"
import ConcernCard from "@/components/analysis/ConcernCard"
import IngredientPill from "@/components/analysis/shared/IngredientPill"
import SafetyChart from "@/components/analysis/SafetyChart"
import { scoreHex as scoreHexFromLib, scoreColor } from "@/lib/score-utils"

/**
 * 결과 상세 뷰. 단일/루틴/비교 분석을 공유 컴포넌트(ResultSection, ConcernCard,
 * IngredientPill, SafetyChart)로 통일. 공유 페이지·분석 결과 페이지와 동일 UI.
 */
function FullResultView({ item, displayType }: { item: HistoryItem; displayType: DisplayType }) {
  const rj = item.resultJson || {}

  if (displayType === "single") {
    const starIngs = (rj.star_ingredients as Array<{name: string; benefit?: string; best_time?: string; synergy?: string[]}>) || []
    const watchOut = (rj.watch_out as Array<{name: string; reason?: string; alternative?: string}>) || []
    const safetyRatings = (rj.safety_ratings as Array<{name: string; score: number; note?: string}>) || []
    const forbiddenCombos = (rj.forbidden_combos as Array<{ingredients: string; reason: string}>) || []
    const usageGuide = rj.usage_guide as {best_time?: string; effect_timeline?: string; beginner_tips?: string[]} | undefined
    const concernAnalysis = (rj.concern_analysis as Array<{concern: string; score: number; comment: string}>) || []

    return (
      <div className="space-y-4">
        {Boolean(rj.overall_comment) && (
          <ResultSection tone="brand" icon="🌿" title="종합 의견">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.overall_comment)}</Md></p>
          </ResultSection>
        )}

        {concernAnalysis.length > 0 && (
          <ResultSection
            tone="neutral"
            icon="🫧"
            title="피부 고민별 분석"
            subtitle="내 피부에 맞는 성분인지 점수로"
            right={<span className="text-[10px] text-gray-400">← 밀어서 보기</span>}
          >
            <div className="hide-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
              {concernAnalysis.map((c, i) => (
                <ConcernCard
                  key={i}
                  concern={c.concern}
                  score={c.score}
                  comment={c.comment}
                  lang="ko"
                  delay={i * 55}
                  index={i}
                />
              ))}
            </div>
          </ResultSection>
        )}

        {starIngs.length > 0 && (
          <ResultSection tone="good" icon="✨" title="주목 성분">
            <div className="space-y-2">
              {starIngs.map((ing, i) => {
                const parts = [
                  ing.benefit || "",
                  ing.best_time ? `⏰ 사용 시간: ${ing.best_time}` : "",
                  ing.synergy?.length ? `🌿 시너지: ${ing.synergy.join(", ")}` : "",
                ].filter(Boolean)
                return (
                  <IngredientPill
                    key={i}
                    name={ing.name}
                    detail={parts.length > 0 ? parts.join("\n\n") : undefined}
                    good
                  />
                )
              })}
            </div>
          </ResultSection>
        )}

        {watchOut.length > 0 && (
          <ResultSection tone="warn" icon="⚠️" title="주의 성분">
            <div className="space-y-2">
              {watchOut.map((ing, i) => (
                <IngredientPill
                  key={i}
                  name={ing.name}
                  detail={`${ing.reason || ""}${ing.alternative ? `\n\n💡 대안: ${ing.alternative}` : ""}`}
                  good={false}
                />
              ))}
            </div>
          </ResultSection>
        )}

        {safetyRatings.length > 0 && (
          <SafetyChart
            ratings={safetyRatings.map(r => ({ name: r.name, score: r.score, note: r.note || "" }))}
            t={(ko) => ko}
          />
        )}

        {forbiddenCombos.length > 0 && (
          <ResultSection tone="warn" icon="🚫" title="주의 콤보">
            <div className="space-y-2">
              {forbiddenCombos.map((c, i) => (
                <div key={i} className="rounded-xl border border-rose-100 bg-white/60 p-3.5">
                  <p className="mb-1 text-xs font-bold text-rose-600">{c.ingredients}</p>
                  <p className="text-[12px] leading-relaxed text-gray-600"><Md>{c.reason}</Md></p>
                </div>
              ))}
            </div>
          </ResultSection>
        )}

        {usageGuide && (
          <ResultSection tone="info" icon="📋" title="사용 가이드" subtitle="이렇게 쓰면 더 좋아요">
            <div className="divide-y divide-sky-100/70">
              {usageGuide.best_time && (
                <div className="py-2.5 first:pt-0">
                  <p className="mb-1 text-base font-bold text-sky-700">최적 사용 시간</p>
                  <p className="text-xs leading-relaxed text-gray-600">{usageGuide.best_time}</p>
                </div>
              )}
              {usageGuide.effect_timeline && (
                <div className="py-2.5 first:pt-0">
                  <p className="mb-1 text-base font-bold text-sky-700">효과 체감 시기</p>
                  <p className="text-xs leading-relaxed text-gray-600">{usageGuide.effect_timeline}</p>
                </div>
              )}
              {usageGuide.beginner_tips && usageGuide.beginner_tips.length > 0 && (
                <div className="py-2.5 first:pt-0 last:pb-0">
                  <p className="mb-1 text-base font-bold text-sky-700">초보자 주의사항</p>
                  {usageGuide.beginner_tips.map((tip, i) => (
                    <p key={i} className="mb-0.5 text-xs leading-relaxed font-medium text-gray-600">· {tip.replace(/\*\*/g, "")}</p>
                  ))}
                </div>
              )}
            </div>
          </ResultSection>
        )}
      </div>
    )
  }

  if (displayType === "routine") {
    const conflicts = (rj.conflicts as Array<{ingredients?: string[]; products?: string[]; severity: string; reason: string}>) || []
    const synergies = (rj.synergies as Array<{ingredients?: string[]; products?: string[]; reason: string}>) || []
    const orderSuggestion = (rj.order_suggestion as string[]) || []
    const recommendations = (rj.recommendations as string[]) || []
    const timeline = (rj.timeline as Array<{product: string; timing: string; reason: string}>) || []
    const usageGuide = rj.usage_guide as {effect_timeline?: string; beginner_tips?: string[]} | undefined

    return (
      <div className="space-y-4">
        {Boolean(rj.routine_comment) && (
          <ResultSection tone="brand" icon="🌿" title="종합 의견">
            <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.routine_comment)}</Md></p>
          </ResultSection>
        )}

        {conflicts.length > 0 && (
          <ResultSection tone="warn" icon="⚠️" title="성분 충돌">
            <div className="space-y-2">
              {conflicts.map((c, i) => (
                <div key={i} className="rounded-xl border border-rose-100 bg-white/60 p-3">
                  <p className="text-sm font-bold text-rose-600">{c.ingredients?.join(" × ")}</p>
                  <p className="mb-1 text-xs text-rose-400">{c.products?.join(" + ")}</p>
                  <p className="text-sm leading-relaxed text-gray-600"><Md>{c.reason}</Md></p>
                </div>
              ))}
            </div>
          </ResultSection>
        )}

        {synergies.length > 0 && (
          <ResultSection tone="good" icon="✨" title="시너지">
            <div className="space-y-2">
              {synergies.map((s, i) => (
                <div key={i} className="rounded-xl border border-emerald-100 bg-white/60 p-3">
                  <p className="mb-1 text-sm font-bold text-emerald-600">{s.ingredients?.join(" + ")}</p>
                  <p className="text-sm leading-relaxed text-gray-600"><Md>{s.reason}</Md></p>
                </div>
              ))}
            </div>
          </ResultSection>
        )}

        {orderSuggestion.length > 0 && (
          <ResultSection tone="info" icon="#️⃣" title="추천 순서">
            {orderSuggestion.map((name, i) => (
              <div key={i} className="mb-1.5 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-xs font-bold text-white">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </div>
            ))}
          </ResultSection>
        )}

        {timeline.length > 0 && (
          <ResultSection tone="brand" icon="⏰" title="루틴 타임라인">
            <div className="grid grid-cols-2 gap-2">
              {timeline.map((t, i) => (
                <div key={i} className={`rounded-xl p-3 ${t.timing === "morning" || t.timing === "both" ? "bg-amber-50 border border-amber-100" : "bg-indigo-50 border border-indigo-100"}`}>
                  <p className="mb-0.5 text-xs font-bold text-gray-700">{t.timing === "morning" ? "🌅" : t.timing === "evening" ? "🌙" : "🌅🌙"} {t.product}</p>
                  <p className="text-xs leading-relaxed text-gray-500">{t.reason}</p>
                </div>
              ))}
            </div>
          </ResultSection>
        )}

        {recommendations.length > 0 && (
          <ResultSection tone="tip" icon="💡" title="개선 팁">
            {recommendations.map((tip, i) => (
              <div key={i} className="mb-1.5 flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-[10px] font-bold text-amber-700">{i + 1}</span>
                <span className="text-sm leading-relaxed text-gray-700">{tip}</span>
              </div>
            ))}
          </ResultSection>
        )}

        {usageGuide && (
          <ResultSection tone="info" icon="📋" title="사용 가이드">
            <div className="divide-y divide-sky-100/70">
              {usageGuide.effect_timeline && (
                <div className="py-2.5 first:pt-0">
                  <p className="mb-1 text-base font-bold text-sky-700">효과 체감 시기</p>
                  <p className="text-xs leading-relaxed text-gray-600">{usageGuide.effect_timeline}</p>
                </div>
              )}
              {usageGuide.beginner_tips && usageGuide.beginner_tips.length > 0 && (
                <div className="py-2.5 first:pt-0 last:pb-0">
                  <p className="mb-1 text-base font-bold text-sky-700">초보자 주의사항</p>
                  {usageGuide.beginner_tips.map((tip, i) => (
                    <p key={i} className="mb-0.5 text-xs leading-relaxed text-gray-600">· {tip}</p>
                  ))}
                </div>
              )}
            </div>
          </ResultSection>
        )}
      </div>
    )
  }

  const names = getCompareNames(item)
  const shared = (rj.shared as Array<{name: string; note?: string}>) || []
  const onlyA = (rj.only_a as Array<{name: string; note?: string}>) || []
  const onlyB = (rj.only_b as Array<{name: string; note?: string}>) || []
  const forbiddenCombos = (rj.forbidden_combos as Array<{ingredients: string; reason: string}>) || []
  const usageGuide = rj.usage_guide as {best_time?: string; effect_timeline?: string; beginner_tips?: string[]} | undefined

  return (
    <div className="space-y-4">
      {Boolean(rj.summary) && (
        <ResultSection tone="brand" icon="🌿" title="비교 요약">
          <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.summary)}</Md></p>
        </ResultSection>
      )}

      {shared.length > 0 && (
        <ResultSection tone="good" icon="🤝" title="공통 성분">
          <div className="flex flex-wrap gap-1.5">
            {shared.map((s, i) => (
              <span key={i} className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {s.name}
              </span>
            ))}
          </div>
        </ResultSection>
      )}

      <div className="grid grid-cols-1 gap-2">
        <ResultSection tone="brand" icon="1" title={names.a}>
          {onlyA.length > 0 ? onlyA.map((s, i) => (
            <div key={i} className="mb-1.5 last:mb-0">
              <span className="text-sm font-medium text-gray-700">{s.name}</span>
              {s.note && <p className="mt-0.5 text-xs text-gray-500">{s.note}</p>}
            </div>
          )) : <p className="text-xs text-gray-400">고유 성분 없음</p>}
        </ResultSection>
        <ResultSection tone="accent" icon="2" title={names.b}>
          {onlyB.length > 0 ? onlyB.map((s, i) => (
            <div key={i} className="mb-1.5 last:mb-0">
              <span className="text-sm font-medium text-gray-700">{s.name}</span>
              {s.note && <p className="mt-0.5 text-xs text-gray-500">{s.note}</p>}
            </div>
          )) : <p className="text-xs text-gray-400">고유 성분 없음</p>}
        </ResultSection>
      </div>

      {forbiddenCombos.length > 0 && (
        <ResultSection tone="warn" icon="🚫" title="주의 콤보">
          <div className="space-y-2">
            {forbiddenCombos.map((c, i) => (
              <div key={i} className="rounded-xl border border-rose-100 bg-white/60 p-3">
                <p className="mb-1 text-sm font-bold text-rose-600">{c.ingredients}</p>
                <p className="text-xs leading-relaxed text-gray-600"><Md>{c.reason}</Md></p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {usageGuide && (
        <ResultSection tone="info" icon="📋" title="사용 가이드">
          <div className="divide-y divide-sky-100/70">
            {usageGuide.best_time && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-base font-bold text-sky-700">사용 시간</p>
                <p className="text-xs leading-relaxed text-gray-600">{usageGuide.best_time}</p>
              </div>
            )}
            {usageGuide.effect_timeline && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-base font-bold text-sky-700">효과 시기</p>
                <p className="text-xs leading-relaxed text-gray-600">{usageGuide.effect_timeline}</p>
              </div>
            )}
            {usageGuide.beginner_tips && usageGuide.beginner_tips.length > 0 && (
              <div className="py-2.5 first:pt-0 last:pb-0">
                <p className="mb-1 text-base font-bold text-sky-700">초보자 주의사항</p>
                {usageGuide.beginner_tips.map((tip, i) => (
                  <p key={i} className="mb-0.5 text-xs leading-relaxed text-gray-600">· {tip}</p>
                ))}
              </div>
            )}
          </div>
        </ResultSection>
      )}

      {Boolean(rj.recommendation) && (
        <ResultSection tone="good" icon="💡" title="추천">
          <p className="text-sm leading-relaxed text-gray-700"><Md>{String(rj.recommendation)}</Md></p>
        </ResultSection>
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

// lib/score-utils의 통일 팔레트 사용 (에디토리얼 톤)
const scoreHex = scoreHexFromLib

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
    bg: "bg-lime-50",
    text: "text-lime-700",
    border: "border-lime-200",
    accent: "from-pastel-lime-dark to-lime-300",
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
          <NavBar title="History" />
          <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 rounded-full border-3 border-pastel-lime-dark/30 border-t-pastel-lime-dark animate-spin" />
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
        <NavBar title="History" />

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
                    ? "bg-pastel-lime-dark/10 border-pastel-lime-dark/40 text-gray-800 shadow-sm"
                    : "border-gray-200 bg-white text-gray-400 hover:border-pastel-lime-dark/30 hover:bg-pastel-lime-dark/5"
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
              <div className="h-8 w-8 rounded-full border-3 border-pastel-lime-dark/30 border-t-pastel-lime-dark animate-spin" />
              <p className="mt-4 text-xs text-gray-300">불러오는 중...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="anim-scale-in flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="bg-pastel-lime-dark/10 flex h-24 w-24 items-center justify-center rounded-full">
                  <div className="bg-pastel-lime anim-float flex h-16 w-16 items-center justify-center rounded-full">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-lime-300">
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
                className="bg-pastel-lime-dark px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
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
                            className="flex items-center gap-1.5 text-xs text-pastel-lime-dark transition-colors hover:text-lime-700"
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:border-lime-200 hover:text-pastel-lime-dark disabled:cursor-not-allowed disabled:opacity-30"
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
                            ? "bg-pastel-lime-dark text-white shadow-md"
                            : "border-gray-200 bg-white text-gray-400 hover:border-lime-200 hover:text-pastel-lime-dark"
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:border-lime-200 hover:text-pastel-lime-dark disabled:cursor-not-allowed disabled:opacity-30"
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
