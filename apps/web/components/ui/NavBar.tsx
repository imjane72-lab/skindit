"use client"

import { useRouter } from "next/navigation"

interface NavBarProps {
  title?: string
}

export function Logo() {
  return (
    <>
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-[#9bce26] shadow-md">
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
        <span className="font-accent from-pastel-lavender-dark to-pastel-rose-dark bg-linear-to-r bg-clip-text text-[17px] font-semibold text-transparent italic">
          dit
        </span>
      </div>
    </>
  )
}

export default function NavBar({ title }: NavBarProps) {
  const router = useRouter()
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-2xl">
      <button
        onClick={() => router.push("/")}
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
