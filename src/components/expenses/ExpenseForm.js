"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import { haptic } from "@/lib/haptics";

const EXPENSE_TYPES = ["Transportation", "Labour", "Loading", "Unloading", "Diesel", "Other"];

export default function ExpenseForm({ defaultLoadId = null, onSaved }) {
  const router = useRouter();
  const supabase = createClient();

  const [loads, setLoads] = useState([]);
  const [expenseType, setExpenseType] = useState(EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loadId, setLoadId] = useState(defaultLoadId || "");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showLoadPicker = defaultLoadId === null;

  useEffect(() => {
    if (!showLoadPicker) return;
    const loadLoads = async () => {
      const { data } = await supabase.from("loads").select("id, load_number").order("load_date", { ascending: false }).limit(100);
      setLoads(data || []);
    };
    loadLoads();
  }, [showLoadPicker]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("expenses").insert({
      expense_type: expenseType,
      amount: amt,
      expense_date: expenseDate,
      load_id: loadId || null,
      notes,
      created_by: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    haptic("success");
    setLoading(false);

    if (onSaved) {
      onSaved();
    } else {
      router.push("/dashboard/expenses");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Expense type">
        <select
          required
          value={expenseType}
          onChange={(e) => setExpenseType(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        >
          {EXPENSE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Amount (₹)">
        <TextInput type="number" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
      </Field>

      <Field label="Expense date">
        <input
          type="date"
          required
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        />
      </Field>

      {showLoadPicker && (
        <Field label="Link to a load (optional)">
          <select
            value={loadId}
            onChange={(e) => setLoadId(e.target.value)}
            className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
          >
            <option value="">None (day-wise expense)</option>
            {loads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.load_number}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes"
          rows={3}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none resize-none form-field"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        />
      </Field>

      {error && (
        <p
          className="text-[13px] rounded-2xl px-4 py-3 error-shake"
          style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          {error}
        </p>
      )}

      <PrimaryButton type="submit" loading={loading}>
        Save Expense
      </PrimaryButton>

      <style jsx>{`
        .form-field {
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
        }
        .form-field:focus {
          box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12);
        }
        .error-shake {
          animation: shake 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .form-field, .error-shake {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </form>
  );
}