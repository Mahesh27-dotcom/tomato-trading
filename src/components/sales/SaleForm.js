"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";

function emptySaleLine() {
  return { key: crypto.randomUUID(), buyerId: "", quantity: "", rate: "" };
}

export default function SaleForm({ load, alreadySold }) {
  const router = useRouter();
  const supabase = createClient();

  const [buyers, setBuyers] = useState([]);
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([emptySaleLine()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBuyers = async () => {
      const { data } = await supabase.from("buyers").select("id, name, market_name").order("name");
      setBuyers(data || []);
    };
    loadBuyers();
  }, []);

  const remaining = load.total_quantity - alreadySold;

  const updateLine = (key, field, value) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((ls) => [...ls, emptySaleLine()]);

  const removeLine = (key) => {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  };

  const lineAmount = (l) => (parseFloat(l.quantity) || 0) * (parseFloat(l.rate) || 0);

  const totalNewQuantity = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0);
  const totalNewAmount = lines.reduce((sum, l) => sum + lineAmount(l), 0);
  const remainingAfter = remaining - totalNewQuantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validLines = lines.filter(
      (l) => l.buyerId && parseFloat(l.quantity) > 0 && parseFloat(l.rate) > 0
    );

    if (validLines.length === 0) {
      setError("Add at least one valid buyer, quantity, and rate.");
      return;
    }

    if (totalNewQuantity > remaining + 0.001) {
      setError(
        `Total quantity (${totalNewQuantity} kg) exceeds remaining unsold quantity (${remaining} kg) on this load.`
      );
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const saleRows = validLines.map((l) => ({
      load_id: load.id,
      buyer_id: l.buyerId,
      quantity_sold: parseFloat(l.quantity),
      sale_rate: parseFloat(l.rate),
      sale_date: saleDate,
      created_by: user.id,
      // sale_amount is DB-generated — never inserted from the app
    }));

    const { error: insertError } = await supabase.from("sales").insert(saleRows);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/dashboard/loads/${load.id}`);
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
            Remaining to sell
          </p>
          <p
            className="text-[18px] font-semibold"
            style={{ color: remainingAfter < 0 ? "var(--color-danger)" : "var(--color-success)" }}
          >
            {remaining} kg
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            After this sale
          </p>
          <p
            className="text-[16px] font-semibold"
            style={{ color: remainingAfter < 0 ? "var(--color-danger)" : "var(--color-text)" }}
          >
            {remainingAfter.toFixed(1)} kg
          </p>
        </div>
      </div>

      <Field label="Sale date">
        <input
          type="date"
          required
          value={saleDate}
          onChange={(e) => setSaleDate(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
          style={{
            color: "var(--color-text)",
            backgroundColor: "var(--color-bg)",
            border: "1.5px solid var(--color-border)",
          }}
        />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
            Sales
          </label>
          <button
            type="button"
            onClick={addLine}
            className="text-[13px] font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            + Add buyer
          </button>
        </div>

        <div className="space-y-2.5">
          {lines.map((line, idx) => (
            <div
              key={line.key}
              className="rounded-2xl p-3.5"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                  Sale {idx + 1}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="text-[12px] font-medium"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <select
                required
                value={line.buyerId}
                onChange={(e) => updateLine(line.key, "buyerId", e.target.value)}
                className="input-base w-full rounded-2xl px-4 py-3 text-[14px] outline-none mb-2.5"
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

              <div className="grid grid-cols-2 gap-2.5">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, "quantity", e.target.value)}
                  placeholder="Quantity (kg)"
                />
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={line.rate}
                  onChange={(e) => updateLine(line.key, "rate", e.target.value)}
                  placeholder="Rate (₹/kg)"
                />
              </div>
              <p className="text-[12px] mt-2" style={{ color: "var(--color-text-muted)" }}>
                Amount: ₹{lineAmount(line).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ backgroundColor: "var(--color-success-bg)" }}
      >
        <div>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            This sale — quantity
          </p>
          <p className="text-[16px] font-semibold" style={{ color: "var(--color-text)" }}>
            {totalNewQuantity.toFixed(1)} kg
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            This sale — amount
          </p>
          <p className="text-[18px] font-semibold" style={{ color: "var(--color-success)" }}>
            ₹{totalNewAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {error && (
        <p
          className="text-[13px] rounded-2xl px-4 py-3"
          style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          {error}
        </p>
      )}

      <PrimaryButton type="submit" loading={loading}>
        Save Sale
      </PrimaryButton>
    </form>
  );
}