"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TextInput from "@/components/ui/TextInput";

export default function BuyersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [buyers, setBuyers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBuyers = async () => {
    setLoading(true);
    let query = supabase.from("buyers").select("*").order("created_at", { ascending: false });

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,mobile_number.ilike.%${search}%,market_name.ilike.%${search}%`);
    }

    const { data } = await query;
    setBuyers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadBuyers, 300);
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
            Buyers
          </h1>
          <button
            onClick={() => router.push("/dashboard/buyers/new")}
            className="text-white text-[14px] font-medium px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            + Add
          </button>
        </div>

        <div className="mb-5">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, or market"
          />
        </div>

        {loading ? (
          <p className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
            Loading...
          </p>
        ) : buyers.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>No buyers found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {buyers.map((b) => (
              <button
                key={b.id}
                onClick={() => router.push(`/dashboard/buyers/${b.id}`)}
                className="w-full text-left rounded-2xl p-4 flex items-center justify-between"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
                    {b.name}
                  </p>
                  <p className="text-[13px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {b.mobile_number} {b.market_name ? `· ${b.market_name}` : ""}
                  </p>
                </div>
                <span style={{ color: "var(--color-accent)" }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

