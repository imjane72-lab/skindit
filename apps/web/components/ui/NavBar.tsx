"use client"

interface NavBarProps {
  title?: string
}

export function Logo() {
  return (
    <>
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-pastel-lime-dark shadow-md">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="relative"
        >
          <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" />
          <path
            d="M16 16L20 20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">
          skin
        </span>
        <span className="font-accent from-pastel-lime-dark to-pastel-gold bg-linear-to-r bg-clip-text text-[17px] font-semibold text-transparent italic">
          dit
        </span>
      </div>
    </>
  )
}

export default function NavBar({ title }: NavBarProps) {
  // 로고 클릭 시 항상 하드 네비게이션으로 "/"로 이동 → 홈에 이미 있어도 새로고침되면서
  // 분석 결과·입력 state가 전부 초기 상태로 돌아감. 사용자가 "로고 누르면 깨끗하게
  // 처음부터 시작"이라는 일반적 UX 기대를 충족.
  const goHome = () => {
    try {
      sessionStorage.removeItem("skindit_result")
      sessionStorage.removeItem("skindit_pending")
    } catch {
      /* */
    }
    // 이미 홈이면 reload, 아니면 이동. 둘 다 React state 완전 초기화.
    if (window.location.pathname === "/") {
      window.location.reload()
    } else {
      window.location.href = "/"
    }
  }

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-2xl">
      <button
        onClick={goHome}
        className="flex items-center gap-3 border-none bg-transparent p-0"
      >
        <Logo />
      </button>
      {title && (
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
          {title}
        </span>
      )}
    </nav>
  )
}
