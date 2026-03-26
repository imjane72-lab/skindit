"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

/* ── Constants ── */
const CONDITIONS = [
  { id: "good" as const, emoji: "😊", ko: "좋음", bg: "bg-emerald-50", ring: "ring-emerald-300", border: "border-emerald-200", text: "text-emerald-700" },
  { id: "normal" as const, emoji: "😐", ko: "보통", bg: "bg-amber-50", ring: "ring-amber-300", border: "border-amber-200", text: "text-amber-700" },
  { id: "bad" as const, emoji: "😣", ko: "나쁨", bg: "bg-rose-50", ring: "ring-rose-300", border: "border-rose-200", text: "text-rose-700" },
];

const TROUBLES = [
  { id: "redness", ko: "홍조", icon: "🔴" },
  { id: "dryness", ko: "건조", icon: "🏜" },
  { id: "acne", ko: "트러블", icon: "💥" },
  { id: "itching", ko: "가려움", icon: "🩸" },
  { id: "flaking", ko: "각질", icon: "🌿" },
  { id: "tightness", ko: "당김", icon: "🧴" },
  { id: "oiliness", ko: "번들거림", icon: "💧" },
];

const QUICK_FOODS = [
  { label: "매운 음식 🌶", value: "매운 음식" },
  { label: "유제품 🥛", value: "유제품" },
  { label: "술 🍺", value: "술" },
  { label: "단 음식 🍰", value: "단 음식" },
  { label: "기름진 음식 🍟", value: "기름진 음식" },
  { label: "물 많이 💧", value: "물 많이" },
  { label: "과일/채소 🥗", value: "과일/채소" },
];

/* ── Types ── */
interface AnalyzedProduct {
  name: string;
  ingredients: string;
  watchOut: string[];
  starIngredients: string[];
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* ── NavBar ── */
function NavBar() {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-2xl">
      <button onClick={() => router.push("/diary")} className="flex items-center gap-3 border-none bg-transparent p-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
        <span className="font-display text-sm font-bold text-gray-700">돌아가기</span>
      </button>
      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Write</span>
    </nav>
  );
}

/* ── Write Page ── */
export default function DiaryWritePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-3 border-purple-200 border-t-purple-500 animate-spin" /></div>}>
      <DiaryWritePage />
    </Suspense>
  );
}

