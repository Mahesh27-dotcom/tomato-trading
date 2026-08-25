"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runSearch = async (value) => {
    setQuery(value);

    if (!value || value.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const term = value.trim();

    const [farmersRes, buyersRes, loadsRes] = await Promise.all([
      supabase.from("farmers").select("id, name").ilike("name", `%${term}%`).limit(10),
      supabase.from("buyers").select("id, name").ilike("name", `%${term}%`).limit(10),
      supabase
        .from("loads")
        .select("id, load_number, vehicle_number, load_date, farmers:farmer_id(name)")
        .or(`load_number.ilike.%${term}%,vehicle_number.ilike.%${term}%`)
        .limit(10),
    ]);

    setResults({
      farmers: farmersRes.data || [],
      buyers: buyersRes.data || [],
      loads: loadsRes.data || [],
    });
    setLoading(false);
  };

  const hasResults =
    results && (results.farmers.length > 0 || results.buyers.length > 0 || results.loads.length > 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="text-[14px] font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            ← Back
          </button>
        </div>

        <h1 className="text-[24px] font-semibold mb-5 tracking-tight" style={{ color: "var(--color-text)" }}>
          Search
        </h1>

        <input
          type="text"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Load number, farmer, buyer, vehicle no."
          autoFocus
          className="input-base w-full rounded-2xl px-4 py-3 mb-6 text-[15px]"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />

        {loading && (
          <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
            Searching...
          </p>
        )}

        {!loading && query.trim().length >= 2 && !hasResults && (
          <p className="text-[13px] text-center py-14" style={{ color: "var(--color-text-muted)" }}>
            No results found.
          </p>
        )}

        {!loading && results && results.farmers.length > 0 && (
          <ResultSection title="Farmers">
            {results.farmers.map((f) => (
              <ResultRow
                key={f.id}
                title={f.name}
                subtitle="Farmer"
                onClick={() => router.push(`/dashboard/farmers/${f.id}`)}
              />
            ))}
          </ResultSection>
        )}

        {!loading && results && results.buyers.length > 0 && (
          <ResultSection title="Buyers">
            {results.buyers.map((b) => (
              <ResultRow
                key={b.id}
                title={b.name}
                subtitle="Buyer"
                onClick={() => router.push(`/dashboard/buyers/${b.id}`)}
              />
            ))}
          </ResultSection>
        )}

        {!loading && results && results.loads.length > 0 && (
          <ResultSection title="Loads">
            {results.loads.map((l) => (
              <ResultRow
                key={l.id}
                title={l.load_number}
                subtitle={`${l.farmers?.name || "Unknown farmer"} · ${l.vehicle_number} · ${l.load_date}`}
                onClick={() => router.push(`/dashboard/loads/${l.id}`)}
              />
            ))}
          </ResultSection>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, children }) {
  return (
    <div className="mb-6">
      <h2
        className="text-[13px] font-semibold uppercase tracking-wide mb-3"
        style={{ color: "var(--color-text-muted)" }}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ResultRow({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-3.5"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-[14px] font-medium" style={{ color: "var(--color-text)" }}>
        {title}
      </p>
      <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
        {subtitle}
      </p>
    </button>
  );
}