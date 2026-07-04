"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SaleForm from "@/components/sales/SaleForm";

export default function NewSalePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [load, setLoad] = useState(null);
  const [alreadySold, setAlreadySold] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: loadData } = await supabase
        .from("loads")
        .select("*")
        .eq("id", params.id)
        .single();

      const { data: existingSales } = await supabase
        .from("sales")
        .select("quantity_sold")
        .eq("load_id", params.id);

      const sold = (existingSales || []).reduce(
        (sum, s) => sum + parseFloat(s.quantity_sold),
        0
      );

      setLoad(loadData);
      setAlreadySold(sold);
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

  if (!load) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Load not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push(`/dashboard/loads/${load.id}`)}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to load
        </button>

        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>
          Sell Load {load.load_number}
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "var(--color-text-muted)" }}>
          Total load quantity: {load.total_quantity} kg
        </p>

        <SaleForm load={load} alreadySold={alreadySold} />
      </div>
    </div>
  );
}