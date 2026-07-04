"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import RejectionForm from "@/components/rejections/RejectionForm";

export default function RejectSalePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [sale, setSale] = useState(null);
  const [alreadyRejected, setAlreadyRejected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: saleData } = await supabase
        .from("sales")
        .select("*, buyers(name, market_name)")
        .eq("id", params.id)
        .single();

      const { data: existingRejections } = await supabase
        .from("rejections")
        .select("rejected_quantity")
        .eq("sale_id", params.id);

      const rejected = (existingRejections || []).reduce(
        (sum, r) => sum + parseFloat(r.rejected_quantity),
        0
      );

      setSale(saleData);
      setAlreadyRejected(rejected);
      setLoading(false);
    };

    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Sale not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push(`/dashboard/loads/${sale.load_id}`)}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to load
        </button>

        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>
          Record Rejection
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "var(--color-text-muted)" }}>
          {sale.buyers?.name} · {sale.quantity_sold} kg × ₹{sale.sale_rate}
        </p>

        <RejectionForm sale={sale} alreadyRejected={alreadyRejected} />
      </div>
    </div>
  );
}