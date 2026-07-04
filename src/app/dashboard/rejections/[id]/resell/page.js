"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ResaleForm from "@/components/resales/ResaleForm";

export default function ResellRejectionPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [rejection, setRejection] = useState(null);
  const [loadId, setLoadId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: rejectionData } = await supabase
        .from("rejections")
        .select("*, sales(load_id, buyers(name))")
        .eq("id", params.id)
        .single();

      setRejection(rejectionData);
      setLoadId(rejectionData?.sales?.load_id || null);
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

  if (!rejection) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Rejection not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push(loadId ? `/dashboard/loads/${loadId}` : "/dashboard")}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to load
        </button>

        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>
          Resell Rejected Tomatoes
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "var(--color-text-muted)" }}>
          Originally rejected by {rejection.sales?.buyers?.name}
          {rejection.reason ? ` · ${rejection.reason}` : ""}
        </p>

        <ResaleForm rejection={rejection} loadId={loadId} />
      </div>
    </div>
  );
}