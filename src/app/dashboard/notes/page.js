"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchNotesLog } from "@/lib/notesLog";
import DateFilter from "@/components/ui/DateFilter";
import TextInput from "@/components/ui/TextInput";
import SearchButton from "@/components/ui/SearchButton";

const SOURCES = ["All", "Farmer", "Buyer", "Load", "Expense", "Rejection"];

const SOURCE_COLORS = {
  Farmer: "var(--color-accent)",
  Buyer: "var(--color-success)",
  Load: "#C48A1E",
  Expense: "#6B6459",
  Rejection: "var(--color-danger)",
};

export default function NotesLogPage() {
  const router = useRouter();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("All");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    setLoading(true);
    const result = await fetchNotesLog(dateRange);
    setEntries(result);
    setLoading(false);
  }, [dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = entries.filter((e) => {
    if (sourceFilter !== "All" && e.source !== sourceFilter) return false;
    if (search.trim() && !e.note.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[14px] font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            ← Back to dashboard
          </button>
          <SearchButton />
        </div>

        <h1 className="text-[22px] font-semibold mb-5" style={{ color: "var(--color-text)" }}>
          Notes & Remarks
        </h1>

        <div className="mb-3">
          <DateFilter onRangeChange={(r) => setDateRange({ from: r.from, to: r.to })} defaultPreset="month" />
        </div>

        <div className="mb-3 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className="text-[13px] font-medium px-3.5 py-2 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: sourceFilter === s ? "var(--color-accent)" : "var(--color-surface)",
                  color: sourceFilter === s ? "#fff" : "var(--color-text-muted)",
                  border: `1px solid ${sourceFilter === s ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search within notes"
          />
        </div>

        {loading ? (
          <p className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>No notes found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl p-3.5"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: "#fff",
                      backgroundColor: SOURCE_COLORS[e.source] || "var(--color-text-muted)",
                    }}
                  >
                    {e.source}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[13px] font-medium mb-1" style={{ color: "var(--color-text)" }}>
                  {e.identifier}
                </p>
                <p className="text-[13px] mb-2" style={{ color: "var(--color-text)" }}>
                  {e.note}
                </p>
                {e.route && (
                  <button
                    onClick={() => router.push(e.route)}
                    className="text-[12px] font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Open →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}