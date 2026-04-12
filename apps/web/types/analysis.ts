export interface IngredientItem {
  name: string
  benefit?: string
  reason?: string
  alternative?: string
  best_time?: string
  synergy?: string[]
}

export interface ConcernAnalysis {
  concern: string
  score: number
  comment: string
}

export interface SafetyRating {
  name: string
  score: number
  note: string
}

export interface ForbiddenCombo {
  ingredients: string
  reason: string
}

export interface UsageGuide {
  best_time?: string
  effect_timeline?: string
  beginner_tips?: string[]
}

export interface SingleRes {
  error?: boolean
  errorMessage?: string
  overall_score: number
  overall_comment: string
  verdict?: string
  concern_analysis?: ConcernAnalysis[]
  star_ingredients?: IngredientItem[]
  watch_out?: IngredientItem[]
  safety_ratings?: SafetyRating[]
  forbidden_combos?: ForbiddenCombo[]
  usage_guide?: UsageGuide
}

export interface RoutineConflict {
  ingredients?: string[]
  products?: string[]
  severity: string
  reason: string
}

export interface RoutineSynergy {
  ingredients?: string[]
  products?: string[]
  reason: string
}

export interface RoutineTimeline {
  product: string
  timing: "morning" | "evening" | "both"
  reason: string
}

export interface RoutineRes {
  error?: boolean
  errorMessage?: string
  routine_score: number
  routine_comment: string
  verdict?: string
  conflicts?: RoutineConflict[]
  synergies?: RoutineSynergy[]
  order_suggestion?: string[]
  recommendations?: string[]
  timeline?: RoutineTimeline[]
  usage_guide?: UsageGuide
}

export interface Product {
  id: number
  name: string
  ingredients: string
}

export interface CompareItem {
  name: string
  inA: boolean
  inB: boolean
  note: string
}

export interface CompareRes {
  error?: boolean
  errorMessage?: string
  score_a?: number
  score_b?: number
  score_a_reason?: string
  score_b_reason?: string
  pick?: "A" | "B" | "both" | "either"
  pick_reason?: string
  summary: string
  shared: CompareItem[]
  only_a: CompareItem[]
  only_b: CompareItem[]
  recommendation: string
  verdict: string
  forbidden_combos?: ForbiddenCombo[]
  usage_guide?: UsageGuide
  compatibility_score?: number
  compatibility_comment?: string
}
