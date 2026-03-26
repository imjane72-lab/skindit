"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/* ── Types ── */
interface DiaryEntry {
  id: string
  date: string
  condition: "good" | "normal" | "bad"
  products: string[]
  troubles: string[]
  foods?: string[]
  note: string
  tip?: string
  createdAt?: string
}

/* ── Constants ── */
const TROUBLES = [
  {
    id: "redness",
    ko: "홍조",
    icon: "🔴",
    color: "bg-pastel-rose text-pink-700 border-pink-200",
  },
  {
    id: "dryness",
    ko: "건조",
    icon: "🏜",
    color: "bg-pastel-peach text-amber-700 border-amber-200",
  },
  {
    id: "acne",
    ko: "트러블",
    icon: "💥",
    color: "bg-pastel-rose text-rose-700 border-rose-200",
  },
  {
    id: "itching",
    ko: "가려움",
    icon: "🩸",
    color: "bg-pastel-lilac text-purple-700 border-purple-200",
  },
  {
    id: "flaking",
    ko: "각질",
    icon: "🌿",
    color: "bg-pastel-mint text-teal-700 border-teal-200",
  },
  {
    id: "tightness",
    ko: "당김",
    icon: "🧴",
    color: "bg-pastel-sky text-blue-700 border-blue-200",
  },
  {
    id: "oiliness",
    ko: "번들거림",
    icon: "💧",
    color: "bg-pastel-lemon text-yellow-700 border-yellow-200",
  },
]

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

const conditionBar = (c: string) =>
  c === "good"
    ? "bg-emerald-400"
    : c === "normal"
      ? "bg-amber-400"
      : "bg-rose-400"

const conditionEmoji = (c: string) =>
  c === "good" ? "😊" : c === "normal" ? "😐" : "😣"

const conditionLabel = (c: string) =>
  c === "good" ? "좋음" : c === "normal" ? "보통" : "나쁨"

const conditionTag = (c: string) =>
  c === "good"
    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
    : c === "normal"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-rose-50 text-rose-600 border-rose-200"

const conditionTipBg = (c: string) =>
  c === "good"
    ? "bg-emerald-50 text-emerald-700"
    : c === "normal"
      ? "bg-amber-50 text-amber-700"
      : "bg-rose-50 text-rose-700"

/* ── Helpers ── */
function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const days: { day: number; current: boolean }[] = []

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, current: false })
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true })
  }
  // Next month leading days
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false })
    }
  }

  return days
}

function formatFullDate(d: string) {
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const day = date.getDate()
  const w = WEEKDAYS[date.getDay()]
  return `${y}. ${m}. ${day}. (${w})`
}

function parseEntry(e: DiaryEntry): DiaryEntry {
  if (e.note && e.note.includes("💜 skindit tip:")) {
    const [realNote, tipPart] = e.note.split("💜 skindit tip:")
    return {
      ...e,
      note: realNote?.replace(/\n+$/, "").trim() || "",
      tip: tipPart?.trim() || "",
    }
  }
  return e
}

/* ── NavBar ── */
function NavBar() {
  const router = useRouter()
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-2xl">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-3 border-none bg-transparent p-0"
      >
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
          <span className="from-pastel-lavender-dark to-pastel-rose-dark font-accent bg-linear-to-r bg-clip-text text-[17px] font-semibold text-transparent italic">
            dit
          </span>
        </div>
      </button>
      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
        Diary
      </span>
    </nav>
  )
}

