"use client";

import { useRouter } from "next/navigation";
import SearchButton from "@/components/ui/SearchButton";

const REPORTS = [
  { key: "summary", label: "Business Summary Report", desc: "Daily/weekly/monthly overview with full transaction detail", icon: "📊" },
  { key: "farmer", label: "Farmer-wise Report", desc: "Purchases and payments per farmer", icon: "🌾" },
  { key: "buyer", label: "Buyer-wise Report", desc: "Sales and payments per buyer", icon: "🛒" },
  { key: "expense", label: "Expense Report", desc: "All expenses by type and date", icon: "🧾" },
  { key: "payments", label: "Payment Report", desc: "Farmer and buyer payments", icon: "💰" },
  { key: "rejection", label: "Rejection Report", desc: "Rejected quantities and status", icon: "⚠️" },
  { key: "resale", label: "Resale Report", desc: "Resold rejected tomatoes", icon: "♻️" },
  { key: "cashbook", label: "Cashbook Report", desc: "Daily cash in / out summary", icon: "📒" },
];

export default function ReportsHubPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="back-btn text-[14px] font-medium mb-5 inline-flex items-center gap-1"
          style={{ color: "var(--color-accent)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <span className="back-arrow">←</span> Back to dashboard
        </button>

        <div
          className="flex items-center justify-between mb-6"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both" }}
        >
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>
            Reports
          </h1>
          <SearchButton />
        </div>

        <button
          onClick={() => router.push("/dashboard/notes")}
          className="report-card w-full mb-5 rounded-2xl p-4 text-left flex items-center gap-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
          }}
        >
          <span className="text-[18px]">🗒️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
              Notes & Remarks Log
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              All notes across farmers, buyers, loads, expenses & rejections
            </p>
          </div>
          <span className="report-arrow" style={{ color: "var(--color-accent)" }}>→</span>
        </button>

        <div className="space-y-2.5">
          {REPORTS.map((r, i) => (
            <button
              key={r.key}
              onClick={() => router.push(`/dashboard/reports/${r.key}`)}
              className="report-card w-full text-left rounded-2xl p-4 flex items-center gap-3"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                animation: `fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${0.12 + i * 0.04}s both`,
              }}
            >
              <span className="text-[18px]">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
                  {r.label}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {r.desc}
                </p>
              </div>
              <span className="report-arrow" style={{ color: "var(--color-accent)" }}>→</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .back-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out; }
        .back-btn:active { transform: scale(0.96); opacity: 0.7; }
        .back-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (hover: hover) { .back-btn:hover .back-arrow { transform: translateX(-3px); } }
        .report-card {
          box-shadow: 0 1px 2px rgba(45, 42, 38, 0.04);
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
        }
        .report-card:active { transform: scale(0.98); }
        .report-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .report-card:active .report-arrow { transform: translateX(5px); }
        @media (hover: hover) {
          .report-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45, 42, 38, 0.08); border-color: var(--color-accent); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001s !important;
            animation-delay: 0s !important;
            transition-duration: 0.001s !important;
          }
          .report-card:hover, .back-btn:hover .back-arrow { transform: none !important; }
        }
      `}</style>
    </div>
  );
}