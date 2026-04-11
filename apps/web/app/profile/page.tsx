"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import NavBar from "@/components/ui/NavBar"

/* ── 피부 타입 데이터 ── */
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
    color: "bg-pastel-lavender text-lime-800 border-lime-200",
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
    color: "bg-pastel-lilac text-lime-800 border-lime-200",
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
    color: "bg-lime-50 text-lime-800 border-lime-200",
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


export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [skinType, setSkinType] = useState<string[]>([])
  const [concerns, setConcerns] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // 로그인 안 되어 있으면 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // 기존 프로필 불러오기
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
        /* 첫 방문 사용자 */
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
      <div className="via-[#9bce26]/5 to-pastel-rose/20 min-h-screen bg-linear-to-b from-white">
        <NavBar title="Profile" />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#9bce26]/30 border-t-[#9bce26]" />
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative mx-auto min-h-screen max-w-160 overflow-hidden bg-white shadow-xl">
        <NavBar title="Profile" />

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
              <span className="ml-2 text-[11px] font-medium text-[#9bce26]">
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
                        ? "border-[#9bce26]/40 shadow-lg ring-2 shadow-[#9bce26]/10 ring-[#9bce26]"
                        : skinType.length >= 2
                          ? "opacity-40"
                          : "hover:border-lime-100 hover:shadow-md"
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
                            ? "border-[#9bce26] bg-[#9bce26]"
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
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
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
              className="w-full resize-none rounded-2xl border border-[#9bce26]/30 bg-white p-4 text-sm text-gray-700 transition-all placeholder:text-gray-300 focus:outline-none"
            />
          </section>

          {/* ── Save ── */}
          <div className="anim-fade-up" style={{ animationDelay: "0.2s" }}>
            <button
              onClick={handleSave}
              disabled={saving || skinType.length === 0}
              className="font-display relative h-13 w-full overflow-hidden rounded-2xl bg-[#9bce26] text-sm font-bold tracking-wide text-white shadow-lg shadow-[#9bce26]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#9bce26]/40 disabled:cursor-not-allowed disabled:opacity-40"
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
