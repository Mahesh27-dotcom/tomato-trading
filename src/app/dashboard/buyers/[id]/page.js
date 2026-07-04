"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import BuyerForm from "@/components/buyers/BuyerForm";

export default function BuyerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("buyers").select("*").eq("id", params.id).single();
      setBuyer(data);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Buyer not found.</p>
      </div>
    );
  }

  // Placeholder totals — will be wired to real data once Sales Management
  // and Buyer Payments (Steps 7 & 10) are built.
  const totals = {
    totalPurchases: 0,
    totalSalesAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard/buyers")}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to buyers
        </button>

        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>
          {buyer.name}
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "var(--color-text-muted)" }}>
          {buyer.mobile_number} {buyer.market_name ? `· ${buyer.market_name}` : ""}
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-7">
          <StatCard label="Total Purchases" value={totals.totalPurchases} />
          <StatCard label="Total Sales Amount" value={`₹${totals.totalSalesAmount}`} />
          <StatCard label="Amount Received" value={`₹${totals.amountReceived}`} />
          <StatCard label="Pending Amount" value={`₹${totals.pendingAmount}`} accent />
        </div>

        <h2 className="text-[16px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Edit Buyer
        </h2>
        <BuyerForm buyer={buyer} />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-[11px] mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      <p
        className="text-[16px] font-semibold"
        style={{ color: accent ? "var(--color-accent)" : "var(--color-text)" }}
      >
        {value}
      </p>
    </div>
  );
}