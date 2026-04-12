"use client"

import React from "react"

export function parseBold(text: string): React.ReactNode {
  if (!text.includes("**")) return text
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold text-gray-800">{part.slice(2, -2)}</strong>
      : part
  )
}

export default function Md({ children }: { children: string }) {
  if (!children) return null
  const lines = children.split("\n")
  return (
    <>
      {lines.map((line, li) => {
        const trimmed = line.trim()
        if (!trimmed) return <br key={li} />
        // # 으로 시작하는 줄 → 볼드 제목으로 변환
        if (/^#{1,3}/.test(trimmed)) {
          const text = trimmed.replace(/^#{1,3}\s*/, "")
          return <p key={li} className="mt-3 mb-1 text-sm font-extrabold text-gray-800">{text}</p>
        }
        // 불릿 리스트 처리
        if (trimmed.startsWith("- ")) {
          const content = trimmed.slice(2)
          return (
            <div key={li} className="flex gap-1.5 ml-1 mb-0.5">
              <span className="shrink-0 text-pastel-lime-dark">·</span>
              <span>{parseBold(content)}</span>
            </div>
          )
        }
        // 별점 표시
        if (trimmed.includes("★")) {
          return <p key={li} className="font-bold text-amber-600 mt-1">{trimmed}</p>
        }
        // 섹션 헤더 (콜론으로 끝나는 짧은 볼드 줄)
        if (trimmed.endsWith(":") && !trimmed.includes(" ") === false && trimmed.length < 30) {
          return <p key={li} className="mt-2.5 mb-1 text-xs font-extrabold text-lime-700">{trimmed}</p>
        }
        // 일반 텍스트 (볼드 파싱 포함)
        return <span key={li}>{parseBold(trimmed)}{li < lines.length - 1 ? " " : ""}</span>
      })}
    </>
  )
}
