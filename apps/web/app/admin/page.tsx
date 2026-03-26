"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/* ── Types ── */
interface RecentUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  provider: string;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  totalDiary: number;
  totalChats: number;
  recentUsers: RecentUser[];
}

/* ── NavBar ── */
function NavBar() {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/80 h-14 px-6 flex items-center justify-between">
      <button onClick={() => router.push("/")} className="flex items-center gap-3 bg-transparent border-none p-0">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pastel-lavender-dark via-purple-400 to-pastel-rose-dark flex items-center justify-center shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative">
            <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
            <circle cx="9.5" cy="9.5" r="1.5" fill="rgba(179,157,219,0.7)" />
            <circle cx="13" cy="11" r="1" fill="rgba(244,143,177,0.6)" />
            <circle cx="10.5" cy="13" r="0.8" fill="rgba(179,157,219,0.5)" />
          </svg>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold text-gray-900 tracking-tight">skin</span>
          <span className="font-[family-name:var(--font-accent)] text-[17px] font-semibold italic text-transparent bg-clip-text bg-gradient-to-r from-pastel-lavender-dark to-pastel-rose-dark">dit</span>
        </div>
      </button>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin</span>
    </nav>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pastel-lavender to-pastel-rose flex items-center justify-center text-xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-[family-name:var(--font-display)] font-extrabold text-gray-900">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ── Provider Badge ── */
function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    google: "bg-blue-50 text-blue-600 border-blue-100",
    kakao: "bg-yellow-50 text-yellow-700 border-yellow-200",
    unknown: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[provider] || colors.unknown}`}>
      {provider}
    </span>
  );
}

/* ── Main Page ── */
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session?.user as any)?.role;

  // Redirect if not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (status === "authenticated" && userRole !== "admin") {
      router.push("/");
    }
  }, [status, userRole, router]);

  // Fetch stats
  useEffect(() => {
    if (status !== "authenticated" || userRole !== "admin") return;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          setError("접근 권한이 없습니다.");
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch {
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, userRole]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-pastel-lavender/20 to-pastel-rose/20">
        <NavBar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || userRole !== "admin") return null;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[640px] mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden">
          <NavBar />
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[640px] mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden">
        <NavBar />

        <div className="px-6 py-8 pb-24">
          {/* Header */}
          <div className="mb-8 anim-fade-up">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-gray-900 mb-1">
              관리자 대시보드
            </h1>
            <p className="text-sm text-gray-400">Admin Dashboard</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <>
              <section className="mb-8 anim-fade-up" style={{ animationDelay: "0.05s" }}>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold text-gray-600 uppercase tracking-widest mb-4">
                  서비스 현황 <span className="text-gray-300 font-normal normal-case tracking-normal">Overview</span>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="전체 사용자" value={stats.totalUsers} icon="👥" />
                  <StatCard label="분석 횟수" value={stats.totalAnalyses} icon="🔬" />
                  <StatCard label="피부 일기" value={stats.totalDiary} icon="📔" />
                  <StatCard label="채팅 메시지" value={stats.totalChats} icon="💬" />
                </div>
              </section>

              {/* Recent Users */}
              <section className="anim-fade-up" style={{ animationDelay: "0.1s" }}>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold text-gray-600 uppercase tracking-widest mb-4">
                  최근 가입 사용자 <span className="text-gray-300 font-normal normal-case tracking-normal">Recent Users</span>
                </h2>
                <div className="space-y-2">
                  {stats.recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="glass-card rounded-2xl p-4 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pastel-lavender to-pastel-rose flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {(user.name || user.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {user.name || "이름 없음"}
                          </p>
                          <ProviderBadge provider={user.provider} />
                          {user.role === "admin" && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-purple-50 text-purple-600 border-purple-200">
                              admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{user.email || "-"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
