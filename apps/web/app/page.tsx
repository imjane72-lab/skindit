"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import {
  getIngredientContext,
  correctOcrIngredients,
} from "@/lib/ingredient-db"
import { callAI } from "@/lib/api"
import {
  CONCERNS,
  SAMPLE_S_KO,
  SAMPLE_S_EN,
  SAMPLE_R,
} from "@/constants/skin-data"
import type {
  SingleRes,
  RoutineRes,
  CompareRes,
  Product,
} from "@/types/analysis"
import SingleResult from "@/components/analysis/SingleResult"
import RoutineResult from "@/components/analysis/RoutineResult"
import CompareResult from "@/components/analysis/CompareResult"
import ErrState from "@/components/ui/ErrState"
import HomeFooter from "@/components/home/HomeFooter"
import PwaBanner from "@/components/home/PwaBanner"
import LoadingPhase from "@/components/home/LoadingPhase"
import TrendingIngredients from "@/components/home/TrendingIngredients"
import HomeHero from "@/components/home/HomeHero"
import { sanitizeAnalysisResult } from "@/lib/safe-data"

/* ════════════════════════════════════
   ROOT APP
════════════════════════════════════ */
export default function Page() {
  const { status } = useSession()
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem("skindit_lang") || "ko"
    return "ko"
  })
  const [tab, setTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("tab") || "single"
    }
    return "single"
  })
  const [phase, setPhase] = useState("setup")
  const [restored, setRestored] = useState(false)

  // 결과 상태 복원 (클라이언트에서만)
  useEffect(() => {
    history.scrollRestoration = "manual"
    try {
      const raw = sessionStorage.getItem("skindit_result")
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.phase === "result") {
          setTab(saved.tab)
          setPhase("result")
          if (saved.sRes) setSRes(saved.sRes)
          if (saved.rRes) setRRes(saved.rRes)
          if (saved.cRes) setCRes(saved.cRes)
          setRestored(true)
          return
        }
      }
    } catch {
      /* */
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }, [])
  const [concerns, setConcerns] = useState<string[]>([])
  const [profileNote, setProfileNote] = useState("")
  const [profileSkinTypes, setProfileSkinTypes] = useState<string[]>([])
  const [profileConcerns, setProfileConcerns] = useState<string[]>([])
  const [ings, setIngs] = useState("")
  const [productName, setProductName] = useState("")
  const [sRes, setSRes] = useState<SingleRes | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "", ingredients: "" },
    { id: 2, name: "", ingredients: "" },
  ])
  const [rRes, setRRes] = useState<RoutineRes | null>(null)
  // 비교 분석
  const [compareA, setCompareA] = useState("")
  const [compareB, setCompareB] = useState("")
  const [compareNameA, setCompareNameA] = useState("")
  const [compareNameB, setCompareNameB] = useState("")
  const [cRes, setCRes] = useState<CompareRes | null>(null)
  // 스트리밍 진행 중 텍스트 (loading 화면에 표시)
  const [streamingPreview, setStreamingPreview] = useState("")
  // 언어 전환 시 재분석을 위한 마지막 입력값 보관
  const [lastIngs, setLastIngs] = useState("")
  const [lastConcerns, setLastConcerns] = useState<string[]>([])
  const [lastProducts, setLastProducts] = useState<Product[]>([])
  // PWA 설치
  const [showPwaBanner, setShowPwaBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPwaBanner(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    // iOS Safari: beforeinstallprompt 미지원, 수동 가이드 표시
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    if (isIos && !isStandalone) setShowPwaBanner(true)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handlePwaInstall = async () => {
    if (deferredPrompt && "prompt" in deferredPrompt) {
      ;(deferredPrompt as { prompt: () => void }).prompt()
    } else {
      // iOS Safari — 설치 방법 안내
      alert(
        lang === "ko"
          ? "📱 홈 화면에 추가하는 방법\n\n1. Safari로 열기\n2. 공유 버튼 (↑) 열기\n3. '홈 화면에 추가' 클릭!\n\n완료!"
          : "📱 Add to Home Screen\n\n1. Open in Safari\n2. Tap Share button (□↑)\n3. Tap 'Add to Home Screen'!\n\nDone!"
      )
    }
    setShowPwaBanner(false)
  }

  const dismissPwa = () => {
    setShowPwaBanner(false)
  }

  // 올리브영 검색
  const [oyQuery, setOyQuery] = useState("")
  const [oyLoading, setOyLoading] = useState(false)
  const [oyError, setOyError] = useState("")
  const [oySuccess, setOySuccess] = useState("")
  // 루틴 탭
  const [routineOyQuery, setRoutineOyQuery] = useState<Record<number, string>>(
    {}
  )
  const [routineOyLoading, setRoutineOyLoading] = useState<
    Record<number, boolean>
  >({})
  // 비교 탭
  const [compareOyQuery, setCompareOyQuery] = useState<Record<string, string>>(
    {}
  )
  const [compareOyLoading, setCompareOyLoading] = useState<
    Record<string, boolean>
  >({})

  const handleOySearch = async () => {
    if (!oyQuery.trim() || oyLoading) return
    setOyLoading(true)
    setOyError("")
    setOySuccess("")
    try {
      const res = await fetch("/api/oliveyoung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: oyQuery.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        setOyError(data.error)
      } else if (data.ingredients) {
        setIngs(data.ingredients)
        setProductName(oyQuery.trim())
        setOySuccess(t("✅ 성분을 불러왔어요", "✅ Ingredients loaded"))
      } else {
        setOyError(data.message || "전성분을 찾지 못했어요.")
      }
    } catch {
      setOyError("올리브영 검색 중 오류가 발생했어요.")
    }
    setOyLoading(false)
  }

  const handleRoutineOySearch = async (productId: number) => {
    const query = routineOyQuery[productId]?.trim()
    if (!query || routineOyLoading[productId]) return
    setRoutineOyLoading((p) => ({ ...p, [productId]: true }))
    try {
      const res = await fetch("/api/oliveyoung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query }),
      })
      const data = await res.json()
      if (!data.error && data.ingredients) {
        setProducts((ps) =>
          ps.map((x) =>
            x.id === productId
              ? { ...x, ingredients: data.ingredients, name: x.name || query }
              : x
          )
        )
      } else {
        alert(data.error || data.message || "전성분을 찾지 못했어요.")
      }
    } catch {
      alert("올리브영 검색 중 오류가 발생했어요.")
    }
    setRoutineOyLoading((p) => ({ ...p, [productId]: false }))
  }

  const handleCompareOySearch = async (target: "A" | "B") => {
    const query = compareOyQuery[target]?.trim()
    if (!query || compareOyLoading[target]) return
    setCompareOyLoading((p) => ({ ...p, [target]: true }))
    try {
      const res = await fetch("/api/oliveyoung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query }),
      })
      const data = await res.json()
      if (!data.error && data.ingredients) {
        if (target === "A") {
          setCompareA(data.ingredients)
          if (!compareNameA) setCompareNameA(query)
        } else {
          setCompareB(data.ingredients)
          if (!compareNameB) setCompareNameB(query)
        }
      } else {
        alert(data.error || data.message || "전성분을 찾지 못했어요.")
      }
    } catch {
      alert("올리브영 검색 중 오류가 발생했어요.")
    }
    setCompareOyLoading((p) => ({ ...p, [target]: false }))
  }

  // 카메라 스캔 (OCR)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [routineOcrLoading, setRoutineOcrLoading] = useState<
    Record<number, boolean>
  >({})

  const t = (ko: string, en: string) => (lang === "ko" ? ko : en)
  const tl = (l: string, ko: string, en: string) => (l === "ko" ? ko : en)

  const saveResultState = (t: string, s: unknown, r: unknown, c: unknown) => {
    try {
      sessionStorage.setItem(
        "skindit_result",
        JSON.stringify({ tab: t, phase: "result", sRes: s, rRes: r, cRes: c })
      )
    } catch {
      /* */
    }
  }

  // 에러 시 입력 데이터 유지한 채 setup으로 돌아가기
  const retry = () => {
    setPhase("setup")
    setSRes(null)
    setRRes(null)
    setCRes(null)
  }

  const reset = () => {
    setPhase("setup")
    setSRes(null)
    setRRes(null)
    setCRes(null)
    setConcerns(profileConcerns.length > 0 ? [...profileConcerns] : [])
    setIngs("")
    setProductName("")
    setProducts([
      { id: 1, name: "", ingredients: "" },
      { id: 2, name: "", ingredients: "" },
    ])
    setCompareA("")
    setCompareB("")
    setCompareNameA("")
    setCompareNameB("")
    try {
      sessionStorage.removeItem("skindit_result")
    } catch {
      /* */
    }
  }

  // 트렌드 성분 AI 조회
  // 비교 분석 OCR 핸들러
  const [compareOcrLoading, setCompareOcrLoading] = useState<"A" | "B" | null>(
    null
  )
  const handleCompareOcr = async (target: "A" | "B", file: File) => {
    setCompareOcrLoading(target)
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const resized = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const max = 1500
          let { width, height } = img
          if (width > max || height > max) {
            const ratio = Math.min(max / width, max / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.src = dataUrl
      })
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resized, lang }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const corrected = correctOcrIngredients(data.text)
      if (target === "A") setCompareA(corrected)
      else setCompareB(corrected)
    } catch (err) {
      alert(err instanceof Error ? err.message : "OCR failed")
    }
    setCompareOcrLoading(null)
  }

  // 비교 분석 실행
  const runCompareAnalysis = async (
    useLang: string,
    textA: string,
    textB: string
  ) => {
    setPhase("loading")
    setStreamingPreview("")
    const sys = `skindit 성분 비교. 친근한 존댓말로만 답변.
말투: 모든 문장 반드시 "~요", "~에요", "~어요", "~거예요", "~세요" 종결어미로 끝맺기. 반말(~야, ~네, ~다, ~해, ~지, ~군, ~구나, ~거든) 절대 금지. 친한 언니가 부드럽게 조언하는 톤.
규칙: 입력 성분+제공된 데이터만 사용. 데이터에 없는 성분은 언급하지 않기. 제품 단위 꿀팁(아침/저녁, 순서, 시너지). 주의 콤보는 검증된 것만. 같은제형이면 하나만 추천.
가드레일: 답변의 모든 내용이 제공된 컨텍스트에 포함되어 있는지 자체 검증. 컨텍스트에 없으면 언급하지 않기. "금지"라는 단어 사용하지 말고 부드러운 표현 사용.
목적: 두 제품의 성분을 비교해서 "사용자의 피부 타입·고민 기준으로 어느 쪽이 더 맞는지" 판단해줘. 궁합(함께 쓰기)이 아니라 '비교·선택' 관점이야. "환상의 조합" 같은 궁합 언어 사용 금지.
JSON only. Schema:{"score_a":"0-100 정수. A 제품이 이 사용자 피부에 얼마나 맞는지","score_b":"0-100 정수. B 제품이 이 사용자 피부에 얼마나 맞는지","score_a_reason":"A 점수 근거 1줄 (사용자 피부 언급)","score_b_reason":"B 점수 근거 1줄 (사용자 피부 언급)","pick":"A|B|both|either","pick_reason":"왜 그 선택인지 1-2줄 (사용자 피부 타입·고민 근거)","summary":"성분 관점 비교 2-3줄","shared":[max 5,{"name":"","inA":true,"inB":true,"note":""}],"only_a":[max 5,{"name":"","inA":true,"inB":false,"note":""}],"only_b":[max 5,{"name":"","inA":false,"inB":true,"note":""}],"forbidden_combos":[max 2,{"ingredients":"","reason":""}],"recommendation":"2-3줄","usage_guide":{"best_time":"A:시간+이유, B:시간+이유","effect_timeline":"","beginner_tips":["3개"]},"verdict":"★(1-5)+근거 2줄"}. ${useLang === "ko" ? "한국어" : "English"}.`
    const skinContext =
      profileSkinTypes.length > 0
        ? `\n⚠️ 이 사용자의 피부 타입: ${profileSkinTypes.join(", ")} — 이 피부 타입에 더 맞는 제품을 추천해주세요!`
        : ""
    const noteContext = profileNote
      ? `\n⚠️ 사용자 메모 (꼭 반영): ${profileNote}`
      : ""
    const nameA = compareNameA || "A 제품"
    const nameB = compareNameB || "B 제품"
    try {
      const raw = await callAI(
        sys,
        `${nameA} 성분:\n${textA}\n\n${nameB} 성분:\n${textB}${skinContext}${noteContext}${getIngredientContext([...textA.split(","), ...textB.split(",")].map((s) => s.trim()).filter(Boolean))}\n\n※ A/B 대신 "${nameA}", "${nameB}" 이름으로 대답해주세요.`,
        (partial) => setStreamingPreview(partial)
      )
      sanitizeAnalysisResult(raw)
      setCRes(raw)
      saveResultState("compare", null, null, raw)
      // 분석 기록 저장
      setHistoryId(null)
      if (status === "authenticated") {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SINGLE",
            ingredients: `[비교] [${nameA}]: ${textA.substring(0, 80)}... / [${nameB}]: ${textB.substring(0, 80)}...`,
            concerns: [],
            score: 0,
            resultJson: {
              ...raw,
              type: "compare",
              compareNameA: nameA,
              compareNameB: nameB,
            },
            lang: useLang,
          }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.id) setHistoryId(d.id) })
          .catch(() => {})
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      const errRes = {
        error: true,
        errorMessage: msg,
        score_a: 0,
        score_b: 0,
        summary: "",
        shared: [],
        only_a: [],
        only_b: [],
        recommendation: "",
        verdict: "",
      }
      setCRes(errRes)
    }
    setPhase("result")
  }

  // 카메라 OCR 핸들러
  const handleOcr = async (file: File) => {
    setOcrLoading(true)
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      // 최대 1500px로 리사이즈
      const resized = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const max = 1500
          let { width, height } = img
          if (width > max || height > max) {
            const ratio = Math.min(max / width, max / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.src = dataUrl
      })
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resized, lang }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setIngs(correctOcrIngredients(data.text))
    } catch (err) {
      alert(err instanceof Error ? err.message : "OCR failed")
    }
    setOcrLoading(false)
  }

  // 루틴: 제품별 OCR 핸들러
  const handleRoutineOcr = async (productId: number, file: File) => {
    setRoutineOcrLoading((p) => ({ ...p, [productId]: true }))
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const resized = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const max = 1500
          let { width, height } = img
          if (width > max || height > max) {
            const ratio = Math.min(max / width, max / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.src = dataUrl
      })
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resized, lang }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProducts((ps) =>
        ps.map((x) =>
          x.id === productId
            ? { ...x, ingredients: correctOcrIngredients(data.text) }
            : x
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "OCR failed")
    }
    setRoutineOcrLoading((p) => ({ ...p, [productId]: false }))
  }

  const runSingleAnalysis = async (
    useLang: string,
    ingredientText: string,
    concernIds: string[]
  ) => {
    setPhase("loading")
    setStreamingPreview("")
    const cl = concernIds
      .map((id) => CONCERNS.find((c) => c.id === id))
      .map((c) => (c ? tl(useLang, c.ko, c.en) : ""))
      .join(", ")
    const sys = `skindit 성분 분석. 친근한 존댓말로만 답변.
말투: 모든 문장 반드시 "~요", "~에요", "~어요", "~거예요", "~세요" 종결어미로 끝맺기. 반말(~야, ~네, ~다, ~해, ~지, ~군, ~구나, ~거든) 절대 금지. 친한 언니가 부드럽게 조언하는 톤.
규칙: 입력 성분+제공된 데이터만 사용. 데이터에 없는 성분은 언급하지 않기. 추측/지어내기 하지 않기. 주의 콤보는 검증된 것만. "분리 사용 권장"처럼 부드러운 표현 사용. "금지"라는 단어 대신 "피하는 게 좋아요", "권장하지 않아요" 등으로. concern_analysis에 선택한 고민 전부 포함.
출처: [검증된 성분 데이터]가 제공되면 해당 데이터 기반임을 표시. 예: "식약처 등록 성분이에요", "검증된 데이터 기준으로..."
가드레일: 답변 전 자체 검증 — 모든 내용이 제공된 컨텍스트에 포함되어 있는지 확인. 컨텍스트에 없는 성분 효능/부작용은 언급하지 않기.
JSON only. Schema:{"overall_score":0-100,"overall_comment":"2-3줄","concern_analysis":[선택 고민 전부,{"concern":"","score":0-100,"comment":"2-3줄"}],"star_ingredients":[max 5,{"name":"","benefit":"","best_time":"","synergy":[],"source":"검증됨|일반"}],"watch_out":[{"name":"","reason":"","alternative":""}],"forbidden_combos":[max 3,{"ingredients":"","reason":""}],"usage_guide":{"best_time":"","effect_timeline":"","beginner_tips":["3개"]},"safety_ratings":[max 8,{"name":"","score":1-10,"note":""}],"verdict":"★(1-5)+근거 2줄"}.
safety_ratings 점수 기준 (엄격히 따를 것):
1=가장 안전(정제수,글리세린,히알루론산,판테놀,알란토인,토코페롤,스쿠알란,세라마이드,센텔라,아데노신,발효물/발효여과물/유산균발효물,펩타이드,병풀추출물,베타글루칸,알부틴,나이아신아마이드,트레할로오스,부틸렌글라이콜,프룩토올리고사카라이드,잔탄검,마데카소사이드,아시아티코사이드,글리세릴 류,소듐하이알루로네이트), 2=안전(대부분의 식물추출물,아미노산류,비타민류), 3=보통(에틸헥실글리세린,폴리머류,유화제류,1,2-헥산다이올), 4-5=약간 주의(향료,색소,고농도 에탄올,PEG류), 6-7=주의필요(특정 방부제,포름알데히드방출제), 8-10=위험(금지성분급만 해당).
확실하지 않은 성분은 2-3점으로. 안전한 성분을 높게 매기지 않기. ${useLang === "ko" ? "한국어" : "English"}.`
    const skinContext =
      profileSkinTypes.length > 0
        ? `\n⚠️ 이 사용자의 피부 타입: ${profileSkinTypes.join(", ")} — 이 피부 타입 기준으로 분석해주세요! 예: 민감성이면 자극 성분 더 엄격하게, 지성이면 유분 많은 성분 주의`
        : ""
    const noteContext = profileNote
      ? `\n⚠️ 사용자 메모 (꼭 반영): ${profileNote}`
      : ""
    try {
      const raw = await callAI(
        sys,
        `Concerns:${cl || "none"}${skinContext}${noteContext}\nIngredients:\n${ingredientText}${getIngredientContext(
          ingredientText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )}`,
        (partial) => setStreamingPreview(partial)
      )
      sanitizeAnalysisResult(raw)
      setSRes(raw)
      saveResultState("single", raw, null, null)
      // 로그인 시 히스토리 저장
      setHistoryId(null)
      if (status === "authenticated") {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SINGLE",
            ingredients: productName
              ? `[${productName}] ${ingredientText}`
              : ingredientText,
            concerns: concernIds,
            score: raw.overall_score || 0,
            resultJson: { ...raw, productName: productName || undefined },
            lang: useLang,
          }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.id) setHistoryId(d.id) })
          .catch(() => {})
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setSRes({
        error: true,
        errorMessage: msg,
        overall_score: 0,
        overall_comment: "",
      })
    }
    setPhase("result")
  }

  const runRoutineAnalysis = async (useLang: string, prods: Product[]) => {
    setPhase("loading")
    setStreamingPreview("")
    const filled = prods.filter((p) => p.ingredients.trim())
    const list = filled
      .map((p, i) => `[${p.name || `Product${i + 1}`}]: ${p.ingredients}`)
      .join("\n\n")
    const sys = `skindit 루틴 분석. 친근한 존댓말로만 답변.
말투: 모든 문장 반드시 "~요", "~에요", "~어요", "~거예요", "~세요" 종결어미로 끝맺기. 반말(~야, ~네, ~다, ~해, ~지, ~군, ~구나, ~거든) 절대 금지. 친한 언니가 부드럽게 조언하는 톤.
규칙: 입력 성분+제공된 데이터만 사용. 데이터에 없는 성분은 언급하지 않기. 같은제형 겹침=점수↓(40~60), 다른제형=OK(70~85), 상호보완=80~90. 주의 콤보는 검증된 것만. "분리 사용 권장"처럼 부드러운 표현 사용. "금지"라는 단어 대신 "피하는 게 좋아요", "권장하지 않아요" 등으로.
가드레일: 답변의 모든 내용이 제공된 컨텍스트에 포함되어 있는지 자체 검증. 컨텍스트에 없으면 언급하지 않기.
JSON only. Schema:{"routine_score":0-100,"routine_comment":"2-3줄","conflicts":[max 3,{"ingredients":[""],"products":[""],"severity":"high|medium|low","reason":""}],"synergies":[max 3,{"ingredients":[""],"products":[""],"reason":""}],"order_suggestion":["순서"],"recommendations":[max 3,"팁"],"timeline":[{"product":"","timing":"morning|evening|both","reason":""}],"usage_guide":{"effect_timeline":"","beginner_tips":["2-3개"]},"verdict":"★(1-5)+근거 2줄"}. ${useLang === "ko" ? "한국어" : "English"}.`
    const skinContext =
      profileSkinTypes.length > 0
        ? `\n⚠️ 이 사용자의 피부 타입: ${profileSkinTypes.join(", ")} — 이 피부 타입 기준으로 분석!`
        : ""
    const noteContext = profileNote
      ? `\n⚠️ 사용자 메모 (꼭 반영): ${profileNote}`
      : ""
    try {
      const raw = await callAI(
        sys,
        `${filled.length} product routine:${skinContext}${noteContext}\n\n${list}${getIngredientContext(
          filled.flatMap((p) =>
            p.ingredients
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        )}`,
        (partial) => setStreamingPreview(partial)
      )
      sanitizeAnalysisResult(raw)
      if (raw.routine_score && (raw.routine_score as number) <= 10)
        raw.routine_score = (raw.routine_score as number) * 10
      setRRes(raw)
      saveResultState("routine", null, raw, null)
      // 로그인 시 히스토리 저장
      setHistoryId(null)
      if (status === "authenticated") {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ROUTINE",
            ingredients: list,
            concerns: [],
            score: raw.routine_score || 0,
            resultJson: raw,
            lang: useLang,
          }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.id) setHistoryId(d.id) })
          .catch(() => {})
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setRRes({
        error: true,
        errorMessage: msg,
        routine_score: 0,
        routine_comment: "",
      })
    }
    setPhase("result")
  }

  // 로그인 리다이렉트 전 분석 대기 데이터를 sessionStorage에 저장
  const savePending = (type: string) => {
    if (typeof window === "undefined") return
    const data =
      type === "single"
        ? { type: "single", ings, concerns, lang }
        : { type: "routine", products, lang }
    sessionStorage.setItem("skindit_pending", JSON.stringify(data))
  }

  // 로그인 후 대기 중인 분석 복원 및 실행
  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined") return
    const raw = sessionStorage.getItem("skindit_pending")
    if (!raw) return
    sessionStorage.removeItem("skindit_pending")
    try {
      const data = JSON.parse(raw)
      if (data.type === "single" && data.ings) {
        setIngs(data.ings)
        setConcerns(data.concerns || [])
        setTab("single")
        setLastIngs(data.ings)
        setLastConcerns(data.concerns || [])
        runSingleAnalysis(data.lang || "ko", data.ings, data.concerns || [])
      } else if (data.type === "routine" && data.products) {
        setProducts(data.products)
        setTab("routine")
        setLastProducts(data.products)
        runRoutineAnalysis(data.lang || "ko", data.products)
      }
    } catch {
      /* ignore */
    }
  }, [status])

  // 로그인 시 저장된 피부 프로필 불러오기
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.concerns?.length > 0) {
          setProfileConcerns(data.concerns)
          if (concerns.length === 0) setConcerns(data.concerns)
        }
        if (data?.skinTypes?.length > 0) setProfileSkinTypes(data.skinTypes)
        if (data?.note) setProfileNote(data.note)
      })
      .catch(() => {})
  }, [status])

  const analyzeSingle = () => {
    if (status === "unauthenticated") {
      savePending("single")
      signIn(undefined, {
        callbackUrl: `${window.location.pathname}?tab=single`,
      })
      return
    }
    setLastIngs(ings)
    setLastConcerns([...concerns])
    runSingleAnalysis(lang, ings, concerns)
  }

  const analyzeRoutine = () => {
    if (status === "unauthenticated") {
      savePending("routine")
      signIn(undefined, {
        callbackUrl: `${window.location.pathname}?tab=routine`,
      })
      return
    }
    setLastProducts([...products])
    runRoutineAnalysis(lang, products)
  }

  const analyzeCompare = () => {
    if (status === "unauthenticated") {
      signIn(undefined, {
        callbackUrl: `${window.location.pathname}?tab=compare`,
      })
      return
    }
    runCompareAnalysis(lang, compareA, compareB)
  }

  // 언어 전환: 결과 페이지에서 재분석
  const switchLang = (newLang: string) => {
    setLang(newLang)
    try {
      localStorage.setItem("skindit_lang", newLang)
    } catch {
      /* */
    }
    if (phase === "result") {
      if (tab === "single" && sRes && !sRes.error) {
        runSingleAnalysis(newLang, lastIngs, lastConcerns)
      } else if (tab === "routine" && rRes && !rRes.error) {
        runRoutineAnalysis(newLang, lastProducts)
      } else if (tab === "compare" && cRes && !cRes.error) {
        runCompareAnalysis(newLang, compareA, compareB)
      }
    }
  }

  const canS = ings.trim().length > 10
  const canR = products.filter((p) => p.ingredients.trim()).length >= 2
  const canC = compareA.trim().length > 10 && compareB.trim().length > 10

  const STEP_COLORS = [
    "from-pastel-lime-dark/10 to-lime-50/40",
    "from-pastel-peach/60 to-orange-50/40",
    "from-pastel-mint/60 to-teal-50/40",
    "from-pastel-sky/60 to-blue-50/40",
    "from-pastel-lemon/60 to-yellow-50/40",
  ]
  const STEP_BORDERS = [
    "border-lime-100",
    "border-orange-100",
    "border-teal-100",
    "border-blue-100",
    "border-yellow-100",
  ]

  return (
    <div className="relative mx-auto min-h-screen max-w-160 overflow-hidden bg-white shadow-xl">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-2xl">
        <button
          onClick={reset}
          className="flex items-center gap-3 border-none bg-transparent p-0"
        >
          {/* 로고 마크 — 돋보기 + 피부 세포 */}
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-pastel-lime-dark shadow-md">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="relative"
            >
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="white"
                strokeWidth="2"
              />
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
            <span className="font-accent from-pastel-lime-dark to-pastel-gold bg-linear-to-r bg-clip-text text-[17px] font-semibold text-transparent italic">
              dit
            </span>
          </div>
        </button>
        <button
          onClick={() => switchLang(lang === "ko" ? "en" : "ko")}
          className="hover:bg-pastel-lime-dark/10 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-400 transition-all hover:border-lime-200 hover:text-lime-700"
        >
          {lang === "ko" ? "EN" : "KO"}
        </button>
      </nav>

      {/* ── HERO ── */}
      {phase === "setup" && <HomeHero t={t} lang={lang} />}

      {/* ── MAIN ── */}
      <main className="px-6 pt-10 pb-32">
        {/* ── TRENDING INGREDIENTS ── */}
        {phase === "setup" && <TrendingIngredients t={t} lang={lang} />}

        {/* Tabs */}
        {phase === "setup" && (
          <div
            id="analysis-tabs"
            className="mb-8 flex gap-1 rounded-2xl bg-gray-100/80 p-1"
          >
            {[
              {
                id: "single",
                ko: "단일 제품",
                en: "Single Product",
                icon: "💊",
              },
              {
                id: "routine",
                ko: "루틴 궁합",
                en: "Routine Check",
                icon: "🧴",
              },
              { id: "compare", ko: "성분 비교", en: "Compare", icon: "⚖️" },
            ].map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  tab === tb.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="mr-1.5">{tb.icon}</span>
                {t(tb.ko, tb.en)}
              </button>
            ))}
          </div>
        )}

        {/* ── SINGLE SETUP ── */}
        {phase === "setup" && tab === "single" && (
          <div className="anim-fade-up">
            <div className="mt-12 mb-12">
              <div className="mb-3 flex gap-2.5">
                <span className="mt-0.5 text-base">🫧</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("피부 고민", "Skin Concerns")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("해당하는 거 다 골라주세요~", "Select all that apply")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CONCERNS.map((c) => {
                  const sel = concerns.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() =>
                        setConcerns((p) =>
                          p.includes(c.id)
                            ? p.filter((x) => x !== c.id)
                            : [...p, c.id]
                        )
                      }
                      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                        sel
                          ? c.color + " font-semibold shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="mr-1">{c.icon}</span>
                      {t(c.ko, c.en)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── 🛒 올리브영 제품 검색 ── */}
            <div className="mb-8">
              <div className="mb-3 flex gap-2.5">
                <span className="mt-0.5 text-base">🛒</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("제품명으로 검색", "Search by Product Name")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t(
                      "올리브영에 등록된 제품만 검색 가능해요. 브랜드명 + 제품명을 함께 입력하면 더 정확해요!",
                      "Only products on Olive Young are searchable. Enter brand + product name for best results!"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={oyQuery}
                  onChange={(e) => setOyQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleOySearch()
                  }}
                  placeholder={t(
                    "제품 이름으로 검색",
                    "Search by product name"
                  )}
                  disabled={oyLoading}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white focus:ring-2 focus:ring-pastel-lime-dark/20 disabled:opacity-50"
                />
                <button
                  onClick={handleOySearch}
                  disabled={!oyQuery.trim() || oyLoading}
                  className="shrink-0 rounded-xl bg-pastel-lime-dark px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#8ab922] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {oyLoading ? (
                    <span
                      className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    t("검색", "Search")
                  )}
                </button>
              </div>
              {oyError && (
                <p className="mt-2 text-xs text-rose-500">{oyError}</p>
              )}
              {oySuccess && (
                <div className="mt-3 rounded-xl border border-pastel-lime-dark/30 bg-pastel-lime-dark/10 px-4 py-3">
                  <p className="text-xs font-bold text-[#6b9a0a]">
                    {oySuccess}
                  </p>
                  <p className="mt-1 text-[11px] text-[#7dab18]">
                    {t(
                      "전성분을 가져왔어요!",
                      "Ingredients loaded!"
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-gray-200" />
              <span className="text-xs font-semibold text-gray-400">
                {t("또는 직접 등록", "or add manually")}
              </span>
              <div className="h-px flex-1 bg-linear-to-l from-transparent via-gray-200 to-gray-200" />
            </div>

            {/* ── 제품 이름 (선택) ── */}
            <div className="mb-8">
              <div className="mb-2 flex gap-2.5">
                <span className="mt-0.5 text-base">🏷</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("제품 이름", "Product Name")}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      {t("(선택)", "(optional)")}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {t(
                      "기록에서 어떤 제품인지 구분하기 쉬워요~",
                      "Makes it easy to identify in history"
                    )}
                  </p>
                </div>
              </div>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t(
                  "예) 에스트라 아토배리어365 크림",
                  "e.g. Aestura Atobarrier 365 Cream"
                )}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white focus:ring-2 focus:ring-pastel-lime-dark/20"
              />
            </div>

            {/* ── 📷 성분표 스캔 (메인) ── */}
            <div className="mb-8">
              {ocrLoading ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-lime-200 bg-linear-to-br from-lime-50 to-lime-50 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <span
                      className="inline-block h-6 w-6 rounded-full border-3 border-pastel-lime-dark/30 border-t-pastel-lime-dark"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("성분 읽는 중...", "Reading ingredients...")}
                  </p>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-pastel-lime-dark/20 bg-linear-to-br from-pastel-lime-dark/8 via-pastel-gold/5 to-pastel-olive/3 p-6 transition-all hover:border-pastel-lime-dark/40 hover:shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-lime-dark/15 text-2xl">
                    📷
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {t("성분표 사진 등록", "Add Ingredient Photo")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {t(
                        "사진 찍거나 갤러리에서 골라주세요",
                        "Take a photo or choose from gallery"
                      )}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleOcr(f)
                      e.target.value = ""
                    }}
                  />
                </label>
              )}
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-gray-200" />
              <span className="text-xs font-semibold text-gray-400">
                {t("또는 직접 입력", "or paste manually")}
              </span>
              <div className="h-px flex-1 bg-linear-to-l from-transparent via-gray-200 to-gray-200" />
            </div>

            {/* ── 전성분 직접 입력 ── */}
            <div className="mb-8">
              <div className="mb-3 flex gap-2.5">
                <span className="mt-0.5 text-base">📋</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("전성분 붙여넣기", "Paste Ingredients")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t(
                      "올리브영이나 제품 상세페이지에서 복사해서 붙여넣어주세요~",
                      "Copy from Hwahae app or product detail page and paste here"
                    )}
                  </p>
                </div>
              </div>
              <textarea
                value={ings}
                onChange={(e) => setIngs(e.target.value)}
                placeholder={t(
                  "예) 정제수, 글리세린, 나이아신아마이드...",
                  "e.g. Water, Glycerin, Niacinamide..."
                )}
                rows={6}
                className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm leading-relaxed text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white focus:ring-2 focus:ring-pastel-lime-dark/20"
              />
              <button
                onClick={() =>
                  setIngs(lang === "ko" ? SAMPLE_S_KO : SAMPLE_S_EN)
                }
                className="mt-2 border-none bg-transparent p-0 text-xs font-medium text-gray-400 underline underline-offset-2 transition-colors hover:text-pastel-lime-dark"
              >
                {t("샘플로 한번 해볼래? →", "Try with sample →")}
              </button>
            </div>

            <button
              onClick={analyzeSingle}
              disabled={!canS}
              className="w-full rounded-2xl bg-pastel-lime-dark py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {t("분석해볼까요?", "Analyze Ingredients")}
            </button>
          </div>
        )}

        {/* ── ROUTINE SETUP ── */}
        {phase === "setup" && tab === "routine" && (
          <div className="anim-fade-up">
            <div className="mt-12 mb-12">
              <div className="mb-6 flex gap-2.5">
                <span className="mt-0.5 text-base">🧴</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("루틴 제품 입력", "Your Routine")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t(
                      "같이 쓰는 제품 2개 이상 넣어주세요!",
                      "Enter 2+ products you use together"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {products.map((p, i) => (
                  <div
                    key={p.id}
                    className={`bg-linear-to-br ${STEP_COLORS[i % STEP_COLORS.length]} border ${STEP_BORDERS[i % STEP_BORDERS.length]} anim-fade-up rounded-2xl p-4 shadow-sm`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/60 text-[10px] font-extrabold text-gray-500">
                          {i + 1}
                        </span>
                        <span className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">
                          Step {i + 1}
                        </span>
                      </div>
                      {products.length > 2 && (
                        <button
                          onClick={() =>
                            setProducts((ps) => ps.filter((x) => x.id !== p.id))
                          }
                          className="border-none bg-transparent px-1 text-lg leading-none text-gray-400 transition-colors hover:text-rose-500"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {/* ── 🛒 올리브영 검색 ── */}
                    <div className="mb-2 flex gap-1.5">
                      <input
                        value={routineOyQuery[p.id] || ""}
                        onChange={(e) =>
                          setRoutineOyQuery((q) => ({
                            ...q,
                            [p.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRoutineOySearch(p.id)
                        }}
                        placeholder={t(
                          "🛒 제품명 검색",
                          "🛒 Search product"
                        )}
                        disabled={routineOyLoading[p.id]}
                        className="flex-1 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white disabled:opacity-50"
                      />
                      <button
                        onClick={() => handleRoutineOySearch(p.id)}
                        disabled={
                          !routineOyQuery[p.id]?.trim() ||
                          routineOyLoading[p.id]
                        }
                        className="shrink-0 rounded-xl bg-pastel-lime-dark px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-[#8ab922] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {routineOyLoading[p.id] ? (
                          <span
                            className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white"
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          t("검색", "Search")
                        )}
                      </button>
                    </div>

                    {/* ── 제품 이름 ── */}
                    <input
                      value={p.name}
                      onChange={(e) =>
                        setProducts((ps) =>
                          ps.map((x) =>
                            x.id === p.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      placeholder={t(
                        "제품 이름 (선택)",
                        "Product name (optional)"
                      )}
                      className="mb-2 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
                    />

                    {/* ── 성분 입력: 카메라 촬영 / 사진 선택 ── */}
                    <label className="hover:bg-pastel-lime-dark/10 mb-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-lime-100 bg-white/60 px-3 py-2.5 text-[11px] font-semibold text-pastel-lime-dark transition-all hover:border-lime-200">
                      {routineOcrLoading[p.id] ? (
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border-2 border-pastel-lime-dark/30 border-t-pastel-lime-dark"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        <>
                          <span className="text-xs">📷</span>
                          {t("성분표 사진 등록", "Add Ingredient Photo")}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleRoutineOcr(p.id, f)
                          e.target.value = ""
                        }}
                      />
                    </label>

                    {/* ── 전성분 직접 입력 ── */}
                    <textarea
                      value={p.ingredients}
                      onChange={(e) =>
                        setProducts((ps) =>
                          ps.map((x) =>
                            x.id === p.id
                              ? { ...x, ingredients: e.target.value }
                              : x
                          )
                        )
                      }
                      placeholder={t(
                        "여기에 자동으로 채워지거나, 직접 붙여넣어주세요!",
                        "Ingredients auto-fill here, or paste manually"
                      )}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs leading-relaxed transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() =>
                    setProducts((p) => [
                      ...p,
                      { id: Date.now(), name: "", ingredients: "" },
                    ])
                  }
                  className="hover:bg-pastel-lime-dark/10 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-500 transition-all hover:border-lime-200 hover:text-lime-700"
                >
                  + {t("제품 추가", "Add product")}
                </button>
                <button
                  onClick={() => setProducts(SAMPLE_R)}
                  className="border-none bg-transparent p-0 text-xs font-medium text-gray-400 underline underline-offset-2 transition-colors hover:text-pastel-lime-dark"
                >
                  {t("샘플로 해볼래? →", "Try sample →")}
                </button>
              </div>
            </div>
            <button
              onClick={analyzeRoutine}
              disabled={!canR}
              className="w-full rounded-2xl bg-pastel-lime-dark py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {t("궁합 체크해볼까요?", "Check Compatibility")}
            </button>
          </div>
        )}

        {/* ── COMPARE SETUP ── */}
        {phase === "setup" && tab === "compare" && (
          <div className="anim-fade-up">
            <div className="mt-12 mb-12">
              <div className="mb-6 flex gap-2.5">
                <span className="mt-0.5 text-base">⚖️</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {t("두 제품 성분 비교", "Compare Two Products")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t(
                      "두 제품 전성분 넣으면 뭐가 다른지 알려줄게요!",
                      "Paste ingredients of two products to see the differences"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "A" as const,
                    value: compareA,
                    set: setCompareA,
                    name: compareNameA,
                    setName: setCompareNameA,
                    gradient: "from-pastel-lime-dark/10 to-lime-50/40",
                    border: "border-lime-100",
                  },
                  {
                    label: "B" as const,
                    value: compareB,
                    set: setCompareB,
                    name: compareNameB,
                    setName: setCompareNameB,
                    gradient: "from-pastel-peach/60 to-orange-50/40",
                    border: "border-orange-100",
                  },
                ].map((p) => (
                  <div
                    key={p.label}
                    className={`bg-linear-to-br ${p.gradient} border ${p.border} rounded-2xl p-4 shadow-sm`}
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/60 text-[10px] font-extrabold text-gray-500">
                          {p.label}
                        </span>
                        <span className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">
                          {t(`제품 ${p.label}`, `Product ${p.label}`)}
                        </span>
                      </div>
                    </div>
                    {/* ── 🛒 올리브영 검색 ── */}
                    <div className="mb-2 flex gap-1.5">
                      <input
                        value={compareOyQuery[p.label] || ""}
                        onChange={(e) =>
                          setCompareOyQuery((q) => ({
                            ...q,
                            [p.label]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCompareOySearch(p.label)
                        }}
                        placeholder={t(
                          "🛒 제품명 검색",
                          "🛒 Search product"
                        )}
                        disabled={compareOyLoading[p.label]}
                        className="flex-1 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white disabled:opacity-50"
                      />
                      <button
                        onClick={() => handleCompareOySearch(p.label)}
                        disabled={
                          !compareOyQuery[p.label]?.trim() ||
                          compareOyLoading[p.label]
                        }
                        className="shrink-0 rounded-xl bg-pastel-lime-dark px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-[#8ab922] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {compareOyLoading[p.label] ? (
                          <span
                            className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white"
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          t("검색", "Search")
                        )}
                      </button>
                    </div>

                    {/* ── 제품 이름 ── */}
                    <input
                      value={p.name}
                      onChange={(e) => p.setName(e.target.value)}
                      placeholder={t(
                        "제품 이름 (선택)",
                        "Product name (optional)"
                      )}
                      className="mb-2 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
                    />
                    {/* ── 성분 입력: 카메라 촬영 / 사진 선택 ── */}
                    <label className="hover:bg-pastel-lime-dark/10 mb-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-lime-100 bg-white/60 px-3 py-2.5 text-[11px] font-semibold text-pastel-lime-dark transition-all hover:border-lime-200">
                      {compareOcrLoading === p.label ? (
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border-2 border-pastel-lime-dark/30 border-t-pastel-lime-dark"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        <>
                          <span className="text-xs">📷</span>
                          {t("성분표 사진 등록", "Add Ingredient Photo")}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleCompareOcr(p.label, f)
                          e.target.value = ""
                        }}
                      />
                    </label>
                    {/* ── 전성분 직접 입력 ── */}
                    <textarea
                      value={p.value}
                      onChange={(e) => p.set(e.target.value)}
                      placeholder={t(
                        "여기에 자동으로 채워지거나, 직접 붙여넣어주세요",
                        "Ingredients auto-fill here, or paste manually"
                      )}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs leading-relaxed transition-all outline-none placeholder:text-gray-400 focus:border-pastel-lime-dark/50 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={analyzeCompare}
              disabled={!canC}
              className="w-full rounded-2xl bg-pastel-lime-dark py-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {t("비교하기", "Compare Ingredients")}
            </button>
          </div>
        )}

        {/* trending moved above tabs */}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <LoadingPhase t={t} streamingPreview={streamingPreview} />
        )}

        {/* ── SINGLE RESULT ── */}
        {phase === "result" &&
          tab === "single" &&
          sRes &&
          (sRes.error ? (
            <ErrState t={t} reset={retry} message={sRes.errorMessage} />
          ) : (
            <SingleResult res={sRes} t={t} reset={reset} lang={lang} historyId={historyId} productName={productName} />
          ))}

        {/* ── ROUTINE RESULT ── */}
        {phase === "result" &&
          tab === "routine" &&
          rRes &&
          (rRes.error ? (
            <ErrState t={t} reset={retry} message={rRes.errorMessage} />
          ) : (
            <RoutineResult rRes={rRes} t={t} reset={reset} lang={lang} historyId={historyId} productNames={products.filter(p => p.ingredients.trim()).map(p => p.name).filter(Boolean)} />
          ))}
        {/* ── COMPARE RESULT ── */}
        {phase === "result" &&
          tab === "compare" &&
          cRes &&
          (cRes.error ? (
            <ErrState t={t} reset={retry} message={cRes.errorMessage} />
          ) : (
            <CompareResult cRes={cRes} t={t} reset={reset} lang={lang} historyId={historyId} nameA={compareNameA} nameB={compareNameB} />
          ))}
      </main>

      {/* ── PWA Install Banner ── */}
      {showPwaBanner && phase === "setup" && (
        <PwaBanner
          t={t}
          deferredPrompt={deferredPrompt}
          onInstall={handlePwaInstall}
          onDismiss={dismissPwa}
        />
      )}

      {/* ── Footer ── */}
      {phase === "setup" && <HomeFooter t={t} />}
    </div>
  )
}
