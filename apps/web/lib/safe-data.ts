/**
 * AI 응답 데이터 안전 처리 유틸리티
 * undefined, null, NaN, 잘못된 타입 방어
 */

/** 숫자 안전 변환 (기본값 포함) */
export const safeNum = (v: unknown, fallback = 0): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** 점수 안전 변환 (0~100 범위) */
export const safeScore = (v: unknown): number => {
  const n = safeNum(v, 0)
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** 안전 등급 점수 변환 (1~10 범위) */
export const safeSafetyScore = (v: unknown): number => {
  const n = safeNum(v, 1)
  if (n < 1 || n > 10) return 1
  return Math.round(n)
}

/** 문자열 안전 변환 */
export const safeStr = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v
  if (v == null) return fallback
  return String(v)
}

/** 배열 안전 변환 */
export const safeArr = <T>(v: unknown): T[] => {
  if (Array.isArray(v)) return v
  return []
}

/** AI 응답 전체 정제 */
export function sanitizeAnalysisResult(raw: Record<string, unknown>) {
  if (raw.overall_score != null) {
    const s = safeNum(raw.overall_score, 50)
    raw.overall_score = s <= 10 ? s * 10 : Math.max(0, Math.min(100, Math.round(s)))
  }

  if (raw.overall_comment != null) {
    raw.overall_comment = safeStr(raw.overall_comment)
  }

  if (raw.verdict != null) {
    raw.verdict = safeStr(raw.verdict)
  }

  if (raw.routine_comment != null) {
    raw.routine_comment = safeStr(raw.routine_comment)
  }

  if (raw.concern_analysis) {
    raw.concern_analysis = safeArr<Record<string, unknown>>(raw.concern_analysis)
      .filter((c: Record<string, unknown>) => c && c.concern)
      .map((c: Record<string, unknown>) => ({
        ...c,
        concern: safeStr(c.concern),
        score: safeScore(safeNum(c.score as number, 5) <= 10 ? (c.score as number) * 10 : c.score),
        comment: safeStr(c.comment),
      }))
  }

  if (raw.safety_ratings) {
    raw.safety_ratings = safeArr<Record<string, unknown>>(raw.safety_ratings)
      .filter((r: Record<string, unknown>) => r && r.name)
      .map((r: Record<string, unknown>) => ({
        ...r,
        name: safeStr(r.name),
        score: safeSafetyScore(r.score),
        note: safeStr(r.note),
      }))
  }

  if (raw.star_ingredients) {
    raw.star_ingredients = safeArr<Record<string, unknown>>(raw.star_ingredients)
      .filter((ing: Record<string, unknown>) => ing && ing.name)
      .map((ing: Record<string, unknown>) => ({
        ...ing,
        name: safeStr(ing.name),
        benefit: safeStr(ing.benefit),
        best_time: safeStr(ing.best_time),
        synergy: safeArr<string>(ing.synergy),
      }))
  }

  if (raw.watch_out) {
    raw.watch_out = safeArr<Record<string, unknown>>(raw.watch_out)
      .filter((ing: Record<string, unknown>) => ing && ing.name)
      .map((ing: Record<string, unknown>) => ({
        ...ing,
        name: safeStr(ing.name),
        reason: safeStr(ing.reason),
        alternative: safeStr(ing.alternative),
      }))
  }

  if (raw.forbidden_combos) {
    raw.forbidden_combos = safeArr<Record<string, unknown>>(raw.forbidden_combos)
      .filter((c: Record<string, unknown>) => c && c.ingredients)
      .map((c: Record<string, unknown>) => ({
        ...c,
        ingredients: safeStr(c.ingredients),
        reason: safeStr(c.reason),
      }))
  }

  if (raw.usage_guide && typeof raw.usage_guide === "object") {
    const ug = raw.usage_guide as Record<string, unknown>
    raw.usage_guide = {
      best_time: safeStr(ug.best_time),
      effect_timeline: safeStr(ug.effect_timeline),
      beginner_tips: safeArr<string>(ug.beginner_tips).map((t) => safeStr(t)),
    }
  }

  return raw
}
