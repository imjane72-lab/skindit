"use client"

import { ButtonHTMLAttributes, ReactNode } from "react"

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  size?: "sm" | "md" | "lg"
  variant?: "solid" | "outline" | "ghost"
  loading?: boolean
}

export default function PrimaryButton({
  children,
  size = "lg",
  variant = "solid",
  loading = false,
  disabled,
  className = "",
  ...props
}: PrimaryButtonProps) {
  const base =
    "font-display relative w-full font-bold tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"

  const sizes = {
    sm: "rounded-xl px-4 py-2.5 text-xs",
    md: "rounded-2xl px-5 py-3 text-sm",
    lg: "rounded-2xl py-4 text-sm",
  }

  const variants = {
    solid:
      "bg-[#9bce26] text-white shadow-md hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:hover:translate-y-0 disabled:hover:shadow-none",
    outline:
      "border-2 border-[#9bce26]/40 bg-white text-[#9bce26] hover:bg-[#9bce26]/5 hover:border-[#9bce26]/60",
    ghost:
      "bg-[#9bce26]/10 text-[#9bce26] hover:bg-[#9bce26]/20",
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span>처리 중...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
