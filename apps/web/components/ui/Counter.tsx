"use client"

import { useState, useEffect } from "react"

export default function Counter({ to, dur = 900 }: { to: number; dur?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let s: number | null = null
    const tick = (ts: number) => {
      if (!s) s = ts
      const p = Math.min((ts - s) / dur, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setN(Math.round(to * e))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, dur])
  return <>{n}</>
}