function DiaryWritePage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [date, setDate] = useState(() => {
    const paramDate = searchParams.get("date");
    if (paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)) return paramDate;
    return todayStr();
  });
  const [condition, setCondition] = useState<"good" | "normal" | "bad" | "">("");
  const [products, setProducts] = useState<string[]>([]);
  const [productInput, setProductInput] = useState("");
  const [troubles, setTroubles] = useState<string[]>([]);
  const [foods, setFoods] = useState<string[]>([]);
  const [foodInput, setFoodInput] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Language
  const [lang, setLang] = useState("ko")
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko") }, [])
  const t = (ko: string, en: string) => lang === "ko" ? ko : en

  // 분석 기록 연동
  const [analyzedProducts, setAnalyzedProducts] = useState<AnalyzedProduct[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [allAnalyzedNames, setAllAnalyzedNames] = useState<string[]>([]);
  const [linkedIngredients, setLinkedIngredients] = useState<Record<string, AnalyzedProduct>>({});
  // 최근 사용 제품
  const [recentProducts, setRecentProducts] = useState<string[]>([]);

  const productInputRef = useRef<HTMLInputElement>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  // 분석 기록에서 제품명 목록 가져오기
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/history?limit=50")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data) return;
        const items: AnalyzedProduct[] = [];
        const names: string[] = [];
        for (const h of data.data) {
          const rj = h.resultJson as Record<string, unknown> | null;
          if (!rj || rj.type === "compare") continue;
          const name = (rj.productName as string) || "";
          if (!name) continue;
          const watchOut = ((rj.watch_out as Array<{ name: string; reason?: string }>) || []).map(w => w.name);
          const starIngredients = ((rj.star_ingredients as Array<{ name: string }>) || []).map(s => s.name);
          const ingredients = (h.ingredients || "").replace(/^\[.*?\]\s*/, "").substring(0, 300);
          if (!names.includes(name)) {
            names.push(name);
            items.push({ name, ingredients, watchOut, starIngredients });
          }
        }
        setAnalyzedProducts(items);
        setAllAnalyzedNames(names);
      })
      .catch(() => {});

    // 다이어리에서 최근 사용 제품 가져오기
    fetch("/api/diary?limit=20")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data) return;
        const productSet = new Set<string>();
        for (const entry of data.data) {
          const prods = Array.isArray(entry.products) ? (entry.products as string[]) : [];
          prods.forEach((p: string) => productSet.add(p));
        }
        setRecentProducts([...productSet].slice(0, 10));
      })
      .catch(() => {});
  }, [status]);

  // 제품명 입력 시 자동완성 제안
  useEffect(() => {
    const q = productInput.trim().toLowerCase();
    if (q.length < 1) {
      setProductSuggestions([]);
      return;
    }
    const matches = allAnalyzedNames
      .filter(n => n.toLowerCase().includes(q) && !products.includes(n))
      .slice(0, 5);
    setProductSuggestions(matches);
  }, [productInput, allAnalyzedNames, products]);

  /* ── Handlers ── */
  const addProduct = useCallback((name?: string) => {
    const v = (name || productInput).trim();
    if (!v || products.includes(v)) return;
    setProducts(prev => [...prev, v]);
    setProductInput("");
    setProductSuggestions([]);

    // 분석 기록 매칭
    const match = analyzedProducts.find(ap =>
      ap.name.toLowerCase() === v.toLowerCase() ||
      ap.name.toLowerCase().includes(v.toLowerCase()) ||
      v.toLowerCase().includes(ap.name.toLowerCase())
    );
    if (match) {
      setLinkedIngredients(prev => ({ ...prev, [v]: match }));
    }

    productInputRef.current?.focus();
  }, [productInput, products, analyzedProducts]);

  const removeProduct = (p: string) => {
    setProducts(products.filter(x => x !== p));
    setLinkedIngredients(prev => {
      const next = { ...prev };
      delete next[p];
      return next;
    });
  };

  const toggleTrouble = (id: string) =>
    setTroubles(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const addFood = () => {
    const v = foodInput.trim();
    if (v && !foods.includes(v)) setFoods([...foods, v]);
    setFoodInput("");
    foodInputRef.current?.focus();
  };

  const removeFood = (f: string) => setFoods(foods.filter(x => x !== f));

  const toggleQuickFood = (value: string) => {
    if (foods.includes(value)) {
      setFoods(foods.filter(x => x !== value));
    } else {
      setFoods([...foods, value]);
    }
  };

  const generateTip = async (entryId: string, cond: string, prods: string[], trbs: string[], memo: string) => {
    try {
      const troubleNames = trbs.map(id => TROUBLES.find(t => t.id === id)?.ko || id).join(", ");
      const condKo = cond === "good" ? "좋음" : cond === "normal" ? "보통" : "나쁨";

      // 성분 연동 정보 추가
      let ingredientInfo = "";
      const linked = Object.entries(linkedIngredients);
      if (linked.length > 0) {
        ingredientInfo = "\n\n[성분 분석 연동 데이터]";
        for (const [name, data] of linked) {
          ingredientInfo += `\n- ${name}: 주의성분=[${data.watchOut.join(",")}], 좋은성분=[${data.starIngredients.join(",")}]`;
        }
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `너는 skindit — 피부 성분 전문가 언니야. 반존대 써줘.

규칙:
- 1~2문장, 최대 100자
- 성분 데이터가 있으면 반드시 활용해서 구체적으로 조언 (예: "변성알코올 들어있는 제품 썼네~ 민감할 때는 빼봐!")
- 성분 데이터 없으면 일반 조언
- 공감 + 실천 팁
- 반존대 (~해, ~봐, ~야)
- 텍스트만, 따옴표 없이`,
          user: `피부 상태: ${condKo}\n사용 제품: ${prods.join(", ") || "없음"}\n트러블: ${troubleNames || "없음"}\n메모: ${memo || "없음"}${ingredientInfo}`,
        }),
      });
      const data = await res.json();
      const tip = data.content?.[0]?.text?.trim();
      if (tip) {
        fetch(`/api/diary/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: memo ? `${memo}\n\n💜 skindit tip: ${tip}` : `💜 skindit tip: ${tip}` }),
        }).catch(() => {});
      }
    } catch { /* silent */ }
  };

  const handleSave = async () => {
    if (!condition) return;
    setSaving(true);
    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, condition, products, troubles, note, foods }),
      });
      if (res.ok) {
        const saved = await res.json();
        generateTip(saved.id, condition, products, troubles, note);
        router.push("/diary");
      } else {
        alert("저장 실패 ㅠ 다시 해봐!");
      }
    } catch {
      alert("저장 실패 ㅠ 다시 해봐!");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-160 bg-white shadow-xl">
          <NavBar />
          <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 rounded-full border-3 border-purple-200 border-t-purple-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const hasLinked = Object.keys(linkedIngredients).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-160 bg-white shadow-xl">
        <NavBar />

        <div className="px-6 py-8 pb-24">
          {/* Header */}
          <div className="mb-6 anim-fade-up">
            <h1 className="font-display mb-1 text-2xl font-extrabold text-gray-900">
              {t("피부 기록하기", "Log Skin")}
            </h1>
            <p className="text-sm text-gray-400">{t("오늘 피부 어때?", "How's your skin today?")}</p>
          </div>

          {/* 성분 연동 안내 배너 */}
          <div className="mb-6 rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50/60 to-pink-50/40 p-4 anim-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">🧬</span>
              <div>
                <p className="text-xs font-bold text-purple-700 mb-1">{t("성분 분석한 제품은 자동 연동돼!", "Analyzed products auto-link!")}</p>
                <p className="text-[11px] leading-relaxed text-gray-500">
                  {t("제품명 입력하면 분석 기록에서 성분을 자동으로 끌고 와~ 그래서 트러블 나면 어떤 성분 때문인지 리포트에서 딱 찾아줘!", "Enter a product name and ingredients auto-load from your analysis history~ So when trouble hits, the report finds the cause!")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-100/50 bg-white p-5 space-y-6 shadow-sm anim-scale-in">

            {/* Date */}
            <div>
              <label className="font-display text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                날짜 <span className="font-normal normal-case tracking-normal text-gray-300">Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayStr()}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="font-display text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                피부 상태 <span className="font-normal normal-case tracking-normal text-gray-300">Condition</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CONDITIONS.map((c) => {
                  const active = condition === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCondition(c.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-4 transition-all ${
                        active
                          ? `${c.bg} ${c.border} ${c.ring} ring-2 scale-105 shadow-md`
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <span className="text-3xl">{c.emoji}</span>
                      <span className={`text-xs font-bold ${active ? c.text : "text-gray-400"}`}>{c.ko}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products */}
            <div>
              <label className="font-display text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                사용 제품 <span className="font-normal normal-case tracking-normal text-gray-300">Products</span>
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    ref={productInputRef}
                    type="text"
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addProduct(); }
                    }}
                    placeholder={t("제품명 입력 (분석한 제품은 자동 연동!)", "Product name (analyzed products auto-link!)")}

                    className="flex-1 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                  />
                  <button
                    onClick={() => addProduct()}
                    className="shrink-0 rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-600 border border-purple-100 hover:bg-purple-100 transition-all"
                  >
                    추가
                  </button>
                </div>

                {/* 자동완성 드롭다운 */}
                {productSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-purple-200 bg-white shadow-lg overflow-hidden anim-fade-up">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-purple-400 bg-purple-50/50">🧬 분석 기록에서 찾았어!</p>
                    {productSuggestions.map(name => (
                      <button
                        key={name}
                        onClick={() => addProduct(name)}
                        className="flex w-full items-center gap-2 border-none bg-transparent px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 transition-all"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 text-[10px] font-bold text-purple-600">✓</span>
                        <span className="font-medium">{name}</span>
                        <span className="ml-auto text-[10px] text-purple-400">성분 연동</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 최근 사용 제품 빠른 선택 */}
              {recentProducts.filter(p => !products.includes(p)).length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-gray-400 mb-1.5">최근에 쓴 제품</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentProducts.filter(p => !products.includes(p)).map(p => {
                      const isAnalyzed = allAnalyzedNames.some(n => n.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(n.toLowerCase()));
                      return (
                        <button
                          key={p}
                          onClick={() => addProduct(p)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                            isAnalyzed
                              ? "border-purple-200 bg-purple-50/50 text-purple-600 hover:bg-purple-100"
                              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {isAnalyzed && <span className="text-[9px]">🧬</span>}
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 추가된 제품 목록 */}
              {products.length > 0 && (
                <div className="mt-3 space-y-2">
                  {products.map((p) => {
                    const linked = linkedIngredients[p];
                    return (
                      <div key={p} className={`rounded-xl border p-3 anim-pop-in ${linked ? "border-purple-200 bg-purple-50/30" : "border-gray-100 bg-gray-50/50"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {linked && <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 text-[9px] font-bold text-purple-600">🧬</span>}
                            <span className="text-xs font-bold text-gray-700">{p}</span>
                            {linked && <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-500">성분 연동됨</span>}
                          </div>
                          <button onClick={() => removeProduct(p)} className="border-none bg-transparent text-gray-300 hover:text-rose-500 transition-colors text-sm">✕</button>
                        </div>
                        {linked && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {linked.watchOut.slice(0, 3).map((w, i) => (
                              <span key={i} className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-medium text-rose-500">⚠️ {w}</span>
                            ))}
                            {linked.starIngredients.slice(0, 3).map((s, i) => (
                              <span key={i} className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-medium text-emerald-500">✨ {s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Troubles */}
            <div>
              <label className="font-display text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                피부 고민 <span className="font-normal normal-case tracking-normal text-gray-300">Troubles</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TROUBLES.map((t) => {
                  const active = troubles.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTrouble(t.id)}
                      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                        active
                          ? "border-rose-200 bg-rose-50 text-rose-600 font-semibold shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <span className="mr-1">{t.icon}</span> {t.ko}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Foods */}
            <div>
              <label className="font-display text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                🍽 오늘 특별히 먹은 거 <span className="font-normal normal-case tracking-normal text-gray-300">Food</span>
              </label>
              <div className="flex gap-2">
                <input
                  ref={foodInputRef}
                  type="text"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addFood(); }
                  }}
                  placeholder="피부에 영향 줄 수 있는 음식 적어봐~"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                />
                <button
                  onClick={addFood}
                  className="shrink-0 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all"
                >
                  추가
                </button>
              </div>
              {/* Quick food chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {QUICK_FOODS.map((f) => {
                  const active = foods.includes(f.value);
                  return (
                    <button
                      key={f.value}
                      onClick={() => toggleQuickFood(f.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "border-orange-200 bg-orange-50 text-orange-600 font-semibold shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              {foods.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {foods.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 anim-pop-in">
                      🍽 {f}
                      <button
                        onClick={() => removeFood(f)}
                        className="border-none bg-transparent text-orange-300 hover:text-orange-600 transition-colors ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="font-display text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                메모 <span className="font-normal normal-case tracking-normal text-gray-300">Note</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="오늘 피부 상태에 대해 자유롭게 적어봐~"
                rows={3}
                className="w-full rounded-xl p-4 text-sm text-gray-700 placeholder:text-gray-300 resize-none border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
              />
            </div>
          </div>

          {/* 성분 연동 요약 */}
          {hasLinked && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 anim-fade-up">
              <p className="text-[11px] font-bold text-emerald-600 mb-1">🧬 성분 연동 완료!</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {Object.keys(linkedIngredients).join(", ")}의 성분 데이터가 연동됐어~ 저장하면 skindit tip에 성분 기반 조언이 나오고, 리포트에서도 트러블 원인 추적에 활용돼!
              </p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!condition || saving}
            className="mt-6 w-full rounded-2xl from-pastel-lavender-dark via-purple-400 to-pastel-rose-dark bg-linear-to-r py-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-30"
          >
            {saving ? t("저장하는 중...", "Saving...") : t("기록 저장하기", "Save Entry")}
          </button>
        </div>
      </div>
    </div>
  );
}
