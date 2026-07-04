"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";

export default function ResaleForm({ rejection, loadId }) {
  const router = useRouter();
  const supabase = createClient();

  const [buyers, setBuyers] = useState([]);
  const [buyerId, setBuyerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [resaleRate, setResaleRate] = useState("");
  const [resaleDate, setResaleDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBuyers = async () => {
      const { data } = await supabase.from("buyers").select("id, name, market_name").order("name");
      setBuyers(data || []);
    };
    loadBuyers();
  }, []);

  const maxQuantity = rejection.rejected_quantity;
  const qty = parseFloat(quantity) || 0;
  const rate = parseFloat(resaleRate) || 0;
  const resaleAmount = qty * rate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!buyerId) {
      setError("Please select a buyer.");
      return;
    }

    if (qty <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    if (qty > maxQuantity + 0.001) {
      setError(`Quantity (${qty} kg) exceeds the rejected quantity available (${maxQuantity} kg).`);
      return;
    }

    setLoading(true);

    // 1. Insert the resale record
    const { error: insertError } = await supabase.from("resales").insert({
      rejection_id: rejection.id,
      buyer_id: buyerId,
      quantity: qty,
      resale_rate: rate,
      resale_date: resaleDate,
      // resale_amount is DB-generated — never inserted from the app
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // 2. Flip the rejection's status to 'Resold'
    const { error: updateError } = await supabase
      .from("rejections")
      .update({ status: "Resold" })
      .eq("id", rejection.id);

    if (updateError) {
      setError(
        `Resale was saved, but updating the rejection status failed: ${updateError.message}`
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/dashboard/loads/${loadId}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Rejected quantity available
        </p>
        <p className="text-[18px] font-semibold" style={{ color: "var(--color-text)" }}>
          {maxQuantity} kg
        </p>
      </div>

      <Field label="Resell to buyer">
        <select
          required
          value={buyerId}
          onChange={(e) => setBuyerId(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
          style={{
            color: "var(--color-text)",
            backgroundColor: "var(--color-bg)",
            border: "1.5px solid var(--color-border)",
          }}
        >
          <option value="">Select buyer</option>
          {buyers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} {b.market_name ? `(${b.market_name})` : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Quantity (kg)">
        <TextInput
          type="number"
          inputMode="decimal"
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={`Up to ${maxQuantity} kg`}
        />
      </Field>

      <Field label="Resale rate (₹/kg)">
        <TextInput
          type="number"
          inputMode="decimal"
          required
          value={resaleRate}
          onChange={(e) => setResaleRate(e.target.value)}
          placeholder="Enter resale rate"
        />
        {qty > 0 && rate > 0 && (
          <p className="text-[12px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
            Resale amount: ₹{resaleAmount.toFixed(2)}
          </p>
        )}
      </Field>

      <Field label="Resale date">
        <input
          type="date"
          required
          value={resaleDate}
          onChange={(e) => setResaleDate(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
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
        Save Resale
      </PrimaryButton>
    </form>
  );
}