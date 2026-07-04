"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TextInput from "@/components/ui/TextInput";

export default function LoadsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loads, setLoads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLoads = async () => {
    setLoading(true);
    let query = supabase
      .from("loads")
      .select("id, load_number, load_date, vehicle_number, total_quantity, total_purchase_amount, farmers(name)")
      .order("load_date", { ascending: false })
      .order("load_number", { ascending: false });

    if (search.trim()) {
      query = query.or(`load_number.ilike.%${search}%,vehicle_number.ilike.%${search}%`);
    }

    const { data } = await query;
    setLoads(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadLoads, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to dashboard
        </button>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>
            Loads
          </h1>
          <button
            onClick={() => router.push("/dashboard/loads/new")}
            className="text-white text-[14px] font-medium px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            + New Load
          </button>
        </div>

        <div className="mb-5">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by load number or vehicle"
          />
        </div>

        {loading ? (
          <p className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
            Loading...
          </p>
        ) : loads.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>No loads found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {loads.map((l) => (
              <button
                key={l.id}
                onClick={() => router.push(`/dashboard/loads/${l.id}`)}
                className="w-full text-left rounded-2xl p-4"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
                    {l.load_number}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(l.load_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[13px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {l.farmers?.name} {l.vehicle_number ? `· ${l.vehicle_number}` : ""}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                    {l.total_quantity} kg
                  </span>
                  <span className="text-[15px] font-semibold" style={{ color: "var(--color-accent)" }}>
                    ₹{l.total_purchase_amount}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}