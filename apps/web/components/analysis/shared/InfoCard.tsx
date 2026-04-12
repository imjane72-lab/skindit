"use client"

import type { ReactNode } from "react"
import Md from "@/components/ui/Md"

interface InfoCardProps {
  label?: string
  icon?: string
  children: string | ReactNode
  variant?: "light" | "brand"
}

export default function InfoCard({
  label,
  icon,
  children,
  variant = "light",
}: InfoCardProps) {
  const isBrand = variant === "brand"
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isBrand
          ? "border-[#9bce26]/20 bg-linear-to-br from-[#f0f7d4]/70 to-white"
          : "border-gray-100 bg-white"
      }`}
    >
      {(label || icon) && (
        <div className="mb-1.5 flex items-center gap-1.5">
          {icon && <span className="text-sm">{icon}</span>}
          {label && (
            <p
              className={`text-[10px] font-bold tracking-wide uppercase ${
                isBrand ? "text-[#6B8E23]" : "text-gray-500"
              }`}
            >
              {label}
            </p>
          )}
        </div>
      )}
      <div className="text-[13px] leading-relaxed text-gray-700">
        {typeof children === "string" ? <Md>{children}</Md> : children}
      </div>
    </div>
  )
}
