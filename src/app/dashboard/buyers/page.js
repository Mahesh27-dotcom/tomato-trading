"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TextInput from "@/components/ui/TextInput";
import SearchButton from "@/components/ui/SearchButton";
import DateFilter from "@/components/ui/DateFilter";

export default function BuyersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [buyers, setBuyers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  const loadBuyers = async () => {
    setLoading(true);
    let query = supabase.from("buyers").select("*").order("created_at", { ascending: false });

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,mobile_number.ilike.%${search}%,market_name.ilike.%${search}%`);
    }

    if (dateRange?.from && dateRange?.to) {
      query = query.gte("created_at", dateRange.from).lte("created_at", `${dateRange.to}T23:59:59`);
    }

    const { data } = await query;
    setBuyers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadBuyers, 300);
    return () => clearTimeout(timeout);
  }, [search, dateRange]);

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
            Buyers
          </h1>

          <div className="flex items-center gap-2">
            <SearchButton />

            <button
              onClick={() => router.push("/dashboard/buyers/new")}
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

        <div className="search-wrap mb-5" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both" }}>
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, or market"
          />
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-block rounded-2xl" style={{ height: 72 }} />
            ))}
          </div>
        ) : buyers.length === 0 ? (
          <div
            className="empty-state rounded-2xl p-8 text-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div className="empty-icon-wrap mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <circle cx="9" cy="7" r="3" />
                <path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2" />
                <path d="M17 8h4M19 6v4" />
              </svg>
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--color-text)" }}>
              No buyers found
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              Try a different search term or date range.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {buyers.map((b, i) => (
              <button
                key={b.id}
                onClick={() => router.push(`/dashboard/buyers/${b.id}`)}
                className="buyer-card w-full text-left rounded-2xl p-4 flex items-center gap-3"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  animation: `fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(i * 0.04, 0.4)}s both`,
                }}
              >
                <div
                  className="shrink-0 rounded-full flex items-center justify-center"
                  style={{ width: 42, height: 42, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                >
                  <span className="text-[15px] font-semibold" style={{ color: "var(--color-accent)" }}>
                    {b.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate" style={{ color: "var(--color-text)" }}>
                    {b.name}
                  </p>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    {b.mobile_number && (
                      <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                        <PhoneIcon /> {b.mobile_number}
                      </span>
                    )}
                    {b.market_name && (
                      <span className="flex items-center gap-1 text-[12px] truncate" style={{ color: "var(--color-text-muted)" }}>
                        <StoreIcon /> {b.market_name}
                      </span>
                    )}
                  </div>
                </div>

                <span className="buyer-arrow shrink-0" style={{ color: "var(--color-accent)" }}>
                  →
                </span>
              </button>
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
        @media (hover: hover) {
          .add-btn:hover { box-shadow: 0 4px 12px rgba(193, 68, 14, 0.3); transform: translateY(-1px); }
        }
        .search-wrap :global(input) { transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out; }
        .search-wrap :global(input:focus) { box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12); }
        .buyer-card {
          box-shadow: 0 1px 2px rgba(45, 42, 38, 0.04);
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.2s ease-out;
        }
        .buyer-card:active { transform: scale(0.98); }
        .buyer-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .buyer-card:active .buyer-arrow { transform: translateX(5px); }
        @media (hover: hover) {
          .buyer-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(45, 42, 38, 0.08);
            border-color: var(--color-accent);
          }
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
          .buyer-card:hover, .add-btn:hover, .back-btn:hover .back-arrow { transform: none !important; }
        }
      `}</style>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-6h16l1 6M3 9a2 2 0 002 2h.5a2 2 0 002-1.8 2 2 0 002 1.8h1a2 2 0 002-1.8 2 2 0 002 1.8h1a2 2 0 002-1.8 2 2 0 002 1.8H19a2 2 0 002-2M3 9v10h18V9" />
    </svg>
  );
}