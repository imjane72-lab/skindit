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
        // Any line starting with # → bold title (remove all # symbols)
        if (/^#{1,3}/.test(trimmed)) {
          const text = trimmed.replace(/^#{1,3}\s*/, "")
          return <p key={li} className="mt-3 mb-1 text-sm font-extrabold text-gray-800">{text}</p>
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
