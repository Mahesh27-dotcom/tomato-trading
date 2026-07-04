"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";

export default function RejectionForm({ sale, alreadyRejected }) {
  const router = useRouter();
  const supabase = createClient();

  const [rejectedQuantity, setRejectedQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rejectionDate, setRejectionDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        `Rejected quantity (${qty} kg) exceeds what's available to reject (${availableToReject} kg) on this sale.`
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

    setLoading(false);
    router.push(`/dashboard/loads/${sale.load_id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
      >
        <div>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Available to reject
          </p>
          <p
            className="text-[18px] font-semibold"
            style={{ color: remainingAfter < 0 ? "var(--color-danger)" : "var(--color-success)" }}
          >
            {availableToReject} kg
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            After this rejection
          </p>
          <p
            className="text-[16px] font-semibold"
            style={{ color: remainingAfter < 0 ? "var(--color-danger)" : "var(--color-text)" }}
          >
            {remainingAfter.toFixed(1)} kg
          </p>
        </div>
      </div>

      <Field label="Rejected quantity (kg)">
        <TextInput
          type="number"
          inputMode="decimal"
          required
          value={rejectedQuantity}
          onChange={(e) => setRejectedQuantity(e.target.value)}
          placeholder="Enter quantity rejected"
        />
        {qty > 0 && (
          <p className="text-[12px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
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
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
          style={{
            color: "var(--color-text)",
            backgroundColor: "var(--color-bg)",
            border: "1.5px solid var(--color-border)",
          }}
        />
      </Field>

      <Field label="Reason">
        <TextInput
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Quality issue, overripe"
        />
      </Field>

      <Field label="Remarks">
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Any additional remarks"
          rows={3}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none resize-none"
          style={{
            color: "var(--color-text)",
            backgroundColor: "var(--color-bg)",
            border: "1.5px solid var(--color-border)",
          }}
        />
      </Field>

      {error && (
        <p
          className="text-[13px] rounded-2xl px-4 py-3"
          style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          {error}
        </p>
      )}

      <PrimaryButton type="submit" loading={loading}>
        Save Rejection
      </PrimaryButton>
    </form>
  );
}