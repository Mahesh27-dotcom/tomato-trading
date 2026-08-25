"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import { haptic } from "@/lib/haptics";

export default function RejectionForm({ sale, alreadyRejected }) {
  const router = useRouter();
  const supabase = createClient();

  const [rejectedQuantity, setRejectedQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rejectionDate, setRejectionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [unit, setUnit] = useState("crate");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUnit = async () => {
      const { data } = await supabase.from("loads").select("unit").eq("id", sale.load_id).single();
      if (data?.unit) setUnit(data.unit);
    };
    loadUnit();
  }, [sale.load_id]);

  const unitLabel = unit === "kg" ? "kg" : "crates";
  const availableToReject = sale.quantity_sold - alreadyRejected;
  const qty = parseFloat(rejectedQuantity) || 0;
  const rejectedValue = qty * sale.sale_rate;
  const remainingAfter = availableToReject - qty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (qty <= 0) {
      setError("Enter a valid rejected quantity.");
      return;
    }

    if (qty > availableToReject + 0.001) {
      setError(
        `Rejected quantity (${qty} ${unitLabel}) exceeds what's available to reject (${availableToReject} ${unitLabel}) on this sale.`
      );
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from("rejections").insert({
      sale_id: sale.id,
      rejected_quantity: qty,
      reason,
      remarks,
      rejection_date: rejectionDate,
      status: "Pending Resale",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    haptic("warning");
    setLoading(false);
    router.push(`/dashboard/loads/${sale.load_id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="live-card rounded-2xl p-4 flex items-center justify-between"
        style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
      >
        <div>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Available to reject
          </p>
          <p className="text-[18px] font-semibold" style={{ color: "var(--color-success)" }}>
            {availableToReject} {unitLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            After this rejection
          </p>
          <p
            className="text-[16px] font-semibold live-value"
            style={{ color: remainingAfter < 0 ? "var(--color-danger)" : "var(--color-text)" }}
          >
            {remainingAfter.toFixed(1)} {unitLabel}
          </p>
        </div>
      </div>

      <Field label={`Rejected quantity (${unitLabel})`}>
        <TextInput
          type="number"
          inputMode="decimal"
          required
          value={rejectedQuantity}
          onChange={(e) => setRejectedQuantity(e.target.value)}
          placeholder="Enter quantity rejected"
        />
        {qty > 0 && (
          <p className="text-[12px] mt-1.5 live-value" style={{ color: "var(--color-text-muted)" }}>
            Rejected value: ₹{rejectedValue.toFixed(2)}
          </p>
        )}
      </Field>

      <Field label="Rejection date">
        <input
          type="date"
          required
          value={rejectionDate}
          onChange={(e) => setRejectionDate(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        />
      </Field>

      <Field label="Reason">
        <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Quality issue, overripe" />
      </Field>

      <Field label="Remarks">
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Any additional remarks"
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
        Save Rejection
      </PrimaryButton>

      <style jsx>{`
        .form-field {
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
        }
        .form-field:focus {
          box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12);
        }
        .live-value {
          transition: color 0.2s ease-out;
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
          .form-field, .error-shake, .live-value {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </form>
  );
}