/* ── Main Page ── */
export default function DiaryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [lang, setLang] = useState("ko")
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko") }, [])
  const t = (ko: string, en: string) => lang === "ko" ? ko : en

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth()) // 0-indexed
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState("")
  const [editCondition, setEditCondition] = useState("")
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* ── Auth redirect ── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin")
  }, [status, router])

  /* ── Fetch entries for current month ── */
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`
      const res = await fetch(`/api/diary?month=${monthKey}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        const raw: DiaryEntry[] = Array.isArray(json)
          ? json
          : json.entries || json.data || []
        setEntries(raw.map(parseEntry))
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [viewYear, viewMonth])

  useEffect(() => {
    if (status === "authenticated") fetchEntries()
  }, [status, fetchEntries])

  // Reset selected date when month changes
  useEffect(() => {
    setSelectedDate(null)
    setEditingId(null)
  }, [viewYear, viewMonth])

  /* ── Month navigation ── */
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToToday = () => {
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setSelectedDate(now.getDate())
  }

  const nextMonth = () => {
    const current = getMonthKey(now)
    const next =
      viewMonth === 11
        ? `${viewYear + 1}-01`
        : `${viewYear}-${String(viewMonth + 2).padStart(2, "0")}`
    if (next > current) return // Don't go past current month
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  /* ── Entry lookup by day ── */
  const entryByDay = new Map<number, DiaryEntry>()
  entries.forEach((e) => {
    const d = new Date(e.date)
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      entryByDay.set(d.getDate(), e)
    }
  })

  const selectedEntry = selectedDate ? entryByDay.get(selectedDate) : null

  /* ── Handlers ── */
  const generateTip = async (
    entryId: string,
    cond: string,
    prods: string[],
    trbs: string[],
    memo: string
  ) => {
    try {
      const troubleNames = trbs
        .map((id) => TROUBLES.find((t) => t.id === id)?.ko || id)
        .join(", ")
      const condKo =
        cond === "good" ? "좋음" : cond === "normal" ? "보통" : "나쁨"
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `당신은 skindit — 화장품 성분을 직접 다 써보고 공부한, 피부 고민을 함께 해결해주는 언니예요. 교과서적 말투가 아니라 진짜 겪어본 사람이 해주는 현실적인 조언을 해주세요.

규칙:
- 1~2문장, 최대 80자
- 메모 키워드를 콕 집어서 조언 (예: "트러블"이면 → "트러블 올라올 땐 시카 성분 얹어주면 확 가라앉아요")
- 직접 써본 것처럼 구체적으로 (예: "세라마이드 크림 얇게 덧바르면 다음 날 달라요")
- 공감 + 실천 팁
- 부드러운 존댓말 ~요 체, 친근하게
- 텍스트만, 따옴표 없이`,
          user: `피부 상태: ${condKo}\n사용 제품: ${prods.join(", ") || "없음"}\n트러블: ${troubleNames || "없음"}\n메모: ${memo || "없음"}`,
        }),
      })
      const data = await res.json()
      const tip = data.content?.[0]?.text?.trim()
      if (tip) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, tip } : e))
        )
        fetch(`/api/diary/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: memo
              ? `${memo}\n\n💜 skindit tip: ${tip}`
              : `💜 skindit tip: ${tip}`,
          }),
        }).catch(() => {})
      }
    } catch {
      /* tip 생성 실패해도 일지는 저장됨 */
    }
  }

  const startEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id)
    const cleanNote =
      entry.note?.replace(/\n*💜 skindit tip:.*$/, "").trim() || ""
    setEditNote(cleanNote)
    setEditCondition(entry.condition)
  }

  const handleEditSave = async (id: string) => {
    setEditSaving(true)
    try {
      const res = await fetch(`/api/diary/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: editNote, condition: editCondition }),
      })
      if (res.ok) {
        const entry = entries.find((e) => e.id === id)
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  note: editNote,
                  condition: editCondition as "good" | "normal" | "bad",
                  tip: undefined,
                }
              : e
          )
        )
        setEditingId(null)
        generateTip(
          id,
          editCondition,
          entry?.products || [],
          entry?.troubles || [],
          editNote
        )
      }
    } catch {
      /* silent */
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("이 기록 지울까?", "Delete this entry?"))) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/diary/${id}`, { method: "DELETE" })
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
        setSelectedDate(null)
      }
    } catch {
      /* silent */
    } finally {
      setDeletingId(null)
    }
  }

  /* ── Calendar data ── */
  const calendarDays = getCalendarDays(viewYear, viewMonth)
  const today = now.getDate()
  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const isFutureBlocked =
    getMonthKey(new Date(viewYear, viewMonth + 1, 1)) >
    getMonthKey(new Date(now.getFullYear(), now.getMonth() + 1, 1))

  // Monthly summary
  const goodCount = entries.filter((e) => e.condition === "good").length
  const normalCount = entries.filter((e) => e.condition === "normal").length
  const badCount = entries.filter((e) => e.condition === "bad").length

  /* ── Loading ── */
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-160 bg-white shadow-xl">
          <NavBar />
          <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-200 border-t-purple-500" />
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative mx-auto min-h-screen max-w-160 overflow-hidden bg-white shadow-xl">
        <NavBar />

        <div className="px-6 py-8 pb-28">
          {/* ── Header ── */}
          <div className="anim-fade-up mb-6">
            <h1 className="font-display mb-1 text-2xl font-extrabold text-gray-900">
              {t("내 피부 기록", "My Skin Diary")}
            </h1>
            <p className="text-sm text-gray-400">
              {t("달력에서 내 피부 변화를 한눈에 볼 수 있어요~ 📅", "See your skin changes at a glance~ 📅")}
            </p>
          </div>

          {/* ── Report Button ── */}
          <div
            className="anim-fade-up mb-6"
            style={{ animationDelay: "0.05s" }}
          >
            <Link
              href="/diary/report"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-100 bg-white px-5 py-3.5 no-underline shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-base">📊</span>
              <span className="font-display text-sm font-bold text-purple-700">
                {t("피부 리포트", "Skin Report")}
              </span>
            </Link>
          </div>

          {/* ── Calendar ── */}
          <div
            className="anim-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
              <button
                onClick={prevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <button
                onClick={goToToday}
                className="flex items-center gap-2 border-none bg-transparent p-0"
              >
                <h2 className="font-display text-lg font-extrabold text-gray-900">
                  {viewYear}년 {viewMonth + 1}월
                </h2>
                {!isCurrentMonth && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                    오늘
                  </span>
                )}
              </button>

              <button
                onClick={nextMonth}
                disabled={isFutureBlocked}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 px-2 pt-3 pb-2">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={`text-center text-[11px] font-bold tracking-wide ${i === 0 ? "text-rose-300" : i === 6 ? "text-blue-300" : "text-gray-300"}`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 px-2 pb-4">
              {calendarDays.map((d, idx) => {
                const entry = d.current ? entryByDay.get(d.day) : undefined
                const isToday = isCurrentMonth && d.current && d.day === today
                const isSelected = d.current && d.day === selectedDate
                const isFuture = d.current && isCurrentMonth && d.day > today

                // Cell background based on condition
                const cellBg = entry
                  ? entry.condition === "good"
                    ? "bg-emerald-50 border-emerald-200"
                    : entry.condition === "normal"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-rose-50 border-rose-200"
                  : "bg-white border-transparent"

                // Text color based on condition
                const numColor = entry
                  ? entry.condition === "good"
                    ? "text-emerald-700"
                    : entry.condition === "normal"
                      ? "text-amber-700"
                      : "text-rose-700"
                  : "text-gray-500"

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!d.current || isFuture) return
                      setSelectedDate(isSelected ? null : d.day)
                      setEditingId(null)
                    }}
                    disabled={!d.current || isFuture}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-[1.5px] transition-all duration-200 ${!d.current ? "pointer-events-none opacity-0" : ""} ${isFuture ? "cursor-not-allowed border-transparent opacity-25" : ""} ${d.current && !entry && !isSelected && !isToday ? "border-transparent hover:bg-gray-50" : ""} ${
                      isSelected
                        ? "z-10 border-purple-400 shadow-[0_0_0_2px_rgba(168,85,247,0.15)] " +
                          (entry ? cellBg.split(" ")[0] : "bg-purple-50")
                        : entry
                          ? cellBg
                          : ""
                    } ${isToday && !isSelected ? "border-purple-300 bg-purple-50/40" : ""} `}
                  >
                    {/* Day number */}
                    <span
                      className={`text-[13px] leading-none font-semibold ${!d.current ? "text-gray-200" : ""} ${d.current && !entry ? "text-gray-400" : ""} ${d.current && entry ? numColor : ""} ${isToday ? "font-extrabold" : ""} ${isSelected && !entry ? "font-bold text-purple-600" : ""} `}
                    >
                      {d.day}
                    </span>

                    {/* Condition emoji — clear visual */}
                    {entry && (
                      <span className="mt-0.5 text-[15px] leading-none">
                        {entry.condition === "good"
                          ? "😊"
                          : entry.condition === "normal"
                            ? "😐"
                            : "😣"}
                      </span>
                    )}

                    {/* Today label */}
                    {isToday && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-extrabold tracking-tight text-purple-400">
                        today
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Monthly summary bar */}
            {entries.length > 0 && (
              <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-3.5">
                <div className="flex flex-1 items-center gap-3">
                  {goodCount > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                      <span className="text-xs">😊</span>
                      <span className="text-[11px] font-bold text-emerald-600">
                        {goodCount}일
                      </span>
                    </div>
                  )}
                  {normalCount > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1">
                      <span className="text-xs">😐</span>
                      <span className="text-[11px] font-bold text-amber-600">
                        {normalCount}일
                      </span>
                    </div>
                  )}
                  {badCount > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1">
                      <span className="text-xs">😣</span>
                      <span className="text-[11px] font-bold text-rose-600">
                        {badCount}일
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-gray-400">
                  총 {entries.length}일
                </span>
              </div>
            )}
          </div>

          {/* Loading overlay for month transition */}
          {loading && (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500" />
            </div>
          )}

          {/* ── Selected Day Detail ── */}
          {selectedDate && (
            <div className="anim-pop-in mt-4">
              {selectedEntry ? (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {/* Color bar */}
                  <div
                    className={`h-1.5 ${conditionBar(selectedEntry.condition)}`}
                  />

                  <div className="p-5">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {conditionEmoji(selectedEntry.condition)}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {formatFullDate(selectedEntry.date)}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${conditionTag(selectedEntry.condition)}`}
                          >
                            {conditionLabel(selectedEntry.condition)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() =>
                            editingId === selectedEntry.id
                              ? setEditingId(null)
                              : startEdit(selectedEntry)
                          }
                          className="rounded-xl p-2 text-gray-300 transition-all hover:bg-gray-50 hover:text-purple-400"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(selectedEntry.id)}
                          disabled={deletingId === selectedEntry.id}
                          className="rounded-xl p-2 text-gray-300 transition-all hover:bg-gray-50 hover:text-rose-400"
                        >
                          {deletingId === selectedEntry.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-400" />
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Note */}
                    {selectedEntry.note && (
                      <p className="mb-3 text-xs leading-relaxed whitespace-pre-wrap text-gray-600">
                        {selectedEntry.note}
                      </p>
                    )}

                    {/* Products */}
                    {selectedEntry.products?.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                          사용 제품
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEntry.products.map((p) => (
                            <span
                              key={p}
                              className="inline-block rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Troubles */}
                    {selectedEntry.troubles?.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                          트러블
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEntry.troubles.map((tid) => {
                            const t = TROUBLES.find((x) => x.id === tid)
                            return t ? (
                              <span
                                key={tid}
                                className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500"
                              >
                                <span>{t.icon}</span>
                                {t.ko}
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Foods */}
                    {selectedEntry.foods && selectedEntry.foods.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                          식단
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEntry.foods.map((f) => (
                            <span
                              key={f}
                              className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600"
                            >
                              🍽 {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skindit tip */}
                    <div
                      className={`mt-3 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${conditionTipBg(selectedEntry.condition)}`}
                    >
                      <span className="font-bold">💜 skindit tip</span>
                      {" · "}
                      {selectedEntry.tip ||
                        (selectedEntry.condition === "good"
                          ? "오늘의 루틴이 피부에 잘 맞는 날이에요, 이 조합을 기억해두세요 ✨"
                          : selectedEntry.condition === "normal"
                            ? "피부가 균형을 찾아가고 있어요, 수분 케어에 조금만 더 신경 써주세요 💧"
                            : "오늘은 피부가 쉴 시간이 필요해요, 순한 제품으로 진정시켜 주세요 🛡️")}
                    </div>

                    {/* Edit form */}
                    {editingId === selectedEntry.id && (
                      <div className="anim-fade-up mt-4 border-t border-gray-100 pt-4">
                        <div className="mb-2 flex gap-2">
                          {[
                            { id: "good", emoji: "😊", label: "좋음" },
                            { id: "normal", emoji: "😐", label: "보통" },
                            { id: "bad", emoji: "😣", label: "나쁨" },
                          ].map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setEditCondition(c.id)}
                              className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                editCondition === c.id
                                  ? "border-purple-300 bg-purple-50 text-purple-700"
                                  : "border-gray-100 bg-gray-50 text-gray-500"
                              }`}
                            >
                              <span>{c.emoji}</span> {c.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          rows={3}
                          className="mb-2 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-900 transition-all outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(selectedEntry.id)}
                            disabled={editSaving}
                            className="from-pastel-lavender-dark to-pastel-rose-dark rounded-lg bg-linear-to-r px-4 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                          >
                            {editSaving ? t("저장 중...", "Saving...") : t("수정 완료", "Save")}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-200"
                          >
                            {t("취소", "Cancel")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* No entry for this date */
                <div className="rounded-2xl bg-white p-8 text-center">
                  <p className="mb-2 text-2xl">📝</p>
                  <p className="mb-1 text-sm font-bold text-gray-600">
                    {lang === "ko" ? `${viewMonth + 1}월 ${selectedDate}일 기록이 없어요` : `No entry for ${viewMonth + 1}/${selectedDate}`}
                  </p>
                  <p className="mb-4 text-xs text-gray-400">
                    {t("피부 상태를 기록해볼까?", "Want to log your skin?")}
                  </p>
                  <Link
                    href={`/diary/write?date=${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`}
                    className="from-pastel-lavender-dark to-pastel-rose-dark inline-flex items-center rounded-xl bg-linear-to-r px-5 py-2 text-xs font-bold text-white no-underline shadow-md transition-all hover:scale-105 hover:shadow-lg"
                  >
                    {t("기록하기", "Log")}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Empty state (no entries at all this month) ── */}
          {!loading && entries.length === 0 && !selectedDate && (
            <div className="anim-scale-in mt-6 rounded-2xl bg-white p-10 text-center">
              <div className="mb-4 text-4xl">🔍</div>
              <p className="mb-1 text-sm font-bold text-gray-700">
                {t("이번 달엔 기록이 없네요~", "No entries this month~")}
              </p>
              <p className="text-xs leading-relaxed text-gray-400">
                {t("피부 상태를 기록하면", "Log your skin to")}
                <br />
                {t("트러블 원인을 추적할 수 있어요!", "track trouble causes!")}
              </p>
              {entries.length < 5 && (
                <p className="mt-3 text-[11px] font-medium text-purple-400">
                  {t("📊 5일만 기록하면 리포트가 열려요!", "📊 Log 5 days to unlock your report!")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Floating "+ 새 기록" Button ── */}
        <Link
          href="/diary/write"
          className="from-pastel-lavender-dark to-pastel-rose-dark font-display fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-2xl bg-linear-to-r via-purple-400 px-7 py-3.5 text-sm font-bold tracking-wide text-white no-underline shadow-lg shadow-purple-300/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-400/50"
        >
          {t("새 기록", "New Entry")}
        </Link>
      </div>
    </div>
  )
}
