"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import FarmerForm from "@/components/farmers/FarmerForm";

export default function FarmerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("farmers").select("*").eq("id", params.id).single();
      setFarmer(data);
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

  if (!farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Farmer not found.</p>
      </div>
    );
  }

  // Placeholder totals — will be wired to real data once Load Management
  // and Farmer Payments (Steps 6 & 9) are built.
  const totals = {
    totalLoads: 0,
    totalQuantity: 0,
    totalPurchaseAmount: 0,
    amountPaid: 0,
    pendingAmount: 0,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard/farmers")}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to farmers
        </button>

        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>
          {farmer.name}
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "var(--color-text-muted)" }}>
          {farmer.mobile_number} {farmer.village ? `· ${farmer.village}` : ""}
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-7">
          <StatCard label="Total Loads" value={totals.totalLoads} />
          <StatCard label="Total Quantity" value={`${totals.totalQuantity} kg`} />
          <StatCard label="Purchase Amount" value={`₹${totals.totalPurchaseAmount}`} />
          <StatCard label="Amount Paid" value={`₹${totals.amountPaid}`} />
          <StatCard
            label="Pending Amount"
            value={`₹${totals.pendingAmount}`}
            accent
          />
        </div>

        <h2 className="text-[16px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Edit Farmer
        </h2>
        <FarmerForm farmer={farmer} />
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