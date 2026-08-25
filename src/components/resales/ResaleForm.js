"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import UnitAwareAmountFields, { UnitPicker, isAmountValid } from "@/components/UnitAwareAmountFields";
import { haptic } from "@/lib/haptics";

export default function ResaleForm({ rejection, loadId }) {
  const router = useRouter();
  const supabase = createClient();

  const [buyers, setBuyers] = useState([]);
  const [buyerId, setBuyerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [resaleRate, setResaleRate] = useState("");
  const [total, setTotal] = useState("");
  const [resaleDate, setResaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [unit, setUnit] = useState("crate");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBuyers = async () => {
      const { data } = await supabase.from("buyers").select("id, name, market_name").order("name");
      setBuyers(data || []);
    };
    loadBuyers();
  }, []);

  const [alreadyResold, setAlreadyResold] = useState(0);

  useEffect(() => {
    const loadUnit = async () => {
      const { data } = await supabase.from("loads").select("unit").eq("id", loadId).single();
      if (data?.unit) setUnit(data.unit);
    };
    loadUnit();
  }, [loadId]);

  useEffect(() => {
    const loadExistingResales = async () => {
      const { data } = await supabase.from("resales").select("quantity").eq("rejection_id", rejection.id);
      const total = (data || []).reduce((sum, r) => sum + parseFloat(r.quantity || 0), 0);
      setAlreadyResold(total);
    };
    loadExistingResales();
  }, [rejection.id]);

  const maxQuantity = rejection.rejected_quantity - alreadyResold;
  const unitLabel = unit === "kg" ? "kg" : "crates";
  const qty = parseFloat(quantity) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!buyerId) {
      setError("Please select a buyer.");
      return;
    }

    if (!isAmountValid({ quantity, rate: resaleRate, total })) {
      setError("Enter a valid quantity, rate, and total.");
      return;
    }

    if (qty > maxQuantity + 0.001) {
      setError(`Quantity (${qty} ${unitLabel}) exceeds the rejected quantity available (${maxQuantity} ${unitLabel}).`);
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from("resales").insert({
      rejection_id: rejection.id,
      buyer_id: buyerId,
      quantity: qty,
      resale_rate: parseFloat(resaleRate) || 0,
      resale_amount: parseFloat(total) || 0,
      resale_date: resaleDate,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Only flip to "Resold" once the cumulative resold quantity covers the
    // full rejected quantity — partial resales must leave it "Pending Resale"
    // so the remaining amount can still be resold later.
    const totalResold = alreadyResold + qty;
    const isFullyResold = totalResold >= rejection.rejected_quantity - 0.001;

    if (isFullyResold) {
      const { error: updateError } = await supabase.from("rejections").update({ status: "Resold" }).eq("id", rejection.id);

      if (updateError) {
        setError(`Resale was saved, but updating the rejection status failed: ${updateError.message}`);
        setLoading(false);
        return;
      }
    }

    haptic("success");
    setLoading(false);
    router.push(`/dashboard/loads/${loadId}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
        <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Remaining available to resell
        </p>
        <p className="text-[18px] font-semibold" style={{ color: "var(--color-text)" }}>
          {maxQuantity} {unitLabel}
        </p>
        {alreadyResold > 0 && (
          <p className="text-[12px] mt-1" style={{ color: "var(--color-text-muted)" }}>
            {alreadyResold} {unitLabel} already resold · {rejection.rejected_quantity} {unitLabel} originally rejected
          </p>
        )}
      </div>

      <Field label="Resell to buyer">
        <select
          required
          value={buyerId}
          onChange={(e) => setBuyerId(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        >
          <option value="">Select buyer</option>
          {buyers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} {b.market_name ? `(${b.market_name})` : ""}
            </option>
          ))}
        </select>
      </Field>

      <div className="mb-1">
        <UnitPicker unit={unit} editable={false} />
      </div>

      <UnitAwareAmountFields
        unit={unit}
        quantity={quantity}
        rate={resaleRate}
        total={total}
        onChange={(values) => {
          setQuantity(values.quantity);
          setResaleRate(values.rate);
          setTotal(values.total);
        }}
      />

      <Field label="Resale date">
        <input
          type="date"
          required
          value={resaleDate}
          onChange={(e) => setResaleDate(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
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
        Save Resale
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