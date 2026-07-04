"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

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

    const { data: rateData } = await supabase
      .from("purchase_rates")
      .select("*")
      .eq("load_id", params.id)
      .order("created_at");

    const { data: salesData } = await supabase
      .from("sales")
      .select("*, buyers(name, market_name)")
      .eq("load_id", params.id)
      .order("created_at");

    const saleIds = (salesData || []).map((s) => s.id);
    let rejectionsData = [];
    if (saleIds.length > 0) {
      const { data } = await supabase
        .from("rejections")
        .select("*")
        .in("sale_id", saleIds)
        .order("created_at");
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
    setActionLoading(rejectionId);
    setError("");

    const { error: updateError } = await supabase
      .from("rejections")
      .update({ status: "Discarded" })
      .eq("id", rejectionId);

    if (updateError) {
      setError(updateError.message);
      setActionLoading(null);
      return;
    }

    await loadData();
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
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

  const totalSold = sales.reduce((sum, s) => sum + parseFloat(s.quantity_sold), 0);
  const totalSalesAmount = sales.reduce((sum, s) => sum + parseFloat(s.sale_amount || 0), 0);
  const remaining = load.total_quantity - totalSold;

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
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to loads
        </button>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>
            {load.load_number}
          </h1>
          {remaining > 0 && (
            <button
              onClick={() => router.push(`/dashboard/loads/${load.id}/sell`)}
              className="text-white text-[13px] font-medium px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              + Sell
            </button>
          )}
        </div>
        <p className="text-[14px] mb-6" style={{ color: "var(--color-text-muted)" }}>
          {new Date(load.load_date).toLocaleDateString()} · {load.vehicle_number}
        </p>

        {error && (
          <p
            className="text-[13px] rounded-2xl px-4 py-3 mb-5"
            style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
          >
            {error}
          </p>
        )}

        <div
          className="rounded-2xl p-4 mb-5"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
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

        <h2 className="text-[16px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Purchase rates
        </h2>
        <div className="space-y-2.5 mb-5">
          {rates.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-3.5 flex items-center justify-between"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <span className="text-[14px]" style={{ color: "var(--color-text)" }}>
                {r.quantity} kg × ₹{r.rate}
              </span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
                ₹{r.amount}
              </span>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-4 flex items-center justify-between mb-6"
          style={{ backgroundColor: "var(--color-success-bg)" }}
        >
          <div>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Total quantity
            </p>
            <p className="text-[16px] font-semibold" style={{ color: "var(--color-text)" }}>
              {load.total_quantity} kg
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Total purchase amount
            </p>
            <p className="text-[18px] font-semibold" style={{ color: "var(--color-success)" }}>
              ₹{load.total_purchase_amount}
            </p>
          </div>
        </div>

        <h2 className="text-[16px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Sales
        </h2>
        {sales.length === 0 ? (
          <div
            className="rounded-2xl p-4 text-center mb-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              Not sold yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 mb-5">
            {sales.map((s) => {
              const saleRejections = rejectionsBySale[s.id] || [];
              const rejectedQty = saleRejections.reduce(
                (sum, r) => sum + parseFloat(r.rejected_quantity),
                0
              );
              const canReject = rejectedQty < s.quantity_sold;

              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-3.5"
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
                      {s.quantity_sold} kg × ₹{s.sale_rate}
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
                                {r.rejected_quantity} kg rejected{r.reason ? ` · ${r.reason}` : ""}
                              </span>
                              <span
                                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
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
                                  Resold to {rs.buyers?.name} · {rs.quantity} kg × ₹{rs.resale_rate}
                                </span>
                                <span className="font-semibold">₹{rs.resale_amount}</span>
                              </div>
                            ))}

                            {r.status === "Pending Resale" && (
                              <div className="flex gap-3 mt-1.5">
                                <button
                                  onClick={() => router.push(`/dashboard/rejections/${r.id}/resell`)}
                                  className="text-[12px] font-medium"
                                  style={{ color: "var(--color-accent)" }}
                                >
                                  Resell
                                </button>
                                <button
                                  onClick={() => handleDiscard(r.id)}
                                  disabled={actionLoading === r.id}
                                  className="text-[12px] font-medium disabled:opacity-50"
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
                      className="text-[12px] font-medium"
                      style={{ color: "var(--color-danger)" }}
                    >
                      + Record rejection
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          className="rounded-2xl p-4 flex items-center justify-between mb-5"
          style={{ backgroundColor: remaining > 0 ? "var(--color-danger-bg)" : "var(--color-success-bg)" }}
        >
          <div>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Sold / Remaining
            </p>
            <p
              className="text-[16px] font-semibold"
              style={{ color: remaining > 0 ? "var(--color-danger)" : "var(--color-success)" }}
            >
              {totalSold} kg sold · {remaining} kg remaining
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Total sales amount
            </p>
            <p className="text-[18px] font-semibold" style={{ color: "var(--color-text)" }}>
              ₹{totalSalesAmount.toFixed(2)}
            </p>
          </div>
        </div>

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
    </div>
  );
}