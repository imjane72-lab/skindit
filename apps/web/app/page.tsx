"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { SITE_URL } from "@/lib/constants"

/* ── data ── */
const CONCERNS = [
  {
    id: "redness",
    ko: "홍조",
    en: "Redness",
    icon: "🔴",
    color: "bg-pastel-rose text-pink-700 border-pink-200",
  },
  {
    id: "sensitive",
    ko: "민감성",
    en: "Sensitive",
    icon: "🫧",
    color: "bg-pastel-lavender text-purple-700 border-purple-200",
  },
  {
    id: "pores",
    ko: "모공",
    en: "Pores",
    icon: "🔬",
    color: "bg-pastel-sky text-blue-700 border-blue-200",
  },
  {
    id: "dryness",
    ko: "건조함",
    en: "Dryness",
    icon: "🏜",
    color: "bg-pastel-peach text-amber-700 border-amber-200",
  },
  {
    id: "acne",
    ko: "트러블",
    en: "Acne",
    icon: "💥",
    color: "bg-pastel-rose text-rose-700 border-rose-200",
  },
  {
    id: "brightening",
    ko: "미백",
    en: "Brightening",
    icon: "✨",
    color: "bg-pastel-lemon text-yellow-700 border-yellow-200",
  },
  {
    id: "barrier",
    ko: "장벽손상",
    en: "Barrier",
    icon: "🛡",
    color: "bg-pastel-mint text-teal-700 border-teal-200",
  },
  {
    id: "aging",
    ko: "노화",
    en: "Anti-aging",
    icon: "🌿",
    color: "bg-pastel-lilac text-purple-700 border-purple-200",
  },
  {
    id: "blackhead",
    ko: "블랙헤드",
    en: "Blackheads",
    icon: "⚫",
    color: "bg-gray-100 text-gray-700 border-gray-300",
  },
  {
    id: "darkcircle",
    ko: "다크서클",
    en: "Dark Circles",
    icon: "👁",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "pigmentation",
    ko: "색소침착",
    en: "Pigmentation",
    icon: "🟤",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "flaking",
    ko: "각질",
    en: "Flaking",
    icon: "🍂",
    color: "bg-pastel-peach text-orange-700 border-orange-200",
  },
]

const TRENDING = [
  {
    id: "pdrn",
    ko: "PDRN",
    en: "PDRN",
    icon: "🧬",
    gradient: "from-sky-100 to-blue-50",
  },
  {
    id: "retinol",
    ko: "레티놀",
    en: "Retinol",
    icon: "✨",
    gradient: "from-amber-100 to-orange-50",
  },
  {
    id: "centella",
    ko: "센텔라",
    en: "Centella",
    icon: "🌿",
    gradient: "from-emerald-100 to-green-50",
  },
  {
    id: "vitamin_c",
    ko: "비타민C",
    en: "Vitamin C",
    icon: "🍊",
    gradient: "from-yellow-100 to-lime-50",
  },
  {
    id: "niacinamide",
    ko: "나이아신아마이드",
    en: "Niacinamide",
    icon: "💧",
    gradient: "from-purple-100 to-violet-50",
  },
  {
    id: "ceramide",
    ko: "세라마이드",
    en: "Ceramide",
    icon: "🛡",
    gradient: "from-teal-100 to-cyan-50",
  },
  {
    id: "hyaluronic",
    ko: "히알루론산",
    en: "Hyaluronic Acid",
    icon: "💦",
    gradient: "from-blue-100 to-indigo-50",
  },
  {
    id: "peptide",
    ko: "펩타이드",
    en: "Peptides",
    icon: "🔗",
    gradient: "from-pink-100 to-rose-50",
  },
]

const SAMPLE_S_KO = `정제수, 글리세린, 나이아신아마이드, 병풀추출물, 세라마이드NP, 히알루론산, 판테놀, 베타글루칸, 아데노신, 알란토인, 부틸렌글라이콜, 히알루론산나트륨, 마데카소사이드, 향료, 변성알코올, 메틸파라벤`
const SAMPLE_S_EN = `Water, Glycerin, Niacinamide, Centella Asiatica Extract, Ceramide NP, Hyaluronic Acid, Panthenol, Beta-Glucan, Adenosine, Allantoin, Butylene Glycol, Sodium Hyaluronate, Madecassoside, Fragrance, Alcohol Denat, Methylparaben`

const SAMPLE_R = [
  {
    id: 1,
    name: "나이아신아마이드 세럼",
    ingredients:
      "Water, Niacinamide, Zinc PCA, Glycerin, Panthenol, Sodium Hyaluronate",
  },
  {
    id: 2,
    name: "세라마이드 크림",
    ingredients:
      "Water, Glycerin, Ceramide NP, Ceramide AP, Cholesterol, Sodium Hyaluronate, Dimethicone",
  },
  {
    id: 3,
    name: "선크림 SPF50",
    ingredients:
      "Water, Zinc Oxide, Glycerin, Niacinamide, Alcohol Denat, Retinol, Fragrance",
  },
]

/* ── score helpers ── */
const scoreColor = (s: number) =>
  s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-rose-600"
const scoreHex = (s: number) =>
  s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : "#fb7185"
const scoreGradient = (s: number) =>
  s >= 80
    ? "from-emerald-400 to-teal-300"
    : s >= 60
      ? "from-amber-400 to-orange-300"
      : "from-rose-400 to-pink-300"
const scoreBg = (s: number) =>
  s >= 80 ? "bg-emerald-50" : s >= 60 ? "bg-amber-50" : "bg-rose-50"
const scoreBorder = (s: number) =>
  s >= 80
    ? "border-emerald-200"
    : s >= 60
      ? "border-amber-200"
      : "border-rose-200"
const scoreLabel = (s: number, lang: string) =>
  s >= 80
    ? lang === "ko"
      ? "좋음"
      : "Good"
    : s >= 60
      ? lang === "ko"
        ? "보통"
        : "Fair"
      : lang === "ko"
        ? "주의"
        : "Caution"

/* ── API ── */
const API_HEADERS = {
  "Content-Type": "application/json",
  "x-skindit-client": "web",
}

async function callAI(sys: string, usr: string) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify({ system: sys, user: usr }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message)
  const raw = d.content[0].text.replace(/```json|```/g, "").trim()
  try {
    return JSON.parse(raw)
  } catch {
    // JSON이 잘렸을 때 — 닫는 괄호 추가 시도
    const fixed = raw + (raw.includes('"verdict"') ? '"}' : '"}]}')
    try {
      return JSON.parse(fixed)
    } catch {
      throw new Error("분석 결과를 처리하지 못했어요. 다시 시도해주세요.")
    }
  }
}

async function callAIText(sys: string, usr: string) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify({ system: sys, user: usr }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message)
  return d.content[0].text.trim()
}

/* ── Animated counter ── */
/* ── Markdown parser (headers, bold, bullets, star ratings) ── */
function Md({ children }: { children: string }) {
  if (!children) return null
  const lines = children.split("\n")
  return (
    <>
      {lines.map((line, li) => {
        const trimmed = line.trim()
        if (!trimmed) return <br key={li} />
        // ## sub-headers
        if (trimmed.startsWith("## ")) {
          return <p key={li} className="mt-2.5 mb-1 text-xs font-extrabold text-purple-600">{trimmed.slice(3)}</p>
        }
        // # headers
        if (trimmed.startsWith("# ")) {
          return <p key={li} className="mt-3 mb-1.5 text-sm font-extrabold text-gray-800">{trimmed.slice(2)}</p>
        }
        // Bullet lists
        if (trimmed.startsWith("- ")) {
          const content = trimmed.slice(2)
          return (
            <div key={li} className="flex gap-1.5 ml-1 mb-0.5">
              <span className="shrink-0 text-purple-400">·</span>
              <span>{parseBold(content)}</span>
            </div>
          )
        }
        // Star ratings
        if (trimmed.includes("★")) {
          return <p key={li} className="font-bold text-amber-600 mt-1">{trimmed}</p>
        }
        // Section headers (bold line ending with :)
        if (trimmed.endsWith(":") && !trimmed.includes(" ") === false && trimmed.length < 30) {
          return <p key={li} className="mt-2.5 mb-1 text-xs font-extrabold text-purple-600">{trimmed}</p>
        }
        // Regular text with bold parsing
        return <span key={li}>{parseBold(trimmed)}{li < lines.length - 1 ? " " : ""}</span>
      })}
    </>
  )
}

function parseBold(text: string): React.ReactNode {
  if (!text.includes("**")) return text
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold text-gray-800">{part.slice(2, -2)}</strong>
      : part
  )
}

