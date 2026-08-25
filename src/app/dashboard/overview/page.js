"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { fetchOverviewData } from "@/lib/overviewData";
import { unitLabel } from "@/lib/units";
import CountUp from "@/components/ui/CountUp";
import SearchButton from "@/components/ui/SearchButton";
import DateFilter from "@/components/ui/DateFilter";
import { haptic } from "@/lib/haptics";

const PIE_COLORS = ["#C1440E", "#3F7D4F", "#C48A1E", "#6B6459", "#A63A0C", "#8FA98A"];

export default function OverviewPage() {
  const router = useRouter();

  const [period, setPeriod] = useState("today");
  const [customRange, setCustomRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [activeSlice, setActiveSlice] = useState(null);
  const [activeDay, setActiveDay] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const result = await fetchOverviewData(period, customRange);
      setData(result);

      setLoading(false);
      setRefreshing(false);
    },
    [period, customRange]
  );

  const handleRangeChange = ({ from, to, preset }) => {
    setPeriod(preset);
    setCustomRange(preset === "custom" ? { from, to } : null);
  };

  const handleRefresh = () => {
    haptic("success");
    load(true);
  };

  useEffect(() => {
    load();
  }, [load]);

  const periodLabel = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    custom: "Custom Range",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <div
          className="flex items-center justify-between mb-5"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="back-btn text-[14px] font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <SearchButton />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="refresh-btn flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full"
              style={{
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <RefreshIcon spinning={refreshing} />
              Refresh
            </button>
          </div>
        </div>

        <h1
          className="text-[24px] font-semibold mb-5 tracking-tight"
          style={{ color: "var(--color-text)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both" }}
        >
          Overview
        </h1>

        <div className="mb-6" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}>
          <DateFilter onRangeChange={handleRangeChange} defaultPreset="today" />
        </div>

        {loading || !data ? (
          <SkeletonLoader />
        ) : (
          <div>
            {/* Hero profit/loss card */}
            <div
              className="hero-card rounded-[24px] p-5 mb-3 relative overflow-hidden"
              style={{
                backgroundColor: data.profit > 0 ? "var(--color-success)" : "var(--color-danger)",
                animation: "floatIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
            >
              <p className="text-[12px] font-medium mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                {data.profit > 0 ? "Net Profit" : "Net Loss"} · {periodLabel[period]}
              </p>
              <p className="text-[32px] font-bold text-white tracking-tight">
                <CountUp value={data.profit || data.loss} prefix="₹" />
              </p>
              <p className="text-[12px] mt-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Sales ₹{(data.totalSalesAmount + data.totalResaleAmount).toFixed(0)} − Cost ₹
                {(data.totalPurchaseAmount + data.totalExpenses).toFixed(0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              <StatCard label="Purchase Amount" value={data.totalPurchaseAmount} delay={0.05} />
              <StatCard label="Sales Amount" value={data.totalSalesAmount} delay={0.08} />
              <StatCard label="Transportation" value={data.transportationExpenses} delay={0.11} />
              <StatCard label="Labour" value={data.labourExpenses} delay={0.14} />
            </div>

            <SectionLabel>Pending · All-time</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5 mb-7">
              <StatCard label="Farmer Pending" value={data.farmerPending} accent={data.farmerPending > 0} delay={0.05} />
              <StatCard label="Buyer Pending" value={data.buyerPending} accent={data.buyerPending > 0} delay={0.08} />
            </div>

            <SectionLabel>Purchase vs Sales · {periodLabel[period]}</SectionLabel>
            <ChartCard>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[
                    { name: "Purchase", value: data.totalPurchaseAmount },
                    { name: "Sales", value: data.totalSalesAmount },
                  ]}
                  barCategoryGap="35%"
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [`₹${v.toFixed(2)}`, ""]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 13 }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={64} animationDuration={700} animationEasing="ease-out">
                    <Cell fill="var(--color-text-muted)" opacity={0.5} />
                    <Cell fill="var(--color-accent)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <SectionLabel>Expense Breakdown · {periodLabel[period]}</SectionLabel>
            <ChartCard>
              {data.expenseBreakdown.length === 0 ? (
                <EmptyState text="No expenses recorded in this period." />
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.expenseBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        animationDuration={700}
                        animationEasing="ease-out"
                        onMouseEnter={(_, i) => setActiveSlice(i)}
                        onMouseLeave={() => setActiveSlice(null)}
                        onClick={(_, i) => setActiveSlice(activeSlice === i ? null : i)}
                      >
                        {data.expenseBreakdown.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                            opacity={activeSlice === null || activeSlice === i ? 1 : 0.35}
                            style={{ cursor: "pointer", transition: "opacity 0.2s ease-out" }}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {data.expenseBreakdown.map((e, i) => (
                      <button
                        key={e.name}
                        onClick={() => setActiveSlice(activeSlice === i ? null : i)}
                        className="legend-row w-full flex items-center justify-between text-left"
                        style={{ opacity: activeSlice === null || activeSlice === i ? 1 : 0.4 }}
                      >
                        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--color-text)" }}>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          {e.name}
                        </span>
                        <span className="text-[12px] font-semibold" style={{ color: "var(--color-text)" }}>
                          ₹{e.value.toFixed(0)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>

            <SectionLabel>Profit Trend · Last 7 Days</SectionLabel>
            <ChartCard>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={data.profitTrend}
                  onMouseMove={(state) => {
                    if (state?.activeTooltipIndex !== undefined) setActiveDay(state.activeTooltipIndex);
                  }}
                  onMouseLeave={() => setActiveDay(null)}
                >
                  <defs>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [`₹${v.toFixed(2)}`, "Profit"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 13 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--color-accent)"
                    strokeWidth={2.5}
                    fill="url(#profitFill)"
                    dot={{ r: 3, fill: "var(--color-accent)" }}
                    activeDot={{ r: 5 }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
              {activeDay !== null && data.profitTrend[activeDay] && (
                <div className="flex justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {data.profitTrend[activeDay].day} · Purchase ₹{data.profitTrend[activeDay].purchase.toFixed(0)} · Sales ₹
                    {data.profitTrend[activeDay].sales.toFixed(0)}
                  </span>
                </div>
              )}
            </ChartCard>

            <SectionLabel>Rejection Analysis · {periodLabel[period]}</SectionLabel>
            <ChartCard>
              {data.rejectionAnalysis.trend.length === 0 ? (
                <EmptyState text="No rejections recorded in this period." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data.rejectionAnalysis.trend} barCategoryGap="35%">
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(v, name) => [`${v} ${unitLabel(name)}`, `Rejected (${unitLabel(name)})`]}
                        contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 13 }}
                      />
                      {data.rejectionAnalysis.units.map((unit, i) => (
                        <Bar
                          key={unit}
                          dataKey={unit}
                          name={unit}
                          radius={[10, 10, 0, 0]}
                          maxBarSize={40}
                          fill={i === 0 ? "var(--color-danger)" : "var(--color-accent)"}
                          animationDuration={700}
                          animationEasing="ease-out"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>

                  {data.rejectionAnalysis.units.map((unit) => (
                    <div key={unit}>
                      {data.rejectionAnalysis.units.length > 1 && (
                        <p
                          className="text-[11px] font-semibold uppercase tracking-wide mt-4 mb-2"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {unitLabel(unit)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                        <ResponsiveContainer width="45%" height={140}>
                          <PieChart>
                            <Pie
                              data={data.rejectionAnalysis.statusBreakdownByUnit[unit]}
                              dataKey="quantity"
                              nameKey="status"
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={2}
                              animationDuration={700}
                              animationEasing="ease-out"
                            >
                              {data.rejectionAnalysis.statusBreakdownByUnit[unit].map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v) => [`${v} ${unitLabel(unit)}`, ""]}
                              contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 13 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                          {data.rejectionAnalysis.statusBreakdownByUnit[unit].map((s, i) => (
                            <div key={s.status} className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--color-text)" }}>
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                />
                                {s.status}
                              </span>
                              <span className="text-[12px] font-semibold" style={{ color: "var(--color-text)" }}>
                                {s.quantity} {unitLabel(unit)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                      Total Rejected Value
                    </span>
                    <span className="text-[12px] font-semibold" style={{ color: "var(--color-danger)" }}>
                      ₹{data.rejectionAnalysis.totalRejectedValue.toFixed(0)}
                    </span>
                  </div>
                </>
              )}
            </ChartCard>

            <SectionLabel>Pending Payment · All-time</SectionLabel>
            <ChartCard>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={[
                    { name: "Farmer Pending", value: data.pendingPayment.farmerPending },
                    { name: "Buyer Pending", value: data.pendingPayment.buyerPending },
                  ]}
                  barCategoryGap="35%"
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [`₹${v.toFixed(2)}`, ""]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 13 }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={64} animationDuration={700} animationEasing="ease-out">
                    <Cell fill="var(--color-danger)" />
                    <Cell fill="var(--color-success)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p className="text-[12px] font-semibold uppercase tracking-wide mt-5 mb-2" style={{ color: "var(--color-text-muted)" }}>
                Trend · Last 7 Days
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data.pendingPayment.trend}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v, name) => [`₹${v.toFixed(2)}`, name === "farmerPending" ? "Farmer Pending" : "Buyer Pending"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 13 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="farmerPending"
                    stroke="var(--color-danger)"
                    strokeWidth={2}
                    fill="none"
                    dot={{ r: 2.5, fill: "var(--color-danger)" }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="buyerPending"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    fill="none"
                    dot={{ r: 2.5, fill: "var(--color-success)" }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-danger)" }} />
                  Farmer Pending
                </span>
                <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-success)" }} />
                  Buyer Pending
                </span>
              </div>
            </ChartCard>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(12px);
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
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .skeleton-block {
          background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .back-btn,
        .refresh-btn {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out;
        }
        .back-btn:active,
        .refresh-btn:active {
          transform: scale(0.95);
          opacity: 0.7;
        }

        .hero-card,
        .stat-card,
        .chart-card {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.2s ease-out;
        }
        .stat-card {
          box-shadow: 0 1px 2px rgba(45, 42, 38, 0.04);
        }
        .chart-card {
          box-shadow: 0 1px 3px rgba(45, 42, 38, 0.05);
        }
        .legend-row {
          transition: opacity 0.2s ease-out, transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .legend-row:active {
          transform: scale(0.97);
        }

        @media (hover: hover) {
          .stat-card:hover,
          .chart-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(45, 42, 38, 0.08);
          }
          .hero-card:hover {
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
          .stat-card:hover,
          .chart-card:hover,
          .hero-card:hover {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, accent, delay = 0 }) {
  return (
    <div
      className="stat-card rounded-2xl p-3.5"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        animation: `fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
      }}
    >
      <p className="text-[11px] mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      <p className="text-[17px] font-semibold" style={{ color: accent ? "var(--color-danger)" : "var(--color-text)" }}>
        <CountUp value={value} prefix="₹" />
      </p>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="text-[13px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
      {children}
    </h2>
  );
}

function ChartCard({ children }) {
  return (
    <div
      className="chart-card rounded-2xl p-4 mb-7"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="text-[13px] text-center py-14" style={{ color: "var(--color-text-muted)" }}>
      {text}
    </p>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ animation: spinning ? "spin 0.8s linear infinite" : "none" }}
    >
      <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-3">
      <div className="skeleton-block rounded-[24px]" style={{ height: 110 }} />
      <div className="grid grid-cols-2 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-block rounded-2xl" style={{ height: 70 }} />
        ))}
      </div>
      <div className="skeleton-block rounded-2xl" style={{ height: 200 }} />
      <div className="skeleton-block rounded-2xl" style={{ height: 200 }} />
    </div>
  );
}