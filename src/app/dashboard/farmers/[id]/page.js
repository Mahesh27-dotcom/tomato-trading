"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { unitLabel } from "@/lib/units";

export default function FarmerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [farmer, setFarmer] = useState(null);
  const [loads, setLoads] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: farmerData } = await supabase.from("farmers").select("*").eq("id", params.id).single();

      const { data: loadsData } = await supabase
        .from("loads")
        .select("id, load_number, load_date, total_quantity, total_purchase_amount, created_at")
        .eq("farmer_id", params.id)
        .order("load_date", { ascending: false });

      const { data: paymentsData } = await supabase
        .from("farmer_payments")
        .select("*")
        .eq("farmer_id", params.id)
        .order("payment_date", { ascending: false });

      setFarmer(farmerData);
      setLoads(loadsData || []);
      setPayments(paymentsData || []);
      setLoading(false);
    };

    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-md mx-auto px-4 py-6 space-y-3">
          <div className="skeleton-block rounded-2xl" style={{ height: 20, width: 140 }} />
          <div className="flex items-center gap-3 mt-4">
            <div className="skeleton-block rounded-full" style={{ width: 56, height: 56 }} />
            <div className="space-y-2 flex-1">
              <div className="skeleton-block rounded-lg" style={{ height: 18, width: "60%" }} />
              <div className="skeleton-block rounded-lg" style={{ height: 14, width: "40%" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-block rounded-2xl" style={{ height: 66 }} />
            ))}
          </div>
        </div>
        <style jsx global>{`
          @keyframes shimmer {
            from { background-position: -200% 0; }
            to { background-position: 200% 0; }
          }
          .skeleton-block {
            background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Farmer not found.</p>
      </div>
    );
  }

  const totalLoads = loads.length;

  // Quantity can't be summed across units (Crates + Kg is meaningless),
  // so group by unit and show each total separately.
  const quantityByUnit = loads.reduce((acc, l) => {
    const key = l.unit || "crate";
    acc[key] = (acc[key] || 0) + parseFloat(l.total_quantity || 0);
    return acc;
  }, {});
  const quantityEntries = Object.entries(quantityByUnit); // [[unit, qty], ...]

  const totalPurchaseAmount = loads.reduce((sum, l) => sum + parseFloat(l.total_purchase_amount || 0), 0);
  const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const pendingAmount = totalPurchaseAmount - amountPaid;

  const ledger = [
    ...loads.map((l) => ({
      type: "load",
      date: l.load_date,
      createdAt: l.created_at,
      label: `Load ${l.load_number}`,
      amount: parseFloat(l.total_purchase_amount || 0),
      id: l.id,
    })),
    ...payments.map((p) => ({
      type: "payment",
      date: p.payment_date,
      createdAt: p.created_at,
      label: `Payment${p.payment_mode ? ` · ${p.payment_mode}` : ""}`,
      amount: -parseFloat(p.amount || 0),
      id: p.id,
      notes: p.notes,
    })),
  ].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    // Same day — use created_at (full timestamp) so the most recently
    // added entry shows first, instead of arbitrary insertion order.
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard/farmers")}
          className="back-btn text-[14px] font-medium mb-5 inline-flex items-center gap-1"
          style={{ color: "var(--color-accent)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <span className="back-arrow">←</span> Back to farmers
        </button>

        <div
          className="flex items-center gap-3 mb-6"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both" }}
        >
          <div
            className="shrink-0 rounded-full flex items-center justify-center"
            style={{ width: 56, height: 56, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <span className="text-[20px] font-semibold" style={{ color: "var(--color-accent)" }}>
              {farmer.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold truncate" style={{ color: "var(--color-text)" }}>
              {farmer.name}
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {farmer.mobile_number} {farmer.village ? `· ${farmer.village}` : ""}
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-2.5 mb-7"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}
        >
          <button
            onClick={() => router.push(`/dashboard/farmers/${farmer.id}/edit`)}
            className="action-btn rounded-2xl py-3 text-[14px] font-medium flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => router.push(`/dashboard/farmers/${farmer.id}/pay`)}
            className="action-btn rounded-2xl py-3 text-[14px] font-medium flex items-center justify-center gap-1.5 text-white"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            💰 Record Payment
          </button>
        </div>

        <div
          className="grid grid-cols-2 gap-2.5 mb-7"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both" }}
        >
          <StatCard label="Total Loads" value={totalLoads} />
          {quantityEntries.length === 0 ? (
            <StatCard label="Total Quantity" value="0" />
          ) : quantityEntries.length === 1 ? (
            <StatCard label="Total Quantity" value={`${quantityEntries[0][1].toFixed(1)} ${unitLabel(quantityEntries[0][0])}`} />
          ) : (
            quantityEntries.map(([unit, qty]) => (
              <StatCard key={unit} label={`Total ${unitLabel(unit)}`} value={qty.toFixed(1)} />
            ))
          )}
          <StatCard label="Purchase Amount" value={`₹${totalPurchaseAmount.toFixed(2)}`} />
          <StatCard label="Amount Paid" value={`₹${amountPaid.toFixed(2)}`} />
          <StatCard label="Pending Amount" value={`₹${pendingAmount.toFixed(2)}`} accent={pendingAmount > 0} />
        </div>

        <h2 className="text-[16px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Ledger
        </h2>
        {ledger.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center mb-7"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="mx-auto mb-3 rounded-2xl flex items-center justify-center"
              style={{ width: 56, height: 56, backgroundColor: "var(--color-bg)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zM8 7h8M8 11h8M8 15h5" />
              </svg>
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--color-text)" }}>
              No transactions yet
            </p>
            <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              Loads and payments for this farmer will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-7">
            {ledger.map((entry, i) => (
              <div
                key={`${entry.type}-${entry.id}`}
                className="ledger-row rounded-2xl p-3.5 flex items-center justify-between"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  cursor: entry.type === "load" ? "pointer" : "default",
                  animation: `fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(i * 0.03, 0.3)}s both`,
                }}
                onClick={() => {
                  if (entry.type === "load") router.push(`/dashboard/loads/${entry.id}`);
                }}
              >
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--color-text)" }}>
                    {entry.label}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(entry.date).toLocaleDateString()}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </p>
                </div>
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: entry.amount < 0 ? "var(--color-success)" : "var(--color-text)" }}
                >
                  {entry.amount < 0 ? "-" : ""}₹{Math.abs(entry.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {farmer.notes && (
          <>
            <h2 className="text-[16px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
              Notes
            </h2>
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-[14px]" style={{ color: "var(--color-text)" }}>
                {farmer.notes}
              </p>
            </div>
          </>
        )}
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

        .action-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .action-btn:active { transform: scale(0.96); }
        @media (hover: hover) { .action-btn:hover { transform: translateY(-1px); } }

        .ledger-row { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease-out; }
        .ledger-row:active { transform: scale(0.98); }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001s !important;
            animation-delay: 0s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-[11px] mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-[16px] font-semibold" style={{ color: accent ? "var(--color-accent)" : "var(--color-text)" }}>
        {value}
      </p>
    </div>
  );
}