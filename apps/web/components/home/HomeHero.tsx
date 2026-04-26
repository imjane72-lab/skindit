"use client"

import {
  Microscope,
  NotebookPen,
  BarChart3,
  MessageCircle,
  type LucideIcon,
} from "lucide-react"
import ProfileDropdown from "@/components/home/ProfileDropdown"

interface HomeHeroProps {
  t: (ko: string, en: string) => string
  lang: string
}

/**
 * 메인 페이지 Hero 섹션.
 *
 * [구성]
 *   - 미니멀 메시 그라디언트 배경 (radial gradient 2개 합성)
 *   - 우상단 ProfileDropdown (로그인/메뉴)
 *   - 메인 타이틀 + 설명 문구
 *   - "쓸수록 나를 알아가는 스킨딧" 4단계 순환 카드 (분석→기록→발견→상담)
 *
 * [설계 의도]
 *   본질적으로 정적인 마케팅 영역 → state 없음, props 최소화 (t/lang만).
 *   다국어 처리만 부모에서 주입받고 나머지는 자체 완결.
 */
export default function HomeHero({ t, lang }: HomeHeroProps) {
  const steps: Array<{
    Icon: LucideIcon
    label: string
    sub: string
    href: string
    scroll: boolean
  }> = [
    {
      Icon: Microscope,
      label: t("분석", "Analyze"),
      sub: t("성분 바로 분석", "Instant analysis"),
      href: "#analyze",
      scroll: true,
    },
    {
      Icon: NotebookPen,
      label: t("기록", "Record"),
      sub: t("피부 변화 기록", "Track changes"),
      href: "/diary",
      scroll: false,
    },
    {
      Icon: BarChart3,
      label: t("발견", "Discover"),
      sub: t("트러블 원인 발견", "Find causes"),
      href: "/diary/report",
      scroll: false,
    },
    {
      Icon: MessageCircle,
      label: t("상담", "Consult"),
      sub: t("1:1 AI 상담", "1:1 AI consult"),
      href: "/chat",
      scroll: false,
    },
  ]

  return (
    <div className="relative overflow-hidden border-b border-gray-100/50 px-6 pt-14 pb-12">
      {/* 미니멀 메시 그라디언트 배경 — 두 개의 radial gradient를 합성해 부드러운 배경 연출 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(155,206,38,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(232,184,48,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative">
        {/* Profile / Login circle */}
        <div className="absolute -top-8 right-0 z-10">
          <div className="relative">
            <ProfileDropdown t={t} />
          </div>
        </div>

        {/* 소제목 (작게) */}
        <p className="anim-fade-up mb-4 text-sm font-semibold tracking-wide text-pastel-olive">
          {t(
            "2만 개+ 성분 데이터 기반 AI 분석",
            "AI Analysis Powered by 20K+ Ingredients"
          )}
        </p>

        {/* 메인 타이틀 (크게) */}
        <h1
          className="anim-fade-up mb-5 text-[clamp(28px,6.5vw,42px)] leading-[1.2]"
          style={{ animationDelay: "60ms" }}
        >
          {lang === "ko" ? (
            <>
              <span className="font-display font-extrabold tracking-tight text-gray-900">
                나보다 내 피부를 더 잘 아는
              </span>
              <br />
              <span className="text-[clamp(36px,8vw,52px)]">
                <span className="font-display font-extrabold tracking-tight text-gray-900">
                  skin
                </span>
                <span className="font-accent gradient-text font-semibold tracking-normal italic">
                  dit
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="font-display font-extrabold tracking-tight text-gray-900">
                Knows your skin
              </span>
              <br />
              <span className="font-display font-extrabold tracking-tight text-gray-900">
                better than you —{" "}
              </span>
              <span className="font-display font-extrabold tracking-tight text-gray-900">
                skin
              </span>
              <span className="font-accent gradient-text font-semibold tracking-normal italic">
                dit
              </span>
            </>
          )}
        </h1>

        {/* 설명 문구 (중간) */}
        <p
          className="anim-fade-up mb-8 max-w-145 text-[17px] leading-relaxed font-medium text-pastel-olive/80"
          style={{ animationDelay: "100ms" }}
        >
          {t(
            "사진 한 장으로 성분 해석부터 조합 경고까지!",
            "From ingredient analysis to combo warnings — just one photo!"
          )}
        </p>

        {/* ── 순환 구조: 스킨딧 루프 ── */}
        <div
          className="anim-fade-up mt-14 mb-6"
          style={{ animationDelay: "140ms" }}
        >
          <p className="mb-2 text-center text-lg font-extrabold text-gray-900">
            {t(
              "쓸수록 나를 알아가는 스킨딧",
              "skindit learns you over time"
            )}
          </p>
          <p className="mb-6 text-center text-sm text-gray-500">
            {t(
              "분석 → 기록 → 발견 → 상담, 이 흐름이 반복될수록 정확해져요",
              "Analyze → Record → Discover → Consult — gets smarter each cycle"
            )}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {steps.map((step, i) => (
              <a
                key={i}
                href={step.href}
                onClick={
                  step.scroll
                    ? (e: React.MouseEvent) => {
                        e.preventDefault()
                        // 분석 탭이 화면 안에 들어오도록 부드럽게 스크롤
                        document
                          .getElementById("analysis-tabs")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    : undefined
                }
                className="border-rule bg-paper-card hover:border-ink-faint flex items-center gap-3 rounded-xl border p-4 no-underline transition-colors"
              >
                <span className="bg-rule-soft text-brand-deep flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <step.Icon size={18} strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-ink text-[14px] font-semibold">
                    {step.label}
                  </p>
                  <p className="text-ink-muted text-[12px]">{step.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
