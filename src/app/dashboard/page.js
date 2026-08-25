"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TomatoMark from "@/components/ui/TomatoMark";
import { fetchOverviewData } from "@/lib/overviewData";
import CountUp from "@/components/ui/CountUp";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { haptic } from "@/lib/haptics";

const NAV_ITEMS = [
  { key: "approvals", label: "Staff Approvals", route: "/dashboard/approvals", adminOnly: true, icon: "shield" },
  { key: "overview", label: "Overview & Reports", route: "/dashboard/overview", icon: "chart" },
  { key: "farmers", label: "Farmers", route: "/dashboard/farmers", icon: "farmer" },
  { key: "buyers", label: "Buyers", route: "/dashboard/buyers", icon: "buyer" },
  { key: "loads", label: "Loads", route: "/dashboard/loads", icon: "truck" },
  { key: "expenses", label: "Expenses", route: "/dashboard/expenses", icon: "receipt" },
  { key: "cashbook", label: "Cashbook", route: "/dashboard/cashbook", icon: "cash" },
  { key: "reports", label: "Reports", route: "/dashboard/reports", icon: "document" },
  { key: "notes", label: "Notes & Remarks", route: "/dashboard/notes", icon: "note" },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setProfile(data);
    };

    load();

    const loadSummary = async () => {
      const result = await fetchOverviewData("today");
      setTodaySummary(result);
    };
    loadSummary();
  }, []);

  const handleLogout = async () => {
    haptic("warning");
    await supabase.auth.signOut();
    router.push("/login");
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || profile?.role === "admin");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div
          className="flex items-center justify-between mb-6"
          style={{ animation: "fadeSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <div className="flex items-center gap-3">
            <TomatoMark size={40} />
            <div>
              {profile ? (
                <>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--color-text-muted)", animation: "fadeIn 0.5s ease-out both" }}
                  >
                    {greeting()}
                  </p>
                  <p
                    className="text-[15px] font-semibold"
                    style={{ color: "var(--color-text)", animation: "fadeIn 0.5s ease-out 0.08s both" }}
                  >
                    {profile.full_name}
                  </p>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="skeleton-block" style={{ width: 70, height: 10, borderRadius: 5 }} />
                  <div className="skeleton-block" style={{ width: 110, height: 14, borderRadius: 6 }} />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="logout-btn text-[13px] font-medium px-3.5 py-2 rounded-xl"
            style={{
              color: "var(--color-accent)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            Log out
          </button>
        </div>

        {/* Today's Summary */}
        <SummaryCard todaySummary={todaySummary} onClick={() => router.push("/dashboard/overview")} delay={0.05} />

        {/* Navigation */}
        <div className="space-y-2.5 mb-5">
          {profile === null
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-block w-full rounded-2xl"
                  style={{ height: 56, animationDelay: `${i * 0.05}s` }}
                />
              ))
            : visibleItems.map((item, i) => (
                <button
                  key={item.key}
                  onClick={() => router.push(item.route)}
                  className="nav-tile w-full rounded-2xl px-4 py-4 text-left flex items-center gap-3"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    animation: `fadeSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.05}s both`,
                  }}
                >
                  <NavIcon name={item.icon} />
                  <span className="text-[14px] font-medium flex-1" style={{ color: "var(--color-text)" }}>
                    {item.label}
                  </span>
                  <span className="nav-arrow" style={{ color: "var(--color-accent)" }}>
                    →
                  </span>
                </button>
              ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          from {
            background-position: -200% 0;
          }
          to {
            background-position: 200% 0;
          }
        }

        .skeleton-block {
          background: linear-gradient(
            90deg,
            var(--color-border) 25%,
            var(--color-surface) 50%,
            var(--color-border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .logout-btn {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out;
        }
        .logout-btn:active {
          transform: scale(0.95);
          opacity: 0.6;
        }

        .nav-tile {
          box-shadow: 0 1px 2px rgba(45, 42, 38, 0.04), 0 1px 1px rgba(45, 42, 38, 0.03);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease-out;
        }
        .nav-tile:active {
          transform: scale(0.98);
        }
        .nav-arrow {
          display: inline-block;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-tile:active .nav-arrow {
          transform: translateX(5px);
        }

        .summary-card {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .summary-card:active {
          transform: scale(0.98);
        }

        @media (hover: hover) {
          .nav-tile:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(45, 42, 38, 0.08), 0 2px 6px rgba(45, 42, 38, 0.04);
            border-color: var(--color-accent);
          }
          .summary-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.001s !important;
            animation-delay: 0s !important;
            transition-duration: 0.001s !important;
          }
          .nav-tile:hover,
          .summary-card:hover {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ todaySummary, onClick, delay = 0 }) {
  if (!todaySummary) {
    return <div className="skeleton-block w-full rounded-[24px] mb-5" style={{ height: 132 }} />;
  }

  const hasActivity =
    todaySummary.totalPurchaseAmount > 0 || todaySummary.totalSalesAmount > 0 || todaySummary.totalExpenses > 0;

  return (
    <button
      onClick={onClick}
      className="summary-card w-full rounded-[24px] p-5 mb-5 text-left relative overflow-hidden"
      style={{
        backgroundColor: todaySummary.profit > 0 ? "var(--color-success)" : "var(--color-danger)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        animation: `floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
      }}
    >
      <p className="text-[12px] font-medium mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>
        {todaySummary.profit > 0 ? "Net Profit" : "Net Loss"} · Today
      </p>

      {!hasActivity ? (
        <>
          <p className="text-[20px] font-semibold text-white tracking-tight mb-1">No transactions yet</p>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            Today's activity will show up here once you add a load, sale, or expense.
          </p>
        </>
      ) : (
        <>
          <p className="text-[28px] font-bold text-white tracking-tight mb-3">
            <CountUp value={todaySummary.profit || todaySummary.loss} prefix="₹" />
          </p>
          <div style={{ height: 50 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={todaySummary.profitTrend}>
                <defs>
                  <linearGradient id="homeProfitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#fff"
                  strokeWidth={2}
                  fill="url(#homeProfitFill)"
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            7-day trend · Tap for full overview
          </p>
        </>
      )}
    </button>
  );
}

function NavIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--color-accent)",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    shield: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />,
    chart: <path d="M4 20V10M12 20V4M20 20v-7" />,
    farmer: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M5 21v-2a7 7 0 0114 0v2" />
      </>
    ),
    buyer: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2" />
        <path d="M17 8h4M19 6v4" />
      </>
    ),
    truck: (
      <>
        <rect x="1" y="7" width="13" height="10" rx="1" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="6" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </>
    ),
    receipt: <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zM8 7h8M8 11h8M8 15h5" />,
    cash: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    document: <path d="M6 2h9l5 5v15H6V2zM14 2v6h6M8 12h8M8 16h5" />,
    note: <path d="M4 4h16v13l-4 4H4V4zM16 21v-4h4M8 9h8M8 13h5" />,
  };

  return (
    <svg {...common} style={{ flexShrink: 0 }}>
      {icons[name] || null}
    </svg>
  );
}