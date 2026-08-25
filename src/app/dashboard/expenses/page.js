"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SearchButton from "@/components/ui/SearchButton";
import DateFilter from "@/components/ui/DateFilter";

const EXPENSE_TYPES = ["All", "Transportation", "Labour", "Loading", "Unloading", "Diesel", "Other"];

const TYPE_ICONS = {
  Transportation: "🚚",
  Labour: "👷",
  Loading: "📦",
  Unloading: "📤",
  Diesel: "⛽",
  Other: "🧾",
};

export default function ExpensesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [expenses, setExpenses] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  const loadExpenses = async () => {
    setLoading(true);
    let query = supabase
      .from("expenses")
      .select("*, loads(load_number)")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (typeFilter !== "All") {
      query = query.eq("expense_type", typeFilter);
    }

    if (dateRange?.from && dateRange?.to) {
      query = query.gte("expense_date", dateRange.from).lte("expense_date", dateRange.to);
    }

    const { data } = await query;
    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, [typeFilter, dateRange]);

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

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
          className="flex items-center justify-between mb-5"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both" }}
        >
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>
            Expenses
          </h1>
          <div className="flex items-center gap-2">
            <SearchButton />
            <button
              onClick={() => router.push("/dashboard/expenses/new")}
              className="add-btn text-white text-[14px] font-medium px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              + Add
            </button>
          </div>
        </div>

        <div className="mb-3" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}>
          <DateFilter onRangeChange={(r) => setDateRange({ from: r.from, to: r.to })} defaultPreset="month" />
        </div>

        <div className="mb-5 -mx-4 px-4 overflow-x-auto" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both" }}>
          <div className="flex gap-2 w-max">
            {EXPENSE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className="type-chip text-[13px] font-medium px-3.5 py-2 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: typeFilter === type ? "var(--color-accent)" : "var(--color-surface)",
                  color: typeFilter === type ? "#fff" : "var(--color-text-muted)",
                  border: `1px solid ${typeFilter === type ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {TYPE_ICONS[type] ? `${TYPE_ICONS[type]} ` : ""}
                {type}
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 mb-5"
          style={{ backgroundColor: "var(--color-success-bg)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both" }}
        >
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Total {typeFilter !== "All" ? typeFilter : ""} Expenses
          </p>
          <p className="text-[20px] font-semibold live-value" style={{ color: "var(--color-success)" }}>
            ₹{total.toFixed(2)}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-block rounded-2xl" style={{ height: 76 }} />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div
            className="empty-state rounded-2xl p-8 text-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div className="empty-icon-wrap mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zM8 7h8M8 11h8M8 15h5" />
              </svg>
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--color-text)" }}>
              No expenses found
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              Try a different type or date range.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((e, i) => (
              <div
                key={e.id}
                className="expense-card rounded-2xl p-3.5"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  animation: `fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(i * 0.04, 0.4)}s both`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: "var(--color-text)" }}>
                    <span>{TYPE_ICONS[e.expense_type] || "🧾"}</span> {e.expense_type}
                  </span>
                  <span className="text-[15px] font-semibold" style={{ color: "var(--color-accent)" }}>
                    ₹{e.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(e.expense_date).toLocaleDateString()}
                    {e.loads?.load_number ? ` · Load ${e.loads.load_number}` : " · Day-wise"}
                  </span>
                </div>
                {e.notes && (
                  <p className="text-[12px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                    {e.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        .skeleton-block {
          background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        .back-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out; }
        .back-btn:active { transform: scale(0.96); opacity: 0.7; }
        .back-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (hover: hover) { .back-btn:hover .back-arrow { transform: translateX(-3px); } }
        .add-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease-out; }
        .add-btn:active { transform: scale(0.94); }
        @media (hover: hover) { .add-btn:hover { box-shadow: 0 4px 12px rgba(193, 68, 14, 0.3); transform: translateY(-1px); } }
        .type-chip { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .type-chip:active { transform: scale(0.95); }
        .live-value { transition: color 0.2s ease-out; }
        .expense-card {
          box-shadow: 0 1px 2px rgba(45, 42, 38, 0.04);
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (hover: hover) {
          .expense-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45, 42, 38, 0.08); }
        }
        .empty-state { animation: fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .empty-icon-wrap {
          width: 56px; height: 56px; border-radius: 16px;
          background-color: var(--color-bg);
          display: flex; align-items: center; justify-content: center;
          animation: popIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001s !important;
            animation-delay: 0s !important;
            transition-duration: 0.001s !important;
          }
          .expense-card:hover, .add-btn:hover, .back-btn:hover .back-arrow { transform: none !important; }
        }
      `}</style>
    </div>
  );
}