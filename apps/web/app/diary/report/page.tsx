"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import { SITE_URL } from "@/lib/constants";

/* ── 성분 연결 카드 (접기/펼치기) ── */
function IngredientLinkCard({ link }: { link: { product: string; watchOut: string[]; starIngredients: string[] } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 bg-transparent border-none p-3 text-left"
      >
        <span className="text-sm">🧴</span>
        <span className="flex-1 text-xs font-bold text-gray-700 truncate">{link.product}</span>
        <div className="flex items-center gap-1 shrink-0">
          {link.watchOut.length > 0 && (
            <span className="rounded-full bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold text-rose-500">⚠️ {link.watchOut.length}</span>
          )}
          {link.starIngredients.length > 0 && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500">✨ {link.starIngredients.length}</span>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`shrink-0 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-1.5">
          {link.watchOut.map((w: string, j: number) => (
            <div key={j} className="rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-1.5 text-[10px] text-rose-600 leading-relaxed">⚠️ {w}</div>
          ))}
          {link.starIngredients.map((s: string, j: number) => (
            <div key={j} className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 text-[10px] text-emerald-600">✨ {s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 리포트 페이지 ── */
export default function DiaryReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 언어 설정
  const [lang, setLang] = useState("ko");
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko"); }, []);
  const t = (ko: string, en: string) => lang === "ko" ? ko : en;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportCache, setReportCache] = useState<Record<string, any>>({});
  const [reportLoading, setReportLoading] = useState(false);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const reportData = reportCache[selectedMonth] || null;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  /* ── 일지 개수 먼저 조회 ── */
  const fetchEntryCount = useCallback(async () => {
    try {
      const res = await fetch("/api/diary?page=1&limit=1");
      if (res.ok) {
        const data = await res.json();
        const total = data.total ?? (Array.isArray(data) ? data.length : (data.data?.length ?? 0));
        setEntryCount(total);
      }
    } catch { /* silent */ }
    finally { setLoadingEntries(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchEntryCount();
  }, [status, fetchEntryCount]);

  /* ── 리포트 불러오기 ── */
  const fetchReport = useCallback(async () => {
    if (entryCount !== null && entryCount < 5) return;
    if (reportCache[selectedMonth]) return; // 이미 캐시됨
    setReportLoading(true);
    try {
      const res = await fetch(`/api/report?month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setReportCache(prev => ({ ...prev, [selectedMonth]: data }));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error?.message || "리포트 생성에 실패했습니다.");
      }
    } catch {
      alert("리포트 생성에 실패했어요. 다시 시도해 주세요!");
    } finally {
      setReportLoading(false);
    }
  }, [entryCount, selectedMonth, reportCache]);

  useEffect(() => {
    if (!loadingEntries && entryCount !== null && entryCount >= 5) {
      fetchReport();
    }
  }, [loadingEntries, entryCount, fetchReport, selectedMonth]);

  /* ── 로딩 상태 ── */
  if (status === "loading" || loadingEntries) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl">
          <NavBar title="Diary" />
          <div className="flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-3 border-[#9bce26]/30 border-t-[#9bce26] rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  /* ── 일지가 부족한 경우 ── */
  if (entryCount !== null && entryCount < 5) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl">
          <NavBar title="Diary" />
          <div className="px-6 py-8">
            <div className="mb-8 anim-fade-up">
              <h1 className="font-display text-2xl font-extrabold text-gray-900 mb-3">
                📑 피부 리포트
              </h1>
              <p className="text-sm text-gray-400">기록을 분석해서 피부 패턴을 알려드려요</p>
            </div>

            <div className="bg-white border-2 border-lime-100 rounded-2xl p-8 text-center shadow-sm anim-scale-in">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-sm font-bold text-gray-800 mb-1">리포트까지 {5 - entryCount}일 남았어요!</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-2">
                {entryCount === 0
                  ? "5일간 피부 상태를 기록하시면 스킨딧이 리포트를 만들어 드려요 🤎"
                  : `지금 ${entryCount}일 기록하셨어요~ ${5 - entryCount}일만 더 하시면 리포트를 받아보실 수 있어요!`}
              </p>
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-8 h-2 rounded-full ${i < entryCount ? "bg-[#9bce26]" : "bg-gray-200"}`} />
                ))}
              </div>
              <button
                onClick={() => router.push("/diary/write")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9bce26] shadow-md hover:shadow-lg transition-all"
              >
                기록하러 가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 리포트 로딩 중 ── */
  if (reportLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl">
          <NavBar title="Diary" />
          <div className="px-6 py-8">
            <div className="mb-8 anim-fade-up">
              <h1 className="font-display text-2xl font-extrabold text-gray-900 mb-3">
                📑 피부 리포트
              </h1>
              <p className="text-sm text-gray-400">기록을 분석해서 피부 패턴을 알려드려요</p>
            </div>

            <div className="rounded-2xl p-30 text-center anim-scale-in">
              <div className="flex items-center justify-center gap-3 mb-14">
                <div className="w-4 h-4 rounded-full" style={{ background: "#9bce26", animation: "bounce-dot 1.2s ease-in-out infinite" }} />
                <div className="w-4 h-4 rounded-full" style={{ background: "#E8B830", animation: "bounce-dot 1.2s ease-in-out 0.2s infinite" }} />
                <div className="w-4 h-4 rounded-full" style={{ background: "#8B6914", animation: "bounce-dot 1.2s ease-in-out 0.4s infinite" }} />
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">스킨딧이 피부를 분석하고 있어요</p>
              <p className="text-xs text-gray-400" style={{ animation: "pulse-text 1.6s ease infinite" }}>최근 기록을 바탕으로 리포트를 작성 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 리포트 데이터 렌더링 ── */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl">
        <NavBar title="Diary" />

        <div className="px-6 py-8 pb-24">
          <div className="mb-6 anim-fade-up">
            <h1 className="font-display text-2xl font-extrabold text-gray-900 mb-1">
              📑 피부 리포트
            </h1>
            <p className="text-sm text-gray-400">기록을 분석해서 피부 패턴을 알려드려요</p>
          </div>

          {/* 월 선택 */}
          <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar anim-fade-up" style={{ animationDelay: "0.05s" }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              const label = `${d.getMonth() + 1}월`;
              const isSelected = selectedMonth === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMonth(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-lime-100 text-lime-800 border border-lime-200"
                      : "bg-gray-50 text-gray-400 border border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {i === 0 ? "이번 달" : label}
                </button>
              );
            })}
          </div>

          {reportData ? (
            <div className="rounded-2xl overflow-hidden shadow-sm anim-scale-in">
              {/* Header — 은은한 파스텔 */}
              <div className="bg-linear-to-r from-[#9bce26] via-[#E8B830] to-[#8B6914] px-6 py-6 rounded-t-2xl">
                <h3 className="font-display text-white text-lg font-extrabold">
                  {session?.user?.name || ""}님의 피부 리포트 📑
                </h3>
                <p className="text-white/70 text-xs mt-1">{selectedMonth.replace("-", "년 ")}월 분석 결과</p>
              </div>

              <div className="bg-white p-5 space-y-5">
                {/* Summary */}
                <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
                  {reportData.summary}
                </div>

                {/* Stats Bar */}
                {reportData.stats && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500">피부 상태 통계</span>
                      <span className="text-[10px] text-gray-400">총 {reportData.stats.total}일</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                      {reportData.stats.good > 0 && (
                        <div
                          className="bg-emerald-400 transition-all duration-500"
                          style={{ width: `${(reportData.stats.good / reportData.stats.total) * 100}%` }}
                        />
                      )}
                      {reportData.stats.normal > 0 && (
                        <div
                          className="bg-amber-400 transition-all duration-500"
                          style={{ width: `${(reportData.stats.normal / reportData.stats.total) * 100}%` }}
                        />
                      )}
                      {reportData.stats.bad > 0 && (
                        <div
                          className="bg-rose-400 transition-all duration-500"
                          style={{ width: `${(reportData.stats.bad / reportData.stats.total) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-emerald-600 font-medium">😊 좋음 {reportData.stats.good}일</span>
                      <span className="text-[10px] text-amber-600 font-medium">😐 보통 {reportData.stats.normal}일</span>
                      <span className="text-[10px] text-rose-600 font-medium">😣 나쁨 {reportData.stats.bad}일</span>
                    </div>
                  </div>
                )}

                {/* Trouble Pattern */}
                {reportData.trouble_pattern && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>🔍</span> 트러블 원인 추적
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed bg-rose-50/50 rounded-xl p-3.5 border border-rose-100/50">
                      {reportData.trouble_pattern}
                    </p>
                  </div>
                )}

                {/* Good Pattern */}
                {reportData.good_pattern && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>✨</span> 좋았을 때 패턴
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/50">
                      {reportData.good_pattern}
                    </p>
                  </div>
                )}

                {/* Top Products */}
                {reportData.top_products && reportData.top_products.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>🧴</span> 자주 사용한 제품 TOP 3
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {reportData.top_products.map((p: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-pastel-lavender text-lime-800 border border-lime-100"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avoid Ingredients */}
                {reportData.avoid_ingredients && reportData.avoid_ingredients.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>⚠️</span> 피해야 할 성분
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {reportData.avoid_ingredients.map((item: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {reportData.recommendations && reportData.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>🤎</span> 맞춤 조언
                    </h4>
                    <div className="space-y-2">
                      {reportData.recommendations.map((rec: string, i: number) => (
                        <div
                          key={i}
                          className="flex gap-2.5 text-xs text-gray-600 leading-relaxed bg-lime-50/40 rounded-xl p-3 border border-lime-100/30"
                        >
                          <span className="text-[#9bce26] font-bold shrink-0">{i + 1}.</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 성분 연동 추적 */}
                {reportData.ingredient_links && reportData.ingredient_links.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>🧬</span> 성분 추적 결과
                    </h4>
                    <div className="space-y-2">
                      {reportData.ingredient_links.map((link: { product: string; watchOut: string[]; starIngredients: string[] }, i: number) => (
                        <IngredientLinkCard key={i} link={link} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 아직 분석 안 한 제품 안내 */}
                {reportData.unanalyzed_products && reportData.unanalyzed_products.length > 0 && (
                  <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3">
                    <p className="text-[11px] font-bold text-amber-600 mb-1">💡 이 제품들은 아직 성분 분석이 되지 않았어요!</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      {(reportData.unanalyzed_products as string[]).join(", ")} — 성분 분석을 하시면 다음 리포트에서 더 정확하게 원인을 추적해 드릴게요~
                    </p>
                    <a href="/" className="mt-2 inline-block text-[11px] font-bold text-lime-700 no-underline hover:underline">
                      성분 분석하러 가기 →
                    </a>
                  </div>
                )}

                {/* Share + Refresh */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const title = `skindit 피부 리포트`
                      const recs = (reportData?.recommendations || []).map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")
                      const text = `📑 ${title}\n\n${reportData?.summary || ""}\n\n🤎 맞춤 조언\n${recs}`.trim()
                      if (navigator.share) {
                        navigator.share({ title, text, url: SITE_URL }).catch(() => {})
                      } else {
                        navigator.clipboard.writeText(text)
                        alert("리포트가 복사되었어요!")
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-lime-700 bg-lime-50 border border-lime-200 hover:bg-lime-100 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                    </svg>
                    리포트 공유
                  </button>
                  <button
                    onClick={fetchReport}
                    disabled={reportLoading}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all"
                  >
                    다시 생성
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-10 text-center anim-scale-in">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-sm font-bold text-gray-700 mb-1">리포트를 불러오지 못했어요</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">다시 한번 시도해 주세요!</p>
              <button
                onClick={fetchReport}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9bce26] shadow-md hover:shadow-lg transition-all"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
