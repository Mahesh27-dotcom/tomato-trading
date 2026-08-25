"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/components/ui/Toast";
import CountUp from "@/components/ui/CountUp";

export default function LoadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const showToast = useToast();

  const [load, setLoad] = useState(null);
  const [rates, setRates] = useState([]);
  const [sales, setSales] = useState([]);
  const [rejectionsBySale, setRejectionsBySale] = useState({});
  const [resalesByRejection, setResalesByRejection] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    const { data: loadData } = await supabase
      .from("loads")
      .select("*, farmers(name, mobile_number, village)")
      .eq("id", params.id)
      .single();

    const { data: rateData } = await supabase.from("purchase_rates").select("*").eq("load_id", params.id).order("created_at");

    const { data: salesData } = await supabase
      .from("sales")
      .select("*, buyers(name, market_name)")
      .eq("load_id", params.id)
      .order("created_at");

    const saleIds = (salesData || []).map((s) => s.id);
    let rejectionsData = [];
    if (saleIds.length > 0) {
      const { data } = await supabase.from("rejections").select("*").in("sale_id", saleIds).order("created_at");
      rejectionsData = data || [];
    }

    const rejectionIds = rejectionsData.map((r) => r.id);
    let resalesData = [];
    if (rejectionIds.length > 0) {
      const { data } = await supabase
        .from("resales")
        .select("*, buyers(name, market_name)")
        .in("rejection_id", rejectionIds)
        .order("created_at");
      resalesData = data || [];
    }

    const groupedRejections = {};
    rejectionsData.forEach((r) => {
      if (!groupedRejections[r.sale_id]) groupedRejections[r.sale_id] = [];
      groupedRejections[r.sale_id].push(r);
    });

    const groupedResales = {};
    resalesData.forEach((r) => {
      if (!groupedResales[r.rejection_id]) groupedResales[r.rejection_id] = [];
      groupedResales[r.rejection_id].push(r);
    });

    setLoad(loadData);
    setRates(rateData || []);
    setSales(salesData || []);
    setRejectionsBySale(groupedRejections);
    setResalesByRejection(groupedResales);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleDiscard = async (rejectionId) => {
    if (!confirm("Mark this rejection as discarded? This cannot be undone.")) return;
    haptic("warning");
    setActionLoading(rejectionId);
    setError("");

    const { error: updateError } = await supabase.from("rejections").update({ status: "Discarded" }).eq("id", rejectionId);

    if (updateError) {
      setError(updateError.message);
      setActionLoading(null);
      return;
    }

    await loadData();
    showToast("Marked as discarded");
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-md mx-auto px-4 py-6 space-y-3">
          <div className="skeleton-block rounded-2xl" style={{ height: 20, width: 120 }} />
          <div className="skeleton-block rounded-[24px]" style={{ height: 150, marginTop: 16 }} />
          <div className="skeleton-block rounded-2xl" style={{ height: 90 }} />
          <div className="skeleton-block rounded-2xl" style={{ height: 90 }} />
        </div>
        <style jsx global>{`
          @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
          .skeleton-block {
            background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Load not found.</p>
      </div>
    );
  }

  const unitLabel = load.unit === "kg" ? "kg" : "crates";
  const totalSold = sales.reduce((sum, s) => sum + parseFloat(s.quantity_sold), 0);
  const totalSalesAmount = sales.reduce((sum, s) => sum + parseFloat(s.sale_amount || 0), 0);
  const remaining = load.total_quantity - totalSold;
  const soldPct = load.total_quantity > 0 ? Math.min((totalSold / load.total_quantity) * 100, 100) : 0;

  const avgSaleRate = totalSold > 0 ? totalSalesAmount / totalSold : 0;
  const avgPurchaseRate = load.total_quantity > 0 ? load.total_purchase_amount / load.total_quantity : 0;
  const remainingValue = remaining * avgPurchaseRate;

  const overallStatus =
    totalSold <= 0
      ? { label: "Unsold", bg: "var(--color-bg)", text: "var(--color-text-muted)" }
      : totalSold >= load.total_quantity
      ? { label: "Fully Sold", bg: "var(--color-success-bg)", text: "var(--color-success)" }
      : { label: "Partially Sold", bg: "rgba(196, 138, 30, 0.12)", text: "#C48A1E" };

  const statusColor = (status) => {
    if (status === "Resold") return { bg: "var(--color-success-bg)", text: "var(--color-success)" };
    if (status === "Discarded") return { bg: "var(--color-danger-bg)", text: "var(--color-danger)" };
    return { bg: "var(--color-bg)", text: "var(--color-text-muted)" };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard/loads")}
          className="back-btn text-[14px] font-medium mb-5 inline-flex items-center gap-1"
          style={{ color: "var(--color-accent)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <span className="back-arrow">←</span> Back to loads
        </button>

        {error && (
          <p
            className="text-[13px] rounded-2xl px-4 py-3 mb-5 error-shake"
            style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
          >
            {error}
          </p>
        )}

        {/* Hero card — lightened */}
        <div
          className="hero-card rounded-[24px] p-5 mb-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            animation: "fadeSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
              {new Date(load.load_date).toLocaleDateString()} · {load.vehicle_number}
            </p>
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: overallStatus.bg, color: overallStatus.text }}
            >
              {overallStatus.label}
            </span>
          </div>
          <p className="text-[24px] font-bold tracking-tight mb-1" style={{ color: "var(--color-text)" }}>
            {load.load_number}
          </p>
          <p className="text-[13px] mb-3" style={{ color: "var(--color-text-muted)" }}>
            {load.farmers?.name} {load.farmers?.village ? `· ${load.farmers.village}` : ""}
          </p>

          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 8, backgroundColor: "var(--color-bg)" }}
          >
            <div
              className="progress-fill h-full rounded-full"
              style={{ width: `${soldPct}%`, backgroundColor: "var(--color-accent)" }}
            />
          </div>
          <p className="text-[12px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
            {totalSold} / {load.total_quantity} {unitLabel} sold
          </p>

          {remaining > 0 && (
            <button
              onClick={() => router.push(`/dashboard/loads/${load.id}/sell`)}
              className="action-btn w-full mt-4 rounded-2xl py-3 text-[14px] font-semibold text-white"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              {totalSold > 0 ? `Continue Selling · ${remaining} ${unitLabel} left` : `Sell Remaining ${remaining} ${unitLabel}`}
            </button>
          )}
        </div>

        {/* KPI cards */}
        <div
          className="grid grid-cols-2 gap-2.5 mb-6"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}
        >
          <KpiCard label="Total Quantity" value={`${load.total_quantity} ${unitLabel}`} />
          <KpiCard label="Purchase Value" value={load.total_purchase_amount} isCurrency />
          <KpiCard label="Sold" value={`${totalSold} ${unitLabel}`} accentColor="var(--color-success)" />
          <KpiCard label="Remaining" value={`${remaining} ${unitLabel}`} accentColor={remaining > 0 ? "var(--color-danger)" : "var(--color-text)"} />
        </div>

        <div
          className="info-card rounded-2xl p-4 mb-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both",
          }}
        >
          <p className="text-[12px] mb-1" style={{ color: "var(--color-text-muted)" }}>
            Farmer
          </p>
          <p className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
            {load.farmers?.name}
          </p>
          <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            {load.farmers?.mobile_number} {load.farmers?.village ? `· ${load.farmers.village}` : ""}
          </p>
        </div>

        {/* Purchase Rates — enriched with meaningful stats */}
        <h2 className="text-[16px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Purchase Rates
        </h2>
        <div
          className="info-card rounded-2xl p-4 mb-6"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            animation: "fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both",
          }}
        >
          <div className="space-y-2 mb-3 pb-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            {rates.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--color-text)" }}>
                  {r.quantity} {unitLabel} × ₹{r.rate}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>
                  ₹{r.amount}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Avg Purchase Rate</p>
              <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>₹{avgPurchaseRate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Avg Sale Rate</p>
              <p className="text-[13px] font-semibold" style={{ color: "var(--color-success)" }}>
                {totalSold > 0 ? `₹${avgSaleRate.toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Remaining Value</p>
              <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>₹{remainingValue.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Sales timeline */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-semibold" style={{ color: "var(--color-text)" }}>
            Sales Timeline
          </h2>
          <span className="text-[13px] font-semibold" style={{ color: "var(--color-accent)" }}>
            ₹{totalSalesAmount.toFixed(2)}
          </span>
        </div>

        {sales.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center mb-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              Not sold yet.
            </p>
          </div>
        ) : (
          <div className="relative mb-6">
            <div
              className="absolute left-[7px] top-2 bottom-2 w-[2px]"
              style={{ backgroundColor: "var(--color-border)" }}
            />
            <div className="space-y-5">
              {sales.map((s, i) => {
                const saleRejections = rejectionsBySale[s.id] || [];
                const rejectedQty = saleRejections.reduce((sum, r) => sum + parseFloat(r.rejected_quantity), 0);
                const canReject = rejectedQty < s.quantity_sold;

                return (
                  <div
                    key={s.id}
                    className="relative pl-6"
                    style={{ animation: `fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(i * 0.05, 0.3)}s both` }}
                  >
                    <div
                      className="absolute left-0 top-1.5 rounded-full"
                      style={{ width: 16, height: 16, backgroundColor: "var(--color-accent)", border: "3px solid var(--color-bg)" }}
                    />
                    <div
                      className="info-card rounded-2xl p-3.5"
                      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
                          {s.buyers?.name}
                        </span>
                        <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(s.sale_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                          {s.quantity_sold} {unitLabel} × ₹{s.sale_rate}
                        </span>
                        <span className="text-[14px] font-semibold" style={{ color: "var(--color-accent)" }}>
                          ₹{s.sale_amount}
                        </span>
                      </div>

                      {saleRejections.length > 0 && (
                        <div className="space-y-2.5 mb-2.5 pt-2.5" style={{ borderTop: "1px solid var(--color-border)" }}>
                          {saleRejections.map((r) => {
                            const colors = statusColor(r.status);
                            const resalesForThis = resalesByRejection[r.id] || [];

                            return (
                              <div key={r.id}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                                    {r.rejected_quantity} {unitLabel} rejected{r.reason ? ` · ${r.reason}` : ""}
                                  </span>
                                  <span
                                    className="status-badge text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: colors.bg, color: colors.text }}
                                  >
                                    {r.status}
                                  </span>
                                </div>

                                {resalesForThis.map((rs) => (
                                  <div
                                    key={rs.id}
                                    className="flex items-center justify-between text-[12px] mt-1"
                                    style={{ color: "var(--color-success)" }}
                                  >
                                    <span>
                                      Resold to {rs.buyers?.name} · {rs.quantity} {unitLabel} × ₹{rs.resale_rate}
                                    </span>
                                    <span className="font-semibold">₹{rs.resale_amount}</span>
                                  </div>
                                ))}

                                {r.status === "Pending Resale" && (
                                  <div className="flex gap-3 mt-1.5">
                                    <button
                                      onClick={() => router.push(`/dashboard/rejections/${r.id}/resell`)}
                                      className="link-btn text-[12px] font-medium"
                                      style={{ color: "var(--color-accent)" }}
                                    >
                                      Resell
                                    </button>
                                    <button
                                      onClick={() => handleDiscard(r.id)}
                                      disabled={actionLoading === r.id}
                                      className="link-btn text-[12px] font-medium disabled:opacity-50"
                                      style={{ color: "var(--color-danger)" }}
                                    >
                                      {actionLoading === r.id ? "Discarding..." : "Mark as Discarded"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {canReject && (
                        <button
                          onClick={() => router.push(`/dashboard/sales/${s.id}/reject`)}
                          className="link-btn text-[12px] font-medium"
                          style={{ color: "var(--color-danger)" }}
                        >
                          + Record rejection
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {load.notes && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-[12px] mb-1" style={{ color: "var(--color-text-muted)" }}>
              Notes
            </p>
            <p className="text-[14px]" style={{ color: "var(--color-text)" }}>
              {load.notes}
            </p>
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
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
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
        .hero-card { box-shadow: 0 1px 3px rgba(45,42,38,0.05); }
        .action-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .action-btn:active { transform: scale(0.96); }
        @media (hover: hover) { .action-btn:hover { transform: translateY(-1px); } }
        .progress-fill { transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
        .info-card { transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .status-badge { animation: popIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .error-shake { animation: shake 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
        .link-btn { transition: opacity 0.2s ease-out; }
        .link-btn:active { opacity: 0.6; }
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

function KpiCard({ label, value, isCurrency, accentColor }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-[11px] mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      <p className="text-[16px] font-semibold" style={{ color: accentColor || "var(--color-text)" }}>
        {isCurrency ? <CountUp value={value} prefix="₹" /> : value}
      </p>
    </div>
  );
}