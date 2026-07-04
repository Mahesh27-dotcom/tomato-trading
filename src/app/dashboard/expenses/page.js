"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const EXPENSE_TYPES = ["All", "Transportation", "Labour", "Loading", "Unloading", "Diesel", "Other"];

export default function ExpensesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [expenses, setExpenses] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    setLoading(true);
    let query = supabase
      .from("expenses")
      .select("*, loads(load_number)")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (typeFilter !== "All") {
      query = query.eq("expense_type", typeFilter);
    }

    const { data } = await query;
    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, [typeFilter]);

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

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
            Expenses
          </h1>
          <button
            onClick={() => router.push("/dashboard/expenses/new")}
            className="text-white text-[14px] font-medium px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            + Add
          </button>
        </div>

        <div className="mb-5 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {EXPENSE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className="text-[13px] font-medium px-3.5 py-2 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: typeFilter === type ? "var(--color-accent)" : "var(--color-surface)",
                  color: typeFilter === type ? "#fff" : "var(--color-text-muted)",
                  border: `1px solid ${typeFilter === type ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 mb-5"
          style={{ backgroundColor: "var(--color-success-bg)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Total {typeFilter !== "All" ? typeFilter : ""} Expenses
          </p>
          <p className="text-[20px] font-semibold" style={{ color: "var(--color-success)" }}>
            ₹{total.toFixed(2)}
          </p>
        </div>

        {loading ? (
          <p className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
            Loading...
          </p>
        ) : expenses.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>No expenses found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl p-3.5"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
                    {e.expense_type}
                  </span>
                  <span className="text-[15px] font-semibold" style={{ color: "var(--color-accent)" }}>
                    ₹{e.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(e.expense_date).toLocaleDateString()}
                    {e.loads?.load_number ? ` · Load ${e.loads.load_number}` : " · Day-wise"}
                  </span>
                </div>
                {e.notes && (
                  <p className="text-[12px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                    {e.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}