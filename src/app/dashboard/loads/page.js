"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TextInput from "@/components/ui/TextInput";
import SearchButton from "@/components/ui/SearchButton";
import DateFilter from "@/components/ui/DateFilter";

export default function LoadsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loads, setLoads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  const loadLoads = async () => {
    setLoading(true);
    let query = supabase
      .from("loads")
      .select("id, load_number, load_date, vehicle_number, unit, total_quantity, total_purchase_amount, farmers(name), sales(quantity_sold)")
      .order("load_date", { ascending: false })
      .order("load_number", { ascending: false });

    if (search.trim()) {
      query = query.or(`load_number.ilike.%${search}%,vehicle_number.ilike.%${search}%`);
    }

    if (dateRange?.from && dateRange?.to) {
      query = query.gte("load_date", dateRange.from).lte("load_date", dateRange.to);
    }

    const { data } = await query;
    setLoads(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadLoads, 300);
    return () => clearTimeout(timeout);
  }, [search, dateRange]);

  const getStatus = (l) => {
    const sold = (l.sales || []).reduce((s, x) => s + parseFloat(x.quantity_sold || 0), 0);
    if (sold <= 0) return { label: "Unsold", bg: "var(--color-bg)", text: "var(--color-text-muted)" };
    if (sold >= l.total_quantity) return { label: "Sold", bg: "var(--color-success-bg)", text: "var(--color-success)" };
    return { label: "Partially Sold", bg: "rgba(196, 138, 30, 0.12)", text: "#C48A1E" };
  };

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
            Loads
          </h1>
          <div className="flex items-center gap-2">
            <SearchButton />
            <button
              onClick={() => router.push("/dashboard/loads/new")}
              className="add-btn text-white text-[14px] font-medium px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              + New Load
            </button>
          </div>
        </div>

        <div className="mb-3" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}>
          <DateFilter onRangeChange={(r) => setDateRange({ from: r.from, to: r.to })} defaultPreset="month" />
        </div>

        <div className="search-wrap mb-5" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both" }}>
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by load number or vehicle"
          />
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-block rounded-2xl" style={{ height: 100 }} />
            ))}
          </div>
        ) : loads.length === 0 ? (
          <div
            className="empty-state rounded-2xl p-8 text-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div className="empty-icon-wrap mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <rect x="1" y="7" width="13" height="10" rx="1" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="6" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--color-text)" }}>
              No loads found
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              Try a different search term or date range.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {loads.map((l, i) => {
              const status = getStatus(l);
              return (
                <div
                  key={l.id}
                  onClick={() => router.push(`/dashboard/loads/${l.id}`)}
                  role="button"
                  tabIndex={0}
                  className="load-card w-full text-left rounded-2xl p-4 cursor-pointer"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    animation: `fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(i * 0.04, 0.4)}s both`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
                      {l.load_number}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[13px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                    {l.farmers?.name} {l.vehicle_number ? `· ${l.vehicle_number}` : ""} ·{" "}
                    {new Date(l.load_date).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                      {l.total_quantity} {l.unit === "kg" ? "kg" : "crates"}
                    </span>
                    <span className="text-[15px] font-semibold" style={{ color: "var(--color-accent)" }}>
                      ₹{l.total_purchase_amount}
                    </span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 4, backgroundColor: "var(--color-bg)" }}>
                    <div
                      className="rounded-full"
                      style={{
                        height: "100%",
                        width: `${Math.min(
                          ((l.sales || []).reduce((s, x) => s + parseFloat(x.quantity_sold || 0), 0) / (l.total_quantity || 1)) * 100,
                          100
                        )}%`,
                        backgroundColor: status.text === "var(--color-text-muted)" ? "var(--color-text-muted)" : status.text,
                      }}
                    />
                  </div>
                </div>
              );
            })}
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
        .search-wrap :global(input) { transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out; }
        .search-wrap :global(input:focus) { box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12); }
        .load-card {
          box-shadow: 0 1px 2px rgba(45, 42, 38, 0.04);
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
        }
        .load-card:active { transform: scale(0.98); }
        @media (hover: hover) {
          .load-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45, 42, 38, 0.08); border-color: var(--color-accent); }
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
          .load-card:hover, .add-btn:hover, .back-btn:hover .back-arrow { transform: none !important; }
        }
      `}</style>
    </div>
  );
}