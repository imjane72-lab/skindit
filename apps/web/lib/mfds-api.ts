/**
 * 식품의약품안전처 화장품 성분 공공데이터 API
 *
 * 1. 화장품 원료성분정보: 성분별 효능, 용도, 안전성
 * 2. 화장품 규제정보: 금지/제한 성분, 국가별 규제
 *
 * API 키 발급: https://www.data.go.kr
 * 검색: "화장품 원료성분정보", "화장품 규제정보"
 */

const MFDS_KEY = process.env.MFDS_API_KEY || ""
const BASE_URL = "https://apis.data.go.kr/1471000"

export interface MfdsIngredient {
  name: string        // 성분명 (한글)
  nameEn: string      // 성분명 (영문)
  purpose: string     // 용도/효능
  restriction: string // 제한사항
  maxLimit: string    // 최대 사용량
  isRestricted: boolean
  isBanned: boolean
  source: "mfds"      // 식약처 데이터임을 표시
}

/**
 * 성분명으로 식약처 원료성분정보 조회
 */
export async function searchIngredient(name: string): Promise<MfdsIngredient | null> {
  if (!MFDS_KEY) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000) // 2초 타임아웃
    const res = await fetch(
      `${BASE_URL}/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntInfoService01?serviceKey=${encodeURIComponent(MFDS_KEY)}&type=json&numOfRows=5&INGR_KOR_NAME=${encodeURIComponent(name)}`,
      { next: { revalidate: 86400 }, signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    const items = data?.body?.items
    if (!items || items.length === 0) return null

    const item = items[0]
    return {
      name: item.INGR_KOR_NAME || name,
      nameEn: item.INGR_ENG_NAME || "",
      purpose: item.ORIGIN_MAJOR_KOR_NAME || "",
      restriction: "",
      maxLimit: "",
      isRestricted: false,
      isBanned: false,
      source: "mfds",
    }
  } catch {
    return null
  }
}

/**
 * 성분명으로 식약처 규제정보 조회
 */
export async function checkRegulation(name: string): Promise<{ regulated: boolean; detail: string } | null> {
  if (!MFDS_KEY) return null
  try {
    const res = await fetch(
      `${BASE_URL}/CsmtcsReglMaterialInfoService/getCsmtcsReglMaterialInfoService?serviceKey=${encodeURIComponent(MFDS_KEY)}&type=json&numOfRows=5&INGR_KOR_NAME=${encodeURIComponent(name)}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const items = data?.body?.items
    if (!items || items.length === 0) return { regulated: false, detail: "" }

    const item = items[0]
    const banned = item.PROH_NATIONAL?.includes("한국")
    const limited = item.LIMIT_NATIONAL?.includes("한국")
    return {
      regulated: banned || limited || false,
      detail: banned ? `한국 포함 금지 (${item.PROH_NATIONAL})` : limited ? `한국 사용 제한 (${item.LIMIT_NATIONAL})` : "",
    }
  } catch {
    return null
  }
}

/**
 * 여러 성분을 한번에 조회 (분석 시 사용)
 * 주요 성분만 조회하여 API 호출 최소화
 */
export async function batchCheckIngredients(ingredientNames: string[]): Promise<Record<string, MfdsIngredient>> {
  const results: Record<string, MfdsIngredient> = {}
  if (!MFDS_KEY) return results

  // 주요 성분만 조회 (최대 10개, API 부하 방지)
  const topIngredients = ingredientNames.slice(0, 10)

  await Promise.all(
    topIngredients.map(async (name) => {
      const info = await searchIngredient(name)
      if (info) results[name] = info
    })
  )

  return results
}

/**
 * 성분 분석 시 AI 프롬프트에 추가할 식약처 데이터 문자열 생성
 */
export async function getMfdsContext(ingredientNames: string[]): Promise<string> {
  const data = await batchCheckIngredients(ingredientNames)
  const verified = Object.keys(data)

  if (verified.length === 0) return ""

  const lines = verified.map(name => {
    const info = data[name]!
    return `✅ ${name} (${info.nameEn}) — 식약처 등록 원료`
  })

  let result = `\n\n[식약처 공식 데이터 - 확인된 성분만 표시]\n${lines.join("\n")}`
  result += `\n※ 위 목록에 없는 성분은 데이터가 없는 것이므로 등록 여부를 언급하지 마세요.`

  return result
}
