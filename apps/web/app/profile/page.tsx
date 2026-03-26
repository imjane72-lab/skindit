"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

/* ── Data ── */
const SKIN_TYPES = [
  {
    id: "DRY",
    ko: "건성",
    en: "Dry",
    icon: "🏜",
    desc: "당김이 있고 수분 부족",
  },
  {
    id: "OILY",
    ko: "지성",
    en: "Oily",
    icon: "💧",
    desc: "피지 분비가 많은 편",
  },
  {
    id: "COMBINATION",
    ko: "복합성",
    en: "Combination",
    icon: "🔀",
    desc: "T존은 지성, 볼은 건성",
  },
  {
    id: "SENSITIVE",
    ko: "민감성",
    en: "Sensitive",
    icon: "🫧",
    desc: "자극에 쉽게 반응",
  },
  {
    id: "NORMAL",
    ko: "중성",
    en: "Normal",
    icon: "✨",
    desc: "균형 잡힌 피부",
  },
]

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
          <span className="font-accent from-pastel-lavender-dark to-pastel-rose-dark bg-linear-to-r bg-clip-text text-[17px] font-semibold text-transparent italic">
            dit
          </span>
        </div>
      </button>
      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
        Profile
      </span>
    </nav>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [skinType, setSkinType] = useState<string[]>([])
  const [concerns, setConcerns] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Load existing profile
  useEffect(() => {
    if (status !== "authenticated") return
    ;(async () => {
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          const types = data.skinTypes || data.skinType
          if (types) setSkinType(Array.isArray(types) ? types : [types])
          if (data.concerns) setConcerns(data.concerns)
          if (data.note || data.notes) setNotes(data.note || data.notes)
        }
      } catch {
        /* first time user */
      } finally {
        setLoadingProfile(false)
      }
    })()
  }, [status])

  const toggleConcern = (id: string) => {
    setConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinTypes: skinType, concerns, note: notes }),
      })
      setSaved(true)
      setTimeout(() => router.push("/"), 1200)
    } catch {
      alert("저장에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loadingProfile) {
    return (
      <div className="via-pastel-lavender/20 to-pastel-rose/20 min-h-screen bg-linear-to-b from-white">
        <NavBar />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-200 border-t-purple-500" />
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative mx-auto min-h-screen max-w-160 overflow-hidden bg-white shadow-xl">
        <NavBar />

        <div className="px-6 py-8 pb-24">
          {/* Header */}
          <div className="anim-fade-up mb-8">
            <h1 className="font-display mb-1 text-2xl font-extrabold text-gray-900">
              나의 피부 프로필
            </h1>
            <p className="text-sm text-gray-400">My Skin Profile</p>
            {session?.user?.name && (
              <p className="mt-2 text-xs text-gray-300">
                {session.user.name}님, 안녕하세요!
              </p>
            )}
          </div>

          {/* ── Skin Type ── */}
          <section
            className="anim-fade-up mb-8"
            style={{ animationDelay: "0.05s" }}
          >
            <h2 className="font-display mb-4 text-sm font-bold tracking-widest text-gray-600 uppercase">
              피부 타입{" "}
              <span className="font-normal tracking-normal text-gray-300 normal-case">
                Skin Type
              </span>
              <span className="ml-2 text-[11px] font-medium text-purple-400">
                최대 2개
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {SKIN_TYPES.map((type) => {
                const selected = skinType.includes(type.id)
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSaved(false)
                      if (selected) {
                        setSkinType(skinType.filter((t) => t !== type.id))
                      } else if (skinType.length < 2) {
                        setSkinType([...skinType, type.id])
                      }
                    }}
                    className={`glass-card rounded-2xl p-4 text-left transition-all duration-200 ${
                      selected
                        ? "border-purple-200 shadow-lg ring-2 shadow-purple-100/50 ring-purple-400"
                        : skinType.length >= 2
                          ? "opacity-40"
                          : "hover:border-purple-100 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-gray-800">
                            {type.ko}
                          </span>
                          <span className="text-xs text-gray-400">
                            {type.en}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {type.desc}
                        </p>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                          selected
                            ? "border-purple-400 bg-purple-400"
                            : "border-gray-200"
                        }`}
                      >
                        {selected && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M3 6L5.5 8.5L9 3.5"
                              stroke="white"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Concerns ── */}
          <section
            className="anim-fade-up mb-8"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="font-display mb-4 text-sm font-bold tracking-widest text-gray-600 uppercase">
              피부 고민{" "}
              <span className="font-normal tracking-normal text-gray-300 normal-case">
                Concerns
              </span>
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {CONCERNS.map((c) => {
                const active = concerns.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleConcern(c.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? `${c.color} scale-105 shadow-md`
                        : "border-gray-200 bg-white/60 text-gray-400 hover:border-gray-300 hover:bg-white"
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.ko}</span>
                  </button>
                )
              })}
            </div>
            {concerns.length > 0 && (
              <p className="mt-3 text-xs text-gray-300">
                {concerns.length}개 선택됨
              </p>
            )}
          </section>

          {/* ── Notes ── */}
          <section
            className="anim-fade-up mb-10"
            style={{ animationDelay: "0.15s" }}
          >
            <h2 className="font-display mb-4 text-sm font-bold tracking-widest text-gray-600 uppercase">
              메모{" "}
              <span className="font-normal tracking-normal text-gray-300 normal-case">
                Notes (optional)
              </span>
            </h2>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setSaved(false)
              }}
              placeholder="알레르기, 복용 약, 특이사항 있으면 적어줘~"
              rows={4}
              className="glass-card w-full resize-none rounded-2xl p-4 text-sm text-gray-700 transition-all placeholder:text-gray-300 focus:ring-2 focus:ring-purple-300 focus:outline-none"
            />
          </section>

          {/* ── Save ── */}
          <div className="anim-fade-up" style={{ animationDelay: "0.2s" }}>
            <button
              onClick={handleSave}
              disabled={saving || skinType.length === 0}
              className="from-pastel-lavender-dark to-pastel-rose-dark font-display relative h-13 w-full overflow-hidden rounded-2xl bg-linear-to-r via-purple-400 text-sm font-bold tracking-wide text-white shadow-lg shadow-purple-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-300/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  <span>저장 중...</span>
                </div>
              ) : saved ? (
                <div className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 8L7 11L12 5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>저장 완료~!</span>
                </div>
              ) : (
                "저장하기"
              )}
            </button>
            {skinType.length === 0 && (
              <p className="mt-3 text-center text-xs text-gray-300">
                피부 타입을 선택해줘!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
