export const API_HEADERS = {
  "Content-Type": "application/json",
  "x-skindit-client": "web",
}

export async function callAI(sys: string, usr: string, retries = 2): Promise<ReturnType<typeof JSON.parse>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ system: sys, user: usr }),
      })
      const d = await res.json()
      if (d.error) {
        if (attempt < retries && (res.status >= 500 || res.status === 429)) {
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
          continue
        }
        throw new Error(d.error.message)
      }
      const raw = d.content[0].text.replace(/```json|```/g, "").trim()
      try {
        return JSON.parse(raw)
      } catch {
        const fixed = raw + (raw.includes('"verdict"') ? '"}' : '"}]}')
        try {
          return JSON.parse(fixed)
        } catch {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 800))
            continue
          }
          throw new Error("분석 결과를 처리하지 못했어요. 다시 시도해주세요.")
        }
      }
    } catch (e) {
      if (attempt < retries && e instanceof TypeError) {
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
        continue
      }
      throw e
    }
  }
  throw new Error("서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.")
}

export async function callAIText(sys: string, usr: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ system: sys, user: usr }),
      })
      const d = await res.json()
      if (d.error) {
        if (attempt < retries && (res.status >= 500 || res.status === 429)) {
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
          continue
        }
        throw new Error(d.error.message)
      }
      return d.content[0].text.trim()
    } catch (e) {
      if (attempt < retries && e instanceof TypeError) {
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
        continue
      }
      throw e
    }
  }
  throw new Error("서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.")
}