function Counter({ to, dur = 900 }: { to: number; dur?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let s: number | null = null
    const tick = (ts: number) => {
      if (!s) s = ts
      const p = Math.min((ts - s) / dur, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setN(Math.round(to * e))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, dur])
  return <>{n}</>
}

/* ════════════════════════════════════
   CIRCULAR SCORE RING
════════════════════════════════════ */
function ScoreRing({
  score,
  size = 140,
  compact = false,
}: {
  score: number
  size?: number
  compact?: boolean
}) {
  const strokeW = compact ? 4 : 6
  const r = (size - strokeW * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  const numSize = compact ? "text-xl" : "text-4xl"
  const subSize = compact ? "text-[8px]" : "text-[10px]"
  const subGap = compact ? "mt-0" : "mt-0.5"

  return (
    <div className="anim-pop-in relative" style={{ width: size, height: size }}>
      <svg
        className="score-ring"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          style={{ strokeWidth: strokeW }}
        />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={scoreHex(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ strokeWidth: strokeW }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display ${numSize} leading-none font-extrabold tracking-tight ${scoreColor(score)}`}
        >
          <Counter to={score} />
        </span>
        <span
          className={`${subSize} font-semibold tracking-wider text-gray-400 uppercase ${subGap}`}
        >
          / 100
        </span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   SCORE HERO — Result header
════════════════════════════════════ */
function ScoreHero({
  score,
  label,
  comment,
  verdict,
  eyebrow,
}: {
  score: number
  label: string
  comment: string
  verdict?: string
  eyebrow: string
}) {
  return (
    <div className="anim-scale-in relative mb-5 overflow-hidden rounded-3xl">
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${scoreGradient(score)} opacity-10`}
      />
      <div className="blob from-pastel-lavender to-pastel-rose absolute -top-7.5 -right-7.5 h-30 w-30 bg-linear-to-br" />

      <div className="relative p-6">
        <span className="mb-5 inline-block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          {eyebrow}
        </span>

        <div className="mb-5 flex items-center gap-6">
          <ScoreRing score={score} />
          <div className="min-w-0 flex-1">
            <div
              className={`font-display text-3xl font-extrabold tracking-tight ${scoreColor(score)} mb-1`}
            >
              {label}
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-gray-500">
              <Md>{comment}</Md>
            </p>
          </div>
        </div>

        {verdict && (
          <div
            className={`flex items-start gap-3 rounded-2xl p-3.5 ${scoreBg(score)} border ${scoreBorder(score)}`}
          >
            <div
              className={`h-6 w-6 rounded-full bg-linear-to-br ${scoreGradient(score)} mt-0.5 flex shrink-0 items-center justify-center`}
            >
              <span className="text-[10px] font-bold text-white">
                {score >= 80 ? "✓" : score >= 60 ? "!" : "⚠"}
              </span>
            </div>
            <p
              className={`text-[13px] ${scoreColor(score)} leading-relaxed font-medium`}
            >
              <Md>{verdict}</Md>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   CONCERN CARD — glass pastel
════════════════════════════════════ */
const CONCERN_BG = [
  "from-pink-100/80 to-rose-50/60",
  "from-purple-100/80 to-violet-50/60",
  "from-teal-100/80 to-cyan-50/60",
  "from-blue-100/80 to-sky-50/60",
  "from-amber-100/80 to-orange-50/60",
  "from-yellow-100/80 to-lime-50/60",
  "from-violet-100/80 to-fuchsia-50/60",
  "from-green-100/80 to-emerald-50/60",
]

function ConcernCard({
  concern,
  score,
  comment,
  lang,
  delay,
  index,
}: {
  concern: string
  score: number
  comment: string
  lang: string
  delay: number
  index: number
}) {
  const bg = CONCERN_BG[index % CONCERN_BG.length]
  return (
    <div
      className={`max-w-48.75 min-w-42.5 shrink-0 bg-linear-to-br ${bg} anim-pop-in rounded-2xl border border-white/60 p-4 shadow-sm backdrop-blur-sm`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <ScoreRing score={score} size={72} compact />
        <span
          className={`text-[10px] font-bold tracking-wide ${scoreColor(score)} ${scoreBg(score)} rounded-full px-2 py-0.5 uppercase`}
        >
          {scoreLabel(score, lang)}
        </span>
      </div>
      <div className="mb-1 text-xs font-bold text-gray-800">{concern}</div>
      <p className="text-[11px] leading-relaxed text-gray-500"><Md>{comment}</Md></p>
    </div>
  )
}

/* ════════════════════════════════════
   INGREDIENT PILL
════════════════════════════════════ */
function Pill({
  name,
  detail,
  good,
  delay,
}: {
  name: string
  detail: string
  good: boolean
  delay: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="anim-pop-in" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
          open
            ? good
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
            : "border-gray-200 bg-white/80 text-gray-700 hover:border-gray-300 hover:bg-white"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full ${good ? "bg-linear-to-br from-emerald-400 to-teal-300" : "bg-linear-to-br from-rose-400 to-pink-300"} inline-flex shrink-0 items-center justify-center text-[8px] font-extrabold text-white`}
        >
          {good ? "✓" : "!"}
        </span>
        {name}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`ml-0.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline
            points="2,3.5 5,6.5 8,3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="anim-fade-up mt-1.5 rounded-xl border border-white/80 bg-white/60 p-3 text-xs leading-relaxed text-gray-600 shadow-sm backdrop-blur">
          {detail}
        </div>
      )}
    </div>
  )
}

/* ── Severity badge ── */
function SevBadge({ sev, lang }: { sev: string; lang: string }) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en)
  const m: Record<string, { l: string; cls: string }> = {
    high: {
      l: t("높음", "High"),
      cls: "bg-rose-100 text-rose-700 border-rose-200",
    },
    medium: {
      l: t("보통", "Medium"),
      cls: "bg-amber-100 text-amber-700 border-amber-200",
    },
    low: {
      l: t("낮음", "Low"),
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
  }
  const s = m[sev] ?? m.low!
  return (
    <span
      className={`text-[10px] font-bold tracking-wide ${s.cls} rounded-full border px-2.5 py-1`}
    >
      {s.l}
    </span>
  )
}

/* ════════════════════════════════════
   EWG SAFETY CHART
════════════════════════════════════ */
function SafetyChart({
  ratings,
  t,
}: {
  ratings: SafetyRating[]
  t: (ko: string, en: string) => string
}) {
  const barColor = (s: number) =>
    s <= 2 ? "bg-emerald-400" : s <= 6 ? "bg-amber-400" : "bg-rose-400"
  const textColor = (s: number) =>
    s <= 2 ? "text-emerald-700" : s <= 6 ? "text-amber-700" : "text-rose-700"
  const bgColor = (s: number) =>
    s <= 2 ? "bg-emerald-50" : s <= 6 ? "bg-amber-50" : "bg-rose-50"
  return (
    <div className="glass-card mb-5 rounded-2xl bg-linear-to-br from-gray-50/50 to-white/30 p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2.5 border-b border-gray-100/60 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-orange-300">
          <span className="text-[8px] font-bold text-white">SD</span>
        </div>
        <div>
          <span className="text-xs font-bold tracking-wide text-gray-800">
            {t("skindit 안전 등급", "skindit Safety Ratings")}
          </span>
          <p className="text-[10px] text-gray-400">
            {t("성분별 안전도를 분석했어요", "Ingredient safety analysis")}
          </p>
        </div>
      </div>
      <div className="mt-3 mb-3 flex gap-3 text-[10px] font-semibold">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {t("안전", "Safe")} 1-2
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {t("보통", "Moderate")} 3-6
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          {t("위험", "Hazard")} 7-10
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {ratings.map((r, i) => (
          <div
            key={i}
            className="anim-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="max-w-[60%] truncate text-xs font-semibold text-gray-700">
                {r.name}
              </span>
              <span
                className={`text-xs font-bold ${textColor(r.score)} ${bgColor(r.score)} rounded-full px-2 py-0.5`}
              >
                {r.score}/10
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${barColor(r.score)} anim-bar-grow`}
                style={{
                  width: `${r.score * 10}%`,
                  animationDelay: `${i * 40 + 100}ms`,
                }}
              />
            </div>
            {r.note && (
              <p className="mt-0.5 text-[10px] text-gray-400">{r.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Interfaces ── */
interface IngredientItem {
  name: string
  benefit?: string
  reason?: string
  alternative?: string
  best_time?: string
  synergy?: string[]
}
interface ConcernAnalysis {
  concern: string
  score: number
  comment: string
}
interface SafetyRating {
  name: string
  score: number
  note: string
}
interface ForbiddenCombo { ingredients: string; reason: string }
interface UsageGuide { best_time?: string; effect_timeline?: string; beginner_tips?: string[] }
interface SingleRes {
  error?: boolean
  errorMessage?: string
  overall_score: number
  overall_comment: string
  verdict?: string
  concern_analysis?: ConcernAnalysis[]
  star_ingredients?: IngredientItem[]
  watch_out?: IngredientItem[]
  safety_ratings?: SafetyRating[]
  forbidden_combos?: ForbiddenCombo[]
  usage_guide?: UsageGuide
}
interface RoutineConflict {
  ingredients?: string[]
  products?: string[]
  severity: string
  reason: string
}
interface RoutineSynergy {
  ingredients?: string[]
  products?: string[]
  reason: string
}
interface RoutineTimeline {
  product: string
  timing: "morning" | "evening" | "both"
  reason: string
}
interface RoutineRes {
  error?: boolean
  errorMessage?: string
  routine_score: number
  routine_comment: string
  verdict?: string
  conflicts?: RoutineConflict[]
  synergies?: RoutineSynergy[]
  order_suggestion?: string[]
  recommendations?: string[]
  timeline?: RoutineTimeline[]
  usage_guide?: UsageGuide
}
interface Product {
  id: number
  name: string
  ingredients: string
}
interface CompareItem {
  name: string
  inA: boolean
  inB: boolean
  note: string
}
interface CompareRes {
  error?: boolean
  errorMessage?: string
  summary: string
  shared: CompareItem[]
  only_a: CompareItem[]
  only_b: CompareItem[]
  recommendation: string
  verdict: string
  forbidden_combos?: ForbiddenCombo[]
  usage_guide?: UsageGuide
}

/* ════════════════════════════════════
   SINGLE RESULT
════════════════════════════════════ */
function SingleResult({
  res,
  t,
  reset,
  lang,
}: {
  res: SingleRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
}) {
  return (
    <div className="anim-scale-in">
      <ScoreHero
        score={res.overall_score}
        label={scoreLabel(res.overall_score, lang)}
        comment={res.overall_comment}
        verdict={res.verdict}
        eyebrow={t("성분 분석 결과", "Analysis Result")}
      />

      {/* Concern horizontal scroll */}
      {res.concern_analysis && res.concern_analysis.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-[10px] font-bold tracking-widest whitespace-nowrap text-gray-400 uppercase">
              {t("피부 고민별 분석", "By Concern")}
            </span>
            <div className="h-px flex-1 bg-linear-to-r from-gray-200 to-transparent" />
            <span className="text-[11px] whitespace-nowrap text-gray-300">
              {t("← 스크롤", "scroll →")}
            </span>
          </div>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
            {res.concern_analysis.map((c, i) => (
              <ConcernCard
                key={i}
                concern={c.concern}
                score={c.score}
                comment={c.comment}
                lang={lang}
                delay={i * 55}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ingredients grid */}
      <div className="mb-5 grid grid-cols-1 gap-4">
        {res.star_ingredients && res.star_ingredients.length > 0 && (
          <div className="glass-card rounded-2xl bg-linear-to-br from-emerald-50/50 to-teal-50/30 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 border-b border-emerald-100/60 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-emerald-400 to-teal-300">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <polygon
                    points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5"
                    fill="white"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold tracking-wide text-emerald-700">
                {t("주목 성분", "Key Ingredients")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {res.star_ingredients.map((ing, i) => {
                const extra: string[] = [];
                if (ing.best_time) extra.push(`⏰ ${ing.best_time}`);
                if (ing.synergy) extra.push(`💜 시너지: ${ing.synergy.join(", ")}`);
                const detail = [ing.benefit || "", ...extra].filter(Boolean).join("\n\n");
                return (
                  <Pill key={i} name={ing.name} detail={detail} good delay={i * 45} />
                );
              })}
            </div>
          </div>
        )}

        {res.watch_out && res.watch_out.length > 0 && (
          <div className="glass-card rounded-2xl bg-linear-to-br from-rose-50/50 to-pink-50/30 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 border-b border-rose-100/60 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-rose-400 to-pink-300">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M6 1L11 10H1Z" fill="white" />
                </svg>
              </div>
              <span className="text-xs font-bold tracking-wide text-rose-700">
                {t("주의 성분", "Watch Out")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {res.watch_out.map((ing, i) => (
                <Pill
                  key={i}
                  name={ing.name}
                  detail={`${ing.reason || ""}${ing.alternative ? `\n\n💡 ${t("대안", "Alternative")}: ${ing.alternative}` : ""}`}
                  good={false}
                  delay={i * 45}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EWG Safety Chart */}
      {res.safety_ratings && res.safety_ratings.length > 0 && (
        <SafetyChart ratings={res.safety_ratings} t={t} />
      )}

      {/* Forbidden Combos */}
      {res.forbidden_combos && res.forbidden_combos.length > 0 && (
        <div className="glass-card mb-5 rounded-2xl bg-linear-to-br from-rose-50/50 to-orange-50/30 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5 border-b border-rose-100/60 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-orange-400">
              <span className="text-[10px] font-bold text-white">🚫</span>
            </div>
            <span className="text-xs font-bold tracking-wide text-rose-700">{t("절대 금지 콤보", "Forbidden Combos")}</span>
          </div>
          {res.forbidden_combos.map((combo, i) => (
            <div key={i} className="mb-2 last:mb-0 rounded-xl border border-rose-100 bg-white/60 p-3">
              <p className="text-xs font-bold text-rose-600 mb-0.5">{combo.ingredients}</p>
              <p className="text-[11px] leading-relaxed text-gray-600"><Md>{combo.reason}</Md></p>
            </div>
          ))}
        </div>
      )}

      {/* Usage Guide */}
      {res.usage_guide && (
        <div className="glass-card mb-5 rounded-2xl bg-linear-to-br from-sky-50/50 to-blue-50/30 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5 border-b border-sky-100/60 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-blue-400">
              <span className="text-[10px] font-bold text-white">📋</span>
            </div>
            <span className="text-xs font-bold tracking-wide text-sky-700">{t("사용 가이드", "Usage Guide")}</span>
          </div>
          {(() => {
            const guide = res.usage_guide!;
            return (
              <div className="space-y-2.5">
                {guide.best_time && (
                  <div className="flex gap-2.5 items-start">
                    <span className="shrink-0 text-sm">⏰</span>
                    <div><p className="text-[10px] font-bold text-sky-600 mb-0.5">{t("최적 사용 시간", "Best Time")}</p><p className="text-xs text-gray-600 leading-relaxed">{guide.best_time}</p></div>
                  </div>
                )}
                {guide.effect_timeline && (
                  <div className="flex gap-2.5 items-start">
                    <span className="shrink-0 text-sm">📅</span>
                    <div><p className="text-[10px] font-bold text-sky-600 mb-0.5">{t("효과 체감 시기", "Effect Timeline")}</p><p className="text-xs text-gray-600 leading-relaxed">{guide.effect_timeline}</p></div>
                  </div>
                )}
                {guide.beginner_tips && guide.beginner_tips.length > 0 && (
                  <div className="flex gap-2.5 items-start">
                    <span className="shrink-0 text-sm">💡</span>
                    <div>
                      <p className="text-[10px] font-bold text-sky-600 mb-1">{t("초보자 주의사항", "Beginner Tips")}</p>
                      {guide.beginner_tips.map((tip, i) => (
                        <p key={i} className="text-xs text-gray-600 leading-relaxed mb-0.5">· {tip}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Share + Reset buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const title = `skindit 분석 결과: ${res.overall_score}점`
            const text = `${res.overall_comment}\n\n${res.verdict || ""}`
            if (navigator.share) {
              navigator
                .share({ title, text, url: SITE_URL })
                .catch(() => {})
            } else {
              navigator.clipboard.writeText(
                `${title}\n${text}\n${SITE_URL}`
              )
              alert(
                lang === "ko" ? "결과 복사했어요! 친구한테 보내줘~ 💜" : "Result copied!"
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
          {t("← 새 분석", "← New")}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   ERROR STATE
════════════════════════════════════ */
function ErrState({
  t,
  reset,
  message,
}: {
  t: (ko: string, en: string) => string
  reset: () => void
  message?: string
}) {
  return (
    <div className="anim-fade-in py-20 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-rose-100 to-pink-50 text-2xl shadow-sm">
        ⚠
      </div>
      <p className="font-display mb-2 text-lg font-bold text-gray-900">
        {t("앗 오류가 났어요 ㅠ", "Something went wrong")}
      </p>
      <p className="mb-6 text-sm text-gray-400">
        {message || t("잠시 후에 다시 해주세요~", "Please try again")}
      </p>
      <button
        onClick={reset}
        className="from-pastel-lavender-dark to-pastel-rose-dark rounded-2xl bg-linear-to-r px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
      >
        {t("다시 해볼게요!", "Try Again")}
      </button>
    </div>
  )
}

/* ════════════════════════════════════
   ROOT APP
════════════════════════════════════ */
export default function Page() {
  const { data: session, status } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("skindit_lang") || "ko"
    return "ko"
  })
  const [tab, setTab] = useState("single")
  const [phase, setPhase] = useState("setup")
  const [restored, setRestored] = useState(false)

  // 결과 상태 복원 (클라이언트에서만)
  useEffect(() => {
    history.scrollRestoration = "manual"
    try {
      const raw = sessionStorage.getItem("skindit_result")
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.phase === "result") {
          setTab(saved.tab)
          setPhase("result")
          if (saved.sRes) setSRes(saved.sRes)
          if (saved.rRes) setRRes(saved.rRes)
          if (saved.cRes) setCRes(saved.cRes)
          setRestored(true)
          return
        }
      }
    } catch {
      /* */
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }, [])
  const [concerns, setConcerns] = useState<string[]>([])
  const [profileNote, setProfileNote] = useState("")
  const [profileSkinTypes, setProfileSkinTypes] = useState<string[]>([])
  const [profileConcerns, setProfileConcerns] = useState<string[]>([])
  const [ings, setIngs] = useState("")
  const [productName, setProductName] = useState("")
  const [sRes, setSRes] = useState<SingleRes | null>(null)
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "", ingredients: "" },
    { id: 2, name: "", ingredients: "" },
  ])
  const [rRes, setRRes] = useState<RoutineRes | null>(null)
  // Trending ingredients
  const [trendOpen, setTrendOpen] = useState<string | null>(null)
  const [trendInfo, setTrendInfo] = useState<Record<string, string>>({})
  const [trendLoading, setTrendLoading] = useState(false)
  // Compare
  const [compareA, setCompareA] = useState("")
  const [compareB, setCompareB] = useState("")
  const [compareNameA, setCompareNameA] = useState("")
  const [compareNameB, setCompareNameB] = useState("")
  const [cRes, setCRes] = useState<CompareRes | null>(null)
  // Keep last analysis inputs for re-analysis on language switch
  const [lastIngs, setLastIngs] = useState("")
  const [lastConcerns, setLastConcerns] = useState<string[]>([])
  const [lastProducts, setLastProducts] = useState<Product[]>([])
  // PWA install
  const [showPwaBanner, setShowPwaBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    const dismissed = sessionStorage.getItem("skindit_pwa_dismissed")
    if (dismissed) return
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPwaBanner(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    // iOS Safari: no beforeinstallprompt, show manual guide
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    if (isIos && !isStandalone) setShowPwaBanner(true)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handlePwaInstall = async () => {
    if (deferredPrompt && "prompt" in deferredPrompt) {
      ;(deferredPrompt as { prompt: () => void }).prompt()
    } else {
      // iOS Safari — 설치 방법 안내
      alert(lang === "ko"
        ? "📱 홈 화면에 추가하는 방법:\n\n1. 하단 공유 버튼 (□↑) 탭\n2. '홈 화면에 추가' 선택\n3. 완료!"
        : "📱 How to add to Home Screen:\n\n1. Tap the Share button (□↑)\n2. Select 'Add to Home Screen'\n3. Done!"
      )
    }
    setShowPwaBanner(false)
    sessionStorage.setItem("skindit_pwa_dismissed", "1")
  }

  const dismissPwa = () => {
    setShowPwaBanner(false)
    sessionStorage.setItem("skindit_pwa_dismissed", "1")
  }

  // Camera scan (OCR)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [routineOcrLoading, setRoutineOcrLoading] = useState<
    Record<number, boolean>
  >({})

  const t = (ko: string, en: string) => (lang === "ko" ? ko : en)
  const tl = (l: string, ko: string, en: string) => (l === "ko" ? ko : en)

  const saveResultState = (t: string, s: unknown, r: unknown, c: unknown) => {
    try {
      sessionStorage.setItem(
        "skindit_result",
        JSON.stringify({ tab: t, phase: "result", sRes: s, rRes: r, cRes: c })
      )
    } catch {
      /* */
    }
  }

  const reset = () => {
    setPhase("setup")
    setSRes(null)
    setRRes(null)
    setCRes(null)
    setConcerns(profileConcerns.length > 0 ? [...profileConcerns] : [])
    setIngs("")
    setProductName("")
    setProducts([
      { id: 1, name: "", ingredients: "" },
      { id: 2, name: "", ingredients: "" },
    ])
    setCompareA("")
    setCompareB("")
    setCompareNameA("")
    setCompareNameB("")
    try {
      sessionStorage.removeItem("skindit_result")
    } catch {
      /* */
    }
  }

  // Trending ingredient AI lookup
  const loadTrendInfo = async (id: string, name: string) => {
    if (trendInfo[id]) {
      setTrendOpen(trendOpen === id ? null : id)
      return
    }
    setTrendOpen(id)
    setTrendLoading(true)
    try {
      const raw = await callAIText(
        `스킨케어 성분 전문가. 반존대 말투(~요, ~해요, ~해줘). ${lang === "ko" ? "한국어" : "English"}로 답변. Markdown 형식으로 작성. Verdict에 "추천 강도: ★" 포함.`,
        `"${name}" 성분 완벽 가이드 작성해줘. 아래 형식 그대로:

**작용 메커니즘**
이 성분이 피부에서 하는 일 1-2줄

**최적 사용 시간대**
아침/저녁 언제 쓰는게 좋은지 + 이유

**절대 금지 콤보**
- 같이 쓰면 안 되는 성분: 이유
- 같이 쓰면 안 되는 성분: 이유

**시너지 성분**
- 같이 쓰면 좋은 성분: 이유
- 같이 쓰면 좋은 성분: 이유

**초보자 주의사항**
- 주의할 점 3-4개

**효과 체감 시기**
몇 주부터 효과 나오는지

**Verdict**
추천 강도: ★★★★★ (5점 만점)
과학적 근거 포함해서 추천 이유 2-3줄`
      )
      setTrendInfo((p) => ({ ...p, [id]: raw }))
    } catch {
      setTrendInfo((p) => ({
        ...p,
        [id]:
          lang === "ko" ? "정보를 못 불러왔어 ㅠ" : "Could not load info.",
      }))
    }
    setTrendLoading(false)
  }

  // Compare OCR handler
  const [compareOcrLoading, setCompareOcrLoading] = useState<"A" | "B" | null>(
    null
  )
  const handleCompareOcr = async (target: "A" | "B", file: File) => {
    setCompareOcrLoading(target)
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const resized = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const max = 1500
          let { width, height } = img
          if (width > max || height > max) {
            const ratio = Math.min(max / width, max / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.src = dataUrl
      })
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resized }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (target === "A") setCompareA(data.text)
      else setCompareB(data.text)
    } catch (err) {
      alert(err instanceof Error ? err.message : "OCR failed")
    }
    setCompareOcrLoading(null)
  }

  // Compare analysis
  const runCompareAnalysis = async (
    useLang: string,
    textA: string,
    textB: string
  ) => {
    setPhase("loading")
    const sys = `너는 skindit 언니야. 두 제품 비교해서 친한 동생한테 알려주듯이 말해줘. 지어내기 금지, 입력 성분만 비교하고 성분 설명할 때 친한 언니가 "이거 진짜 중요한데" 하고 알려주듯이,
작용원리부터 주의사항까지 네가 알고 있는 거 다 녹여서 설명해줘.
항목 나열 말고 자연스럽게.

제형 다르면(앰플+크림) 같은 성분 겹쳐도 OK. 같은 제형이면 하나만 추천해줘.
각 성분에 대해 다음을 포함해서 꿀팁을 설명해줘:
- 이 성분이 피부에서 하는 일 (작용 메커니즘 1줄)
- 최적 사용 시간대와 이유
- pH 조건이 있으면 명시
- 절대 같이 쓰면 안 되는 성분 콤보와 이유
- 시너지 나는 성분 콤보
- 초보자 주의사항
- 효과 체감 시기 (빠르면 즉각, 느리면 몇 주)
verdict에서 추천 이유는 과학적 근거까지 대답해줘.

⚠️ 최종의견(verdict)에서 반드시: 추천 이유를 구체적으로 설명 (예: "나이아신아마이드를 꾸준히 쓰면 멜라닌 생성을 억제해서 톤이 밝아져요" 처럼 왜 그런지 과학적 이유까지)

JSON only. Schema:{"summary":"2-3 sentences, 핵심 비교, 반존대","shared":[max 5,{"name":"","inA":true,"inB":true,"note":"겹치는데 괜찮은지+사용팁+시간대"}],"only_a":[max 5,{"name":"","inA":true,"inB":false,"note":"왜 좋은지+사용팁+시너지성분"}],"only_b":[max 5,{"name":"","inA":false,"inB":true,"note":"왜 좋은지+사용팁+시너지성분"}],"forbidden_combos":[max 2,{"ingredients":"A + B","reason":"왜 안 되는지 과학적으로"}],"recommendation":"어떤 피부에 뭐가 맞는지+과학적 이유, 2-3 sentences","usage_guide":{"best_time":"두 제품 각각 언제 쓰면 좋은지","effect_timeline":"효과 체감 시기","beginner_tips":["초보자 팁 2개"]},"verdict":"추천 강도 ★(1-5) + 과학적 근거 포함 추천 이유 2-3 sentences"}. ${useLang === "ko" ? "한국어" : "English"}.`
    const skinContext =
      profileSkinTypes.length > 0
        ? `\n⚠️ 이 사용자의 피부 타입: ${profileSkinTypes.join(", ")} — 이 피부 타입에 더 맞는 제품을 추천해주세요!`
        : ""
    const noteContext = profileNote
      ? `\n⚠️ 사용자 메모 (꼭 반영): ${profileNote}`
      : ""
    const nameA = compareNameA || "A 제품"
    const nameB = compareNameB || "B 제품"
    try {
      const raw = await callAI(
        sys,
        `${nameA} 성분:\n${textA}\n\n${nameB} 성분:\n${textB}${skinContext}${noteContext}\n\n※ A/B 대신 "${nameA}", "${nameB}" 이름으로 대답해주세요.`
      )
      setCRes(raw)
      saveResultState("compare", null, null, raw)
      // 히스토리 저장
      if (status === "authenticated") {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SINGLE",
            ingredients: `[비교] [${nameA}]: ${textA.substring(0, 80)}... / [${nameB}]: ${textB.substring(0, 80)}...`,
            concerns: [],
            score: 0,
            resultJson: {
              ...raw,
              type: "compare",
              compareNameA: nameA,
              compareNameB: nameB,
            },
            lang: useLang,
          }),
        }).catch(() => {})
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      const errRes = {
        error: true,
        errorMessage: msg,
        summary: "",
        shared: [],
        only_a: [],
        only_b: [],
        recommendation: "",
        verdict: "",
      }
      setCRes(errRes)
    }
    setPhase("result")
  }

  // Camera OCR handler
  const handleOcr = async (file: File) => {
    setOcrLoading(true)
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      // Resize to max 1500px
      const resized = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const max = 1500
          let { width, height } = img
          if (width > max || height > max) {
            const ratio = Math.min(max / width, max / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.src = dataUrl
      })
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resized }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setIngs(data.text)
    } catch (err) {
      alert(err instanceof Error ? err.message : "OCR failed")
    }
    setOcrLoading(false)
  }

  // Routine: per-product OCR handler
  const handleRoutineOcr = async (productId: number, file: File) => {
    setRoutineOcrLoading((p) => ({ ...p, [productId]: true }))
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const resized = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const max = 1500
          let { width, height } = img
          if (width > max || height > max) {
            const ratio = Math.min(max / width, max / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.src = dataUrl
      })
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resized }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProducts((ps) =>
        ps.map((x) =>
          x.id === productId ? { ...x, ingredients: data.text } : x
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "OCR failed")
    }
    setRoutineOcrLoading((p) => ({ ...p, [productId]: false }))
  }

  const runSingleAnalysis = async (
    useLang: string,
    ingredientText: string,
    concernIds: string[]
  ) => {
    setPhase("loading")
    const cl = concernIds
      .map((id) => CONCERNS.find((c) => c.id === id))
      .map((c) => (c ? tl(useLang, c.ko, c.en) : ""))
      .join(", ")
    const sys = `너는 skindit 언니야. 아주 친한 언니가 동생한테 알려주듯이 말해줘. 입력된 성분만 분석, 지어내기 금지.

말투 예시: "이 성분 진짜 좋아요~ 꾸준히 쓰면 달라져요!", "레티놀 들어있네? 이건 꼭 저녁에만 바르세요! 아침에 바르면 자외선에 오히려 역효과예요", "알코올이 좀 신경 쓰이네... 민감하면 빼는 게 나을 수도 있어요"

각 성분에 대해 다음을 포함해서 꿀팁을 설명해줘:
- 이 성분이 피부에서 하는 일 (작용 메커니즘 1줄)
- 최적 사용 시간대와 이유
- pH 조건이 있으면 명시
- 절대 같이 쓰면 안 되는 성분 콤보와 이유
- 시너지 나는 성분 콤보
- 초보자 주의사항
- 효과 체감 시기 (빠르면 즉각, 느리면 몇 주)
verdict에서 추천 이유는 과학적 근거까지 대답해줘.
JSON only. Schema:{"overall_score":0-100,"overall_comment":"2-3 sentences, 반존대","concern_analysis":[max 4,{"concern":"","score":0-100,"comment":"꿀팁+주의사항"}],"star_ingredients":[max 4,{"name":"","benefit":"왜 좋은지+사용팁","best_time":"아침/저녁/둘다","synergy":["시너지 성분"]}],"watch_out":[{"name":"","reason":"왜 주의+꿀팁","alternative":"대신 이거~"}],"forbidden_combos":[max 3,{"ingredients":"A + B","reason":"왜 안 되는지"}],"usage_guide":{"best_time":"아침/저녁/둘다 + 이유","effect_timeline":"효과 체감까지 걸리는 시간","beginner_tips":["초보자 주의사항 2-3개"]},"safety_ratings":[max 8,{"name":"","score":1-10,"note":"꿀팁"}],"verdict":"추천 강도 ★(1-5) + 과학적 근거 포함 추천 이유 2-3 sentences"}. watch_out: allergens/irritants only. safety: 1=safe,10=hazard. ${useLang === "ko" ? "한국어" : "English"}.`
    const skinContext =
      profileSkinTypes.length > 0
        ? `\n⚠️ 이 사용자의 피부 타입: ${profileSkinTypes.join(", ")} — 이 피부 타입 기준으로 분석해주세요! 예: 민감성이면 자극 성분 더 엄격하게, 지성이면 유분 많은 성분 주의`
        : ""
    const noteContext = profileNote
      ? `\n⚠️ 사용자 메모 (꼭 반영): ${profileNote}`
      : ""
    try {
      const raw = await callAI(
        sys,
        `Concerns:${cl || "none"}${skinContext}${noteContext}\nIngredients:\n${ingredientText}`
      )
      const norm = (d: number) => (d <= 10 ? d * 10 : d)
      if (raw.overall_score) raw.overall_score = norm(raw.overall_score)
      if (raw.concern_analysis)
        raw.concern_analysis = raw.concern_analysis.map(
          (c: ConcernAnalysis) => ({ ...c, score: norm(c.score) })
        )
      setSRes(raw)
      saveResultState("single", raw, null, null)
      // Save to history if logged in
      if (status === "authenticated") {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SINGLE",
            ingredients: productName
              ? `[${productName}] ${ingredientText}`
              : ingredientText,
            concerns: concernIds,
            score: raw.overall_score || 0,
            resultJson: { ...raw, productName: productName || undefined },
            lang: useLang,
          }),
        }).catch(() => {})
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setSRes({
        error: true,
        errorMessage: msg,
        overall_score: 0,
        overall_comment: "",
      })
    }
    setPhase("result")
  }

  const runRoutineAnalysis = async (useLang: string, prods: Product[]) => {
    setPhase("loading")
    const filled = prods.filter((p) => p.ingredients.trim())
    const list = filled
      .map((p, i) => `[${p.name || `Product${i + 1}`}]: ${p.ingredients}`)
      .join("\n\n")
    const sys = `너는 skindit 언니야. 친한 언니가 루틴 잡아주듯이 알려줘. 지어내기 금지, 입력 성분만 분석.

중복: 같은제형+겹침=점수↓(40~60) "하나만 써도 충분해요~", 다른제형(앰플+크림)=OK(70~85) "세럼으로 흡수시키고 크림으로 가둬주는 거라 좋아요", 상호보완=80~90.

각 성분에 대해 다음을 포함해서 꿀팁을 설명해줘:
- 이 성분이 피부에서 하는 일 (작용 메커니즘 1줄)
- 최적 사용 시간대와 이유
- pH 조건이 있으면 명시
- 절대 같이 쓰면 안 되는 성분 콤보와 이유
- 시너지 나는 성분 콤보
- 초보자 주의사항
- 효과 체감 시기 (빠르면 즉각, 느리면 몇 주)
verdict에서 추천 이유는 과학적 근거까지 대답해줘.

JSON only. Schema:{"routine_score":0-100,"routine_comment":"2-3 sentences, 반존대","conflicts":[max 3,{"ingredients":[""],"products":[""],"severity":"high|medium|low","reason":"왜 안되는지+대안+과학적 이유"}],"synergies":[max 3,{"ingredients":[""],"products":[""],"reason":"왜 좋은지+과학적 근거"}],"order_suggestion":["아침→저녁 순"],"recommendations":[max 3,"꿀팁+이유, 반존대"],"timeline":[{"product":"","timing":"morning|evening|both","reason":"왜 이 시간인지 구체적"}],"usage_guide":{"effect_timeline":"이 루틴 효과 체감까지 걸리는 시간","beginner_tips":["초보자 주의사항 2-3개"]},"verdict":"추천 강도 ★(1-5) + 과학적 근거 포함 추천 이유 2-3 sentences"}. timeline: morning→evening→both순. ${useLang === "ko" ? "한국어" : "English"}.`
    const skinContext =
      profileSkinTypes.length > 0
        ? `\n⚠️ 이 사용자의 피부 타입: ${profileSkinTypes.join(", ")} — 이 피부 타입 기준으로 분석!`
        : ""
    const noteContext = profileNote
      ? `\n⚠️ 사용자 메모 (꼭 반영): ${profileNote}`
      : ""
    try {
      const raw = await callAI(
        sys,
        `${filled.length} product routine:${skinContext}${noteContext}\n\n${list}`
      )
      if (raw.routine_score && raw.routine_score <= 10)
        raw.routine_score = raw.routine_score * 10
      setRRes(raw)
      saveResultState("routine", null, raw, null)
      // Save to history if logged in
      if (status === "authenticated") {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ROUTINE",
            ingredients: list,
            concerns: [],
            score: raw.routine_score || 0,
            resultJson: raw,
            lang: useLang,
          }),
        }).catch(() => {})
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setRRes({
        error: true,
        errorMessage: msg,
        routine_score: 0,
        routine_comment: "",
      })
    }
    setPhase("result")
  }

  // Save pending analysis to sessionStorage before login redirect
  const savePending = (type: string) => {
    if (typeof window === "undefined") return
    const data =
      type === "single"
        ? { type: "single", ings, concerns, lang }
        : { type: "routine", products, lang }
    sessionStorage.setItem("skindit_pending", JSON.stringify(data))
  }

  // Restore and run pending analysis after login
  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined") return
    const raw = sessionStorage.getItem("skindit_pending")
    if (!raw) return
    sessionStorage.removeItem("skindit_pending")
    try {
      const data = JSON.parse(raw)
      if (data.type === "single" && data.ings) {
        setIngs(data.ings)
        setConcerns(data.concerns || [])
        setTab("single")
        setLastIngs(data.ings)
        setLastConcerns(data.concerns || [])
        runSingleAnalysis(data.lang || "ko", data.ings, data.concerns || [])
      } else if (data.type === "routine" && data.products) {
        setProducts(data.products)
        setTab("routine")
        setLastProducts(data.products)
        runRoutineAnalysis(data.lang || "ko", data.products)
      }
    } catch {
      /* ignore */
    }
  }, [status])

  // Load saved skin profile on login
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.concerns?.length > 0) {
          setProfileConcerns(data.concerns)
          if (concerns.length === 0) setConcerns(data.concerns)
        }
        if (data?.skinTypes?.length > 0) setProfileSkinTypes(data.skinTypes)
        if (data?.note) setProfileNote(data.note)
      })
      .catch(() => {})
  }, [status])

  const analyzeSingle = () => {
    if (status === "unauthenticated") {
      savePending("single")
      signIn(undefined, { callbackUrl: window.location.href })
      return
    }
    setLastIngs(ings)
    setLastConcerns([...concerns])
    runSingleAnalysis(lang, ings, concerns)
  }

  const analyzeRoutine = () => {
    if (status === "unauthenticated") {
      savePending("routine")
      signIn(undefined, { callbackUrl: window.location.href })
      return
    }
    setLastProducts([...products])
    runRoutineAnalysis(lang, products)
  }

  const analyzeCompare = () => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: window.location.href })
      return
    }
    runCompareAnalysis(lang, compareA, compareB)
  }

  // Language switch: re-analyze if on result page
  const switchLang = (newLang: string) => {
    setLang(newLang)
    try { localStorage.setItem("skindit_lang", newLang) } catch { /* */ }
    if (phase === "result") {
      if (tab === "single" && sRes && !sRes.error) {
        runSingleAnalysis(newLang, lastIngs, lastConcerns)
      } else if (tab === "routine" && rRes && !rRes.error) {
        runRoutineAnalysis(newLang, lastProducts)
      } else if (tab === "compare" && cRes && !cRes.error) {
        runCompareAnalysis(newLang, compareA, compareB)
      }
    }
  }

  const canS = ings.trim().length > 10
  const canR = products.filter((p) => p.ingredients.trim()).length >= 2
  const canC = compareA.trim().length > 10 && compareB.trim().length > 10

  const STEP_COLORS = [
    "from-pastel-lavender/60 to-purple-50/40",
    "from-pastel-peach/60 to-orange-50/40",
    "from-pastel-mint/60 to-teal-50/40",
    "from-pastel-sky/60 to-blue-50/40",
    "from-pastel-lemon/60 to-yellow-50/40",
  ]
  const STEP_BORDERS = [
    "border-purple-100",
    "border-orange-100",
    "border-teal-100",
    "border-blue-100",
    "border-yellow-100",
  ]

  return (
    <div className="relative mx-auto min-h-screen max-w-160 overflow-hidden bg-white shadow-xl">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-2xl">
        <button
          onClick={reset}
          className="flex items-center gap-3 border-none bg-transparent p-0"
        >
          {/* Logo mark — magnifier + skin cells */}
          <div className="from-pastel-lavender-dark to-pastel-rose-dark relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br via-purple-400 shadow-md">
            <div className="absolute inset-0 bg-linear-to-t from-white/10 to-transparent" />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="relative"
            >
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.9"
              />
              <path
                d="M16 16L20 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.9"
              />
              <circle cx="9.5" cy="9.5" r="1.5" fill="rgba(179,157,219,0.7)" />
              <circle cx="13" cy="11" r="1" fill="rgba(244,143,177,0.6)" />
              <circle cx="10.5" cy="13" r="0.8" fill="rgba(179,157,219,0.5)" />
            </svg>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">
              skin
            </span>
            <span className="font-accent from-pastel-lavender-dark to-pastel-rose-dark bg-linear-to-r bg-clip-text text-[17px] font-semibold text-transparent italic">
              dit
            </span>
          </div>
        </button>
        <button
          onClick={() => switchLang(lang === "ko" ? "en" : "ko")}
          className="hover:bg-pastel-lavender/30 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-400 transition-all hover:border-purple-200 hover:text-purple-600"
        >
          {lang === "ko" ? "EN" : "KO"}
        </button>
      </nav>

      {/* ── HERO ── */}
      {phase === "setup" && (
        <div className="relative overflow-hidden border-b border-gray-100/50 px-6 pt-14 pb-12">
          {/* Aurora wave background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Base gradient — slowly shifting */}
            <div className="anim-gradient-flow absolute inset-0 bg-linear-to-br from-purple-200/50 via-white via-40% to-pink-200/40" />

            {/* Aurora blob 1 — large purple, slow drift */}
            <div
              className="pointer-events-none absolute h-100 w-100 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(167,139,250,0.1) 50%, transparent 70%)",
                top: "-15%",
                right: "-10%",
                filter: "blur(40px)",
                animation: "aurora-move-1 12s ease-in-out infinite",
              }}
            />
            {/* Aurora blob 2 — rose pink, different rhythm */}
            <div
              className="pointer-events-none absolute h-87.5 w-87.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(244,114,182,0.35) 0%, rgba(244,114,182,0.08) 50%, transparent 70%)",
                bottom: "-10%",
                left: "-12%",
                filter: "blur(35px)",
                animation: "aurora-move-2 10s ease-in-out infinite",
              }}
            />
            {/* Aurora blob 3 — mint accent */}
            <div
              className="pointer-events-none absolute h-62.5 w-62.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(94,234,212,0.25) 0%, rgba(94,234,212,0.05) 50%, transparent 70%)",
                top: "35%",
                left: "25%",
                filter: "blur(30px)",
                animation: "aurora-move-3 14s ease-in-out infinite",
              }}
            />
          </div>

          <div className="relative">
            {/* Profile / Login circle */}
            <div className="absolute -top-8 right-0 z-10">
              <div className="relative">
                {status === "authenticated" ? (
                  <>
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-3 rounded-full border-none bg-transparent transition-all"
                    >
                      <div className="bg-pastel-lavender flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-3 border-purple-200 transition-all hover:scale-105 hover:border-purple-300 hover:shadow-lg">
                        {session?.user?.image ? (
                          <img
                            src={session.user.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-purple-500">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                    </button>
                    {profileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setProfileOpen(false)}
                        />
                        <div
                          className="anim-pop-in absolute top-13 right-0 z-50 w-56 rounded-2xl p-2.5"
                          style={{
                            background: "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(40px) saturate(1.6)",
                            WebkitBackdropFilter: "blur(40px) saturate(1.6)",
                            border: "1px solid rgba(255,255,255,0.6)",
                            boxShadow:
                              "0 8px 40px rgba(120,80,200,0.12), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                          }}
                        >
                          <div className="mb-1.5 border-b border-white/30 px-3 py-2.5">
                            <p className="truncate text-xs font-bold text-gray-800">
                              {session?.user?.name}
                            </p>
                            <p className="truncate text-[10px] text-gray-400">
                              {session?.user?.email}
                            </p>
                          </div>
                          <a
                            href="/profile"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
                          >
                            <span className="text-sm">👤</span>{" "}
                            {t("피부 프로필", "Skin Profile")}
                          </a>
                          <a
                            href="/history"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
                          >
                            <span className="text-sm">📋</span>{" "}
                            {t("분석 기록", "Analysis History")}
                          </a>
                          <a
                            href="/diary"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
                          >
                            <span className="text-sm">📔</span>{" "}
                            {t("피부 일지", "Skin Diary")}
                          </a>
                          <a
                            href="/chat"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
                          >
                            <span className="text-sm">💬</span>{" "}
                            {t("성분 상담", "Ingredient Chat")}
                          </a>
                          <a
                            href="/pricing"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-purple-600 no-underline transition-all hover:bg-purple-50/50"
                          >
                            <span className="text-sm">💎</span>{" "}
                            {t("프로 플랜", "Pro Plan")}
                          </a>
                          {(session?.user as { role?: string })?.role ===
                            "admin" && (
                            <a
                              href="/admin"
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-rose-500 no-underline transition-all hover:bg-rose-50/50"
                            >
                              <span className="text-sm">⚙️</span>{" "}
                              {t("관리자", "Admin")}
                            </a>
                          )}
                          <div className="my-1.5 h-px bg-white/30" />
                          <button
                            onClick={() => signOut()}
                            className="flex w-full items-center gap-2.5 rounded-xl border-none bg-transparent px-3 py-2.5 text-left text-xs font-medium text-rose-500 transition-all hover:bg-rose-100/50"
                          >
                            <span className="text-sm">🚪</span>{" "}
                            {t("로그아웃", "Sign Out")}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => signIn()}
                    className="bg-pastel-lavender/60 hover:bg-pastel-lavender flex h-11 w-11 items-center justify-center rounded-full border-2 border-purple-200 transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                        stroke="#b39ddb"
                        strokeWidth="2"
                      />
                      <path
                        d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
                        stroke="#b39ddb"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="anim-fade-up">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-purple-100/60 bg-white/70 px-3.5 py-1.5 shadow-sm backdrop-blur">
                <span className="text-sm">🧬</span>
                <span className="text-xs font-semibold text-gray-500">
                  {t(
                    "내 피부를 아는 AI 스킨 메이트",
                    "AI Skin Mate That Knows You"
                  )}
                </span>
              </div>
            </div>

            <h1
              className="anim-fade-up mb-5 text-[clamp(32px,7vw,46px)] leading-[1.15]"
              style={{ animationDelay: "60ms" }}
            >
              {lang === "ko" ? (
                <>
                  <span className="font-display font-extrabold tracking-tight text-gray-900">
                    바르기 전에
                  </span>
                  <br />
                  <span className="font-accent gradient-text font-medium tracking-normal italic">
                    check~
                  </span>
                  <br />
                  <span className="font-display font-extrabold tracking-tight text-gray-900">
                    좋은 성분이
                  </span>
                  <br />
                  <span className="font-display font-extrabold tracking-tight text-gray-900">
                    나한테 다 좋은 건 아니니까
                  </span>
                </>
              ) : (
                <>
                  <span className="font-accent gradient-text font-medium tracking-normal italic">
                    Check~
                  </span>
                  <span className="font-display font-extrabold tracking-tight text-gray-900">
                    {" "}
                    before
                  </span>
                  <br />
                  <span className="font-display font-extrabold tracking-tight text-gray-900">
                    Good ingredients
                  </span>
                  <br />
                  <span className="font-display font-extrabold tracking-tight text-gray-900">
                    aren't always good for you
                  </span>
                </>
              )}
            </h1>

            <p
              className="anim-fade-up mb-8 max-w-145 text-[15px] leading-relaxed text-gray-400"
              style={{ animationDelay: "100ms" }}
            >
              {t("성분 분석부터 피부 일지, 트러블 추적까지 —", "Analysis, diary, trouble tracking —")}
              <br />
              {t("다 해주는 내 피부 메이트 💜", "your all-in-one skin mate 💜")}
            </p>

            {/* ── 순환 구조: 스킨딧 루프 ── */}
            <div
              className="anim-fade-up mt-14 mb-6"
              style={{ animationDelay: "140ms" }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-50/80 via-white to-pink-50/60 p-5">
                <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-purple-100/40" />
                <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-pink-100/30" />
                <div className="relative">
                  <p className="mb-4 text-center text-xs font-bold text-purple-500">
                    {t("쓸수록 나를 알아가는 스킨딧 💜", "skindit learns you over time 💜")}
                  </p>
                  <div className="flex items-start justify-between gap-0.5">
                    {[
                      { icon: "🔬", label: t("분석", "Analyze"), sub: t("성분 먼저 체크하고~", "Check ingredients"), color: "from-blue-100 to-sky-50 border-blue-200" },
                      { icon: "📔", label: t("기록", "Record"), sub: t("매일 피부 상태 적고 📝", "Log daily skin"), color: "from-pink-100 to-rose-50 border-pink-200" },
                      { icon: "📊", label: t("발견", "Discover"), sub: t("원인 딱 찾아내고 🔍", "Find patterns"), color: "from-emerald-100 to-green-50 border-emerald-200" },
                      { icon: "💬", label: t("상담", "Consult"), sub: t("나만의 솔루션까지!", "Get solutions!"), color: "from-purple-100 to-violet-50 border-purple-200" },
                    ].map((step, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-linear-to-br ${step.color} text-xl shadow-sm`}>
                          {step.icon}
                        </div>
                        <span className="text-xs font-extrabold text-gray-700">{step.label}</span>
                        <span className="text-center text-[10px] leading-tight text-gray-400">{step.sub}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-center">
                    <span className="text-[11px] font-medium text-purple-400">{t("기록할수록 더 정확해져요~ ✨", "Gets smarter with your data ✨")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 기능 카드 4개 ── */}
            <div
              className="anim-fade-up grid grid-cols-2 gap-2.5"
              style={{ animationDelay: "180ms" }}
            >
              <a
                href="/chat"
                className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-4 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
              >
                <div className="absolute top-0 right-0 h-12 w-12 translate-x-1/3 -translate-y-1/3 rounded-full bg-purple-50" />
                <span className="mb-1.5 block text-xl">💬</span>
                <p className="text-[13px] font-bold text-gray-800">
                  {t("스킨딧한테 물어봐요 💬", "Ask skindit 💬")}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-gray-400">
                  {t(
                    "고민, 성분, 시술 뭐든요~",
                    "Anything about skin!"
                  )}
                </p>
              </a>
              <a
                href="/diary"
                className="group relative overflow-hidden rounded-2xl border border-pink-100 bg-white p-4 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md"
              >
                <div className="absolute top-0 right-0 h-12 w-12 translate-x-1/3 -translate-y-1/3 rounded-full bg-pink-50" />
                <span className="mb-1.5 block text-xl">📔</span>
                <p className="text-[13px] font-bold text-gray-800">
                  {t("피부 일지", "Skin Diary")}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-gray-400">
                  {t(
                    "오늘 피부 어떤지 기록해봐요~",
                    "How's your skin today?"
                  )}
                </p>
              </a>
              <a
                href="/diary/report"
                className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="absolute top-0 right-0 h-12 w-12 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-50" />
                <span className="mb-1.5 block text-xl">📊</span>
                <p className="text-[13px] font-bold text-gray-800">
                  {t("피부 리포트 📊", "Skin Report 📊")}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-gray-400">
                  {t("트러블 원인 찾아줄게요 🔍", "Find trouble causes 🔍")}
                </p>
              </a>
              <a
                href="/history"
                className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-4 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
              >
                <div className="absolute top-0 right-0 h-12 w-12 translate-x-1/3 -translate-y-1/3 rounded-full bg-amber-50" />
                <span className="mb-1.5 block text-xl">📋</span>
                <p className="text-[13px] font-bold text-gray-800">
                  {t("분석 기록", "History")}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-gray-400">
                  {t("지난 분석 다시 볼 수 있어요~", "Review past analyses")}
                </p>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="px-6 pt-10 pb-32">
        {/* Tabs */}
        {phase === "setup" && (
          <div className="mb-8 flex gap-1 rounded-2xl bg-gray-100/80 p-1">
            {[
              {
                id: "single",
                ko: "단일 제품",
                en: "Single Product",
                icon: "💊",
              },
              {
                id: "routine",
                ko: "루틴 궁합",
                en: "Routine Check",
                icon: "🧴",
              },
              { id: "compare", ko: "성분 비교", en: "Compare", icon: "⚖️" },
            ].map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  tab === tb.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="mr-1.5">{tb.icon}</span>
                {t(tb.ko, tb.en)}
              </button>
            ))}
          </div>
        )}

        {/* ── SINGLE SETUP ── */}
        {phase === "setup" && tab === "single" && (
          <div className="anim-fade-up">
            <div className="mt-12 mb-12">
              <div className="mb-3 flex gap-2.5">
                <span className="mt-0.5 text-base">🫧</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("피부 고민", "Skin Concerns")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t(
                      "해당하는 거 다 골라주세요~",
                      "Select all that apply"
                    )}
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
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div className="mb-8 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />

            {/* ── 📷 성분표 스캔 (메인) ── */}
            <div className="mb-8">
              {ocrLoading ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-purple-200 bg-linear-to-br from-purple-50 to-pink-50 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <span
                      className="inline-block h-6 w-6 rounded-full border-3 border-purple-200 border-t-purple-600"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("성분 읽는 중...", "Reading ingredients...")}
                  </p>
                </div>
              ) : (
                <label className="from-pastel-lavender/40 via-pastel-rose/20 to-pastel-peach/30 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-purple-100/60 bg-linear-to-br p-6 transition-all hover:border-purple-200 hover:shadow-sm">
                  <div className="from-pastel-lavender to-pastel-rose flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br text-2xl">
                    📷
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {t("성분표 사진 등록", "Add Ingredient Photo")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {t(
                        "사진 찍거나 갤러리에서 골라줘~",
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
                      "화해 앱이나 상세페이지에서 복사해서 붙여넣어주세요~",
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
                className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm leading-relaxed text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />
              <button
                onClick={() =>
                  setIngs(lang === "ko" ? SAMPLE_S_KO : SAMPLE_S_EN)
                }
                className="mt-2 border-none bg-transparent p-0 text-xs font-medium text-gray-400 underline underline-offset-2 transition-colors hover:text-purple-500"
              >
                {t("샘플로 한번 해볼래? →", "Try with sample →")}
              </button>
            </div>

            <button
              onClick={analyzeSingle}
              disabled={!canS}
              className="pastel-lavender-dark to-pastel-rose-dark w-full rounded-2xl bg-linear-to-r via-purple-400 py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {t("분석해볼까?", "Analyze Ingredients")}
            </button>
          </div>
        )}

        {/* ── ROUTINE SETUP ── */}
        {phase === "setup" && tab === "routine" && (
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
                      "같이 쓰는 제품 2개 이상 넣어주세요~",
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
                      className="mb-2 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-purple-300 focus:bg-white"
                    />

                    {/* ── 성분 입력: 카메라 촬영 / 사진 선택 ── */}
                    <label className="hover:bg-pastel-lavender/30 mb-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-white/60 px-3 py-2.5 text-[11px] font-semibold text-purple-500 transition-all hover:border-purple-200">
                      {routineOcrLoading[p.id] ? (
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border-2 border-purple-300 border-t-purple-600"
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
                        "여기에 자동으로 채워지거나, 직접 붙여넣어주세요~",
                        "Ingredients auto-fill here, or paste manually"
                      )}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs leading-relaxed transition-all outline-none placeholder:text-gray-400 focus:border-purple-300 focus:bg-white"
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
                  className="hover:bg-pastel-lavender/30 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-500 transition-all hover:border-purple-200 hover:text-purple-600"
                >
                  + {t("제품 추가", "Add product")}
                </button>
                <button
                  onClick={() => setProducts(SAMPLE_R)}
                  className="border-none bg-transparent p-0 text-xs font-medium text-gray-400 underline underline-offset-2 transition-colors hover:text-purple-500"
                >
                  {t("샘플로 해볼래? →", "Try sample →")}
                </button>
              </div>
            </div>
            <button
              onClick={analyzeRoutine}
              disabled={!canR}
              className="from-pastel-lavender-dark to-pastel-rose-dark w-full rounded-2xl bg-linear-to-r via-purple-400 py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {t("궁합 체크해볼까?", "Check Compatibility")}
            </button>
          </div>
        )}

        {/* ── COMPARE SETUP ── */}
        {phase === "setup" && tab === "compare" && (
          <div className="anim-fade-up">
            <div className="mt-12 mb-12">
              <div className="mb-4 flex gap-2.5">
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
                {[
                  {
                    label: "A" as const,
                    value: compareA,
                    set: setCompareA,
                    name: compareNameA,
                    setName: setCompareNameA,
                    gradient: "from-pastel-lavender/60 to-purple-50/40",
                    border: "border-purple-100",
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
                ].map((p) => (
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
                    {/* ── 제품 이름 ── */}
                    <input
                      value={p.name}
                      onChange={(e) => p.setName(e.target.value)}
                      placeholder={t(
                        "제품 이름 (선택)",
                        "Product name (optional)"
                      )}
                      className="mb-2 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-purple-300 focus:bg-white"
                    />
                    {/* ── 성분 입력: 카메라 촬영 / 사진 선택 ── */}
                    <label className="hover:bg-pastel-lavender/30 mb-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-white/60 px-3 py-2.5 text-[11px] font-semibold text-purple-500 transition-all hover:border-purple-200">
                      {compareOcrLoading === p.label ? (
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border-2 border-purple-300 border-t-purple-600"
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
                        "여기에 자동으로 채워지거나, 직접 붙여넣어주세요~",
                        "Ingredients auto-fill here, or paste manually"
                      )}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs leading-relaxed transition-all outline-none placeholder:text-gray-400 focus:border-purple-300 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={analyzeCompare}
              disabled={!canC}
              className="from-pastel-lavender-dark to-pastel-rose-dark w-full rounded-2xl bg-linear-to-r via-purple-400 py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {t("비교해볼까?", "Compare Ingredients")}
            </button>
          </div>
        )}

        {/* ── TRENDING INGREDIENTS (setup phase only) ── */}
        {phase === "setup" && (
          <div className="mt-12 mb-4">
            <div className="mb-8 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
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
                      ? "bg-linear-to-r " +
                        tr.gradient +
                        " border-purple-200 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:border-purple-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{tr.icon}</span>
                  {lang === "ko" ? tr.ko : tr.en}
                </button>
              ))}
            </div>
            {trendOpen && (
              <div className="anim-fade-up mt-3 rounded-2xl border border-purple-100/60 bg-linear-to-br from-purple-50/50 to-pink-50/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">
                    {TRENDING.find((t) => t.id === trendOpen)?.icon}
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {lang === "ko"
                      ? TRENDING.find((t) => t.id === trendOpen)?.ko
                      : TRENDING.find((t) => t.id === trendOpen)?.en}
                  </span>
                </div>
                {trendLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-purple-200 border-t-purple-500"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {t("알아보는 중...", "Loading explanation...")}
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed whitespace-pre-line text-gray-600">
                    {(trendInfo[trendOpen] || "")
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
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div className="anim-fade-in py-24 text-center">
            <div className="skindit-loading mb-8">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
            <p className="font-display mb-2 text-base font-bold text-gray-800">
              {t("스킨딧이 분석하는 중이에요~ 🔬", "skindit is analyzing...")}
            </p>
            <p
              className="text-sm text-gray-400"
              style={{ animation: "pulse-text 1.6s ease infinite" }}
            >
              {t("꼼꼼하게 보고 있으니까 잠깐만요~", "Carefully reviewing for you")}
            </p>
          </div>
        )}

        {/* ── SINGLE RESULT ── */}
        {phase === "result" &&
          tab === "single" &&
          sRes &&
          (sRes.error ? (
            <ErrState t={t} reset={reset} message={sRes.errorMessage} />
          ) : (
            <SingleResult res={sRes} t={t} reset={reset} lang={lang} />
          ))}

        {/* ── ROUTINE RESULT ── */}
        {phase === "result" &&
          tab === "routine" &&
          rRes &&
          (rRes.error ? (
            <ErrState t={t} reset={reset} message={rRes.errorMessage} />
          ) : (
            <div className="anim-scale-in">
              <ScoreHero
                score={rRes.routine_score}
                label={scoreLabel(rRes.routine_score, lang)}
                comment={rRes.routine_comment}
                verdict={rRes.verdict}
                eyebrow={t("루틴 궁합 분석", "Routine Analysis")}
              />

              <div className="mb-5 grid grid-cols-1 gap-4">
                {/* Conflicts */}
                {rRes.conflicts && rRes.conflicts.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5 border-b border-rose-200 pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-pink-400 shadow-sm">
                        <span className="text-xs font-bold text-white">⚠</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-rose-800">
                          {t("성분 충돌", "Conflicts")}
                        </span>
                        <p className="text-[10px] text-rose-400">
                          {t(
                            "함께 사용 시 주의가 필요해요",
                            "Use caution when combining"
                          )}
                        </p>
                      </div>
                    </div>
                    {rRes.conflicts.map((c, i, a) => (
                      <div
                        key={i}
                        className={`py-3.5 ${i < a.length - 1 ? "border-b border-rose-200/60" : ""}`}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <SevBadge sev={c.severity} lang={lang} />
                          <span className="text-sm font-bold text-gray-900">
                            {c.ingredients?.join(" × ")}
                          </span>
                        </div>
                        <p className="mb-1 text-xs font-medium text-rose-500">
                          {c.products?.join(" + ")}
                        </p>
                        <p className="text-sm leading-relaxed text-gray-600">
                          <Md>{c.reason}</Md>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Synergies */}
                {rRes.synergies && rRes.synergies.length > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5 border-b border-emerald-200 pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-400 shadow-sm">
                        <span className="text-xs font-bold text-white">✦</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-emerald-800">
                          {t("시너지", "Synergies")}
                        </span>
                        <p className="text-[10px] text-emerald-400">
                          {t("함께 사용하면 더 좋아요", "Better together")}
                        </p>
                      </div>
                    </div>
                    {rRes.synergies.map((s, i, a) => (
                      <div
                        key={i}
                        className={`py-3.5 ${i < a.length - 1 ? "border-b border-emerald-200/60" : ""}`}
                      >
                        <p className="mb-1 text-sm font-bold text-emerald-700">
                          {s.ingredients?.join(" + ")}
                        </p>
                        <p className="mb-1 text-xs font-medium text-emerald-500">
                          {s.products?.join(" + ")}
                        </p>
                        <p className="text-sm leading-relaxed text-gray-600">
                          <Md>{s.reason}</Md>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order suggestion */}
                {rRes.order_suggestion && rRes.order_suggestion.length > 0 && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5 border-b border-blue-200 pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-sky-400 shadow-sm">
                        <span className="text-xs font-bold text-white">#</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-blue-800">
                          {t("추천 순서", "Suggested Order")}
                        </span>
                        <p className="text-[10px] text-blue-400">
                          {t("이 순서로 바르면 좋아요", "Apply in this order")}
                        </p>
                      </div>
                    </div>
                    {rRes.order_suggestion.map((name, i) => (
                      <div
                        key={i}
                        className="mb-3 flex items-center gap-3 last:mb-0"
                      >
                        <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-sky-400 text-xs font-extrabold text-white shadow-sm">
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {rRes.recommendations && rRes.recommendations.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5 border-b border-amber-200 pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-400 shadow-sm">
                        <span className="text-xs font-bold text-white">💡</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-amber-800">
                          {t("개선 팁", "Tips")}
                        </span>
                        <p className="text-[10px] text-amber-400">
                          {t("이렇게 하면 더 좋아요", "Try these improvements")}
                        </p>
                      </div>
                    </div>
                    {rRes.recommendations.map((tip, i) => (
                      <div
                        key={i}
                        className="mb-3 flex items-start gap-3 last:mb-0"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-[10px] font-bold text-amber-700">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-gray-700">
                          <Md>{tip}</Md>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Routine Timeline ── */}
                {rRes.timeline && rRes.timeline.length > 0 && (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2.5 border-b border-purple-200 pb-3">
                      <div className="from-pastel-lavender-dark to-pastel-rose-dark flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br shadow-sm">
                        <span className="text-xs font-bold text-white">⏰</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-purple-800">
                          {t("루틴 타임라인", "Routine Timeline")}
                        </span>
                        <p className="text-[10px] text-purple-400">
                          {t(
                            "아침/저녁 사용 추천",
                            "Morning/Evening recommendation"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* AM / PM columns */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      {/* Morning */}
                      <div>
                        <div className="mb-2.5 flex items-center gap-1.5">
                          <span className="text-base">🌅</span>
                          <span className="text-[11px] font-bold tracking-wide text-amber-700 uppercase">
                            {t("아침", "Morning")}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {rRes.timeline
                            .filter(
                              (ti) =>
                                ti.timing === "morning" || ti.timing === "both"
                            )
                            .map((ti, i) => (
                              <div
                                key={i}
                                className="anim-fade-up rounded-xl border border-amber-200 bg-amber-100 p-3"
                                style={{ animationDelay: `${i * 60}ms` }}
                              >
                                <p className="mb-0.5 text-xs font-bold text-gray-800">
                                  {ti.product}
                                </p>
                                <p className="text-[10px] leading-relaxed text-gray-600">
                                  <Md>{ti.reason}</Md>
                                </p>
                                {ti.timing === "both" && (
                                  <span className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">
                                    {t("아침/저녁", "AM/PM")}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      {/* Evening */}
                      <div>
                        <div className="mb-2.5 flex items-center gap-1.5">
                          <span className="text-base">🌙</span>
                          <span className="text-[11px] font-bold tracking-wide text-indigo-700 uppercase">
                            {t("저녁", "Evening")}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {rRes.timeline
                            .filter(
                              (ti) =>
                                ti.timing === "evening" || ti.timing === "both"
                            )
                            .map((ti, i) => (
                              <div
                                key={i}
                                className="anim-fade-up rounded-xl border border-indigo-200 bg-indigo-100 p-3"
                                style={{ animationDelay: `${i * 60}ms` }}
                              >
                                <p className="mb-0.5 text-xs font-bold text-gray-800">
                                  {ti.product}
                                </p>
                                <p className="text-[10px] leading-relaxed text-gray-600">
                                  <Md>{ti.reason}</Md>
                                </p>
                                {ti.timing === "both" && (
                                  <span className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">
                                    {t("아침/저녁", "AM/PM")}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Usage Guide for routine */}
                {rRes.usage_guide && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5 border-b border-sky-200 pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-400 shadow-sm">
                        <span className="text-xs font-bold text-white">📋</span>
                      </div>
                      <span className="text-sm font-bold text-sky-800">{t("사용 가이드", "Usage Guide")}</span>
                    </div>
                    {(() => {
                      const guide = rRes.usage_guide!;
                      return (
                        <div className="space-y-2.5">
                          {guide.effect_timeline && (
                            <div className="flex gap-2.5 items-start">
                              <span className="shrink-0 text-sm">📅</span>
                              <div><p className="text-[10px] font-bold text-sky-600 mb-0.5">{t("효과 체감 시기", "Effect Timeline")}</p><p className="text-xs text-gray-600 leading-relaxed">{guide.effect_timeline}</p></div>
                            </div>
                          )}
                          {guide.beginner_tips && guide.beginner_tips.length > 0 && (
                            <div className="flex gap-2.5 items-start">
                              <span className="shrink-0 text-sm">💡</span>
                              <div>
                                <p className="text-[10px] font-bold text-sky-600 mb-1">{t("초보자 주의사항", "Beginner Tips")}</p>
                                {guide.beginner_tips.map((tip, i) => (
                                  <p key={i} className="text-xs text-gray-600 leading-relaxed mb-0.5">· {tip}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const title = `skindit 루틴 분석: ${rRes.routine_score}점`
                    const text = `${rRes.routine_comment}\n\n${rRes.verdict || ""}`
                    if (navigator.share) {
                      navigator
                        .share({ title, text, url: SITE_URL })
                        .catch(() => {})
                    } else {
                      navigator.clipboard.writeText(
                        `${title}\n${text}\n${SITE_URL}`
                      )
                      alert(
                        lang === "ko"
                          ? "결과 복사했어요! 친구한테 보내줘~ 💜"
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
                  {t("← 새 분석", "← New")}
                </button>
              </div>
            </div>
          ))}
        {/* ── COMPARE RESULT ── */}
        {phase === "result" &&
          tab === "compare" &&
          cRes &&
          (cRes.error ? (
            <ErrState t={t} reset={reset} message={cRes.errorMessage} />
          ) : (
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

              {/* Forbidden Combos */}
              {cRes.forbidden_combos && cRes.forbidden_combos.length > 0 && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-base">🚫</span>
                    <p className="text-sm font-bold text-rose-800">{t("절대 금지 콤보", "Forbidden Combos")}</p>
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
                    if (navigator.share) {
                      navigator
                        .share({ title, text, url: SITE_URL })
                        .catch(() => {})
                    } else {
                      navigator.clipboard.writeText(
                        `${title}\n${text}\n${SITE_URL}`
                      )
                      alert(
                        lang === "ko"
                          ? "비교 결과 복사했어요! 친구한테 보내줘~ 💜"
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
          ))}
      </main>

      {/* ── PWA Install Banner ── */}
      {showPwaBanner && phase === "setup" && (
        <div className="anim-fade-up fixed right-0 bottom-6 left-0 z-50 mx-auto max-w-140 px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="from-pastel-lavender-dark to-pastel-rose-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br shadow-md">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="relative"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="white"
                  strokeWidth="2"
                  strokeOpacity="0.9"
                />
                <path
                  d="M16 16L20 20"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeOpacity="0.9"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-800">
                {t("홈 화면에 추가해보세요!", "Add to Home Screen!")}
              </p>
              <p className="text-[10px] text-gray-400">
                {t(
                  "앱처럼 빠르게 열고 매일 기록해요~ 📔",
                  "Open fast like an app, log daily"
                )}
              </p>
            </div>
            <button
              onClick={handlePwaInstall}
              className="from-pastel-lavender-dark to-pastel-rose-dark shrink-0 rounded-xl bg-linear-to-r px-4 py-2 text-[11px] font-bold text-white shadow-sm"
            >
              {deferredPrompt ? t("설치", "Install") : t("방법 보기", "How")}
            </button>
            <button
              onClick={dismissPwa}
              className="shrink-0 border-none bg-transparent p-1 text-gray-300 hover:text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      {phase === "setup" && (
        <footer className="border-t border-gray-100 bg-gray-50/50 px-6 py-10">
          <div className="mx-auto max-w-120">
            <div className="mb-6 flex items-center gap-2">
              <div className="from-pastel-lavender-dark to-pastel-rose-dark flex h-7 w-7 items-center justify-center rounded-xl bg-linear-to-br shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="5" stroke="white" strokeWidth="2" strokeOpacity="0.9" /><path d="M15 15L19 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" /></svg>
              </div>
              <span className="font-display text-sm font-bold text-gray-600">skindit</span>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-bold text-gray-500">{t("서비스", "Service")}</p>
                <a href="/chat" className="block text-gray-400 no-underline hover:text-purple-500">{t("AI 상담", "AI Chat")}</a>
                <a href="/diary" className="block text-gray-400 no-underline hover:text-purple-500">{t("피부 일지", "Skin Diary")}</a>
                <a href="/diary/report" className="block text-gray-400 no-underline hover:text-purple-500">{t("피부 리포트", "Report")}</a>
                <a href="/history" className="block text-gray-400 no-underline hover:text-purple-500">{t("분석 기록", "History")}</a>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-gray-500">{t("계정", "Account")}</p>
                <a href="/profile" className="block text-gray-400 no-underline hover:text-purple-500">{t("피부 프로필", "Skin Profile")}</a>
                <a href="/pricing" className="block text-gray-400 no-underline hover:text-purple-500">{t("프로 플랜", "Pro Plan")}</a>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 text-[10px] text-gray-300">
              <p>© 2026 skindit. {t("바르기 전에 check~ 내 피부를 아는 AI 스킨 메이트", "Check before you apply~ AI skin mate that knows you")}</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
