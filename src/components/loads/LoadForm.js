"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import UnitAwareAmountFields, { UnitPicker, isAmountValid, } from "@/components/UnitAwareAmountFields";
import { haptic } from "@/lib/haptics";

function emptyRateLine() {
  return { key: crypto.randomUUID(), quantity: "", rate: "", total: "" };
}

export default function LoadForm() {
  const router = useRouter();
  const supabase = createClient();

  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState("");
  const [loadDate, setLoadDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [unit, setUnit] = useState("crate");
  const [rateLines, setRateLines] = useState([emptyRateLine()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFarmers = async () => {
      const { data } = await supabase.from("farmers").select("id, name, village").order("name");
      setFarmers(data || []);
    };
    loadFarmers();
  }, []);

  const updateLineValues = (key, values) => {
    setRateLines((lines) => lines.map((l) => (l.key === key ? { ...l, ...values } : l)));
  };

  const addLine = () => {
    haptic("success");
    setRateLines((lines) => [...lines, emptyRateLine()]);
  };

  const removeLine = (key) => {
    setRateLines((lines) => (lines.length > 1 ? lines.filter((l) => l.key !== key) : lines));
  };

  const totalQuantity = rateLines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0);
  const totalAmount = rateLines.reduce((sum, l) => sum + (parseFloat(l.total) || 0), 0);
  const unitLabel = unit === "kg" ? "kg" : "crates";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!farmerId) {
      setError("Please select a farmer.");
      return;
    }

    const validLines = rateLines.filter((l) => isAmountValid(l));

    if (validLines.length === 0) {
      setError("Add at least one valid quantity, price, and total.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: newLoad, error: loadError } = await supabase
      .from("loads")
      .insert({
        load_date: loadDate,
        farmer_id: farmerId,
        vehicle_number: vehicleNumber,
        unit,
        total_quantity: totalQuantity,
        total_purchase_amount: totalAmount,
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    const rateRows = validLines.map((l) => ({
      load_id: newLoad.id,
      quantity: parseFloat(l.quantity),
      rate: parseFloat(l.rate),
      amount: parseFloat(l.total),
    }));

    const { error: ratesError } = await supabase.from("purchase_rates").insert(rateRows);

    if (ratesError) {
      setError(`Load was created (${newLoad.load_number}) but rate entries failed: ${ratesError.message}`);
      setLoading(false);
      return;
    }

    haptic("success");
    setLoading(false);
    router.push(`/dashboard/loads/${newLoad.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Farmer">
        <select
          required
          value={farmerId}
          onChange={(e) => setFarmerId(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        >
          <option value="">Select farmer</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} {f.village ? `(${f.village})` : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Load date">
        <input
          type="date"
          required
          value={loadDate}
          onChange={(e) => setLoadDate(e.target.value)}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        />
      </Field>

      <Field label="Vehicle number">
        <TextInput
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
          placeholder="e.g. KA01AB1234"
        />
      </Field>
      <UnitPicker unit={unit} onUnitChange={setUnit} editable={true} />

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
            Purchase rates
          </label>
          <button type="button" onClick={addLine} className="link-btn text-[13px] font-medium" style={{ color: "var(--color-accent)" }}>
            + Add rate
          </button>
        </div>

        <div className="space-y-2.5">
          {rateLines.map((line, idx) => (
            <div
              key={line.key}
              className="rate-line rounded-2xl p-3.5"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                animation: "popInLine 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                  Rate {idx + 1}
                </span>
                {rateLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="link-btn text-[12px] font-medium"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <UnitAwareAmountFields
                unit={unit}
                quantity={line.quantity}
                rate={line.rate}
                total={line.total}
                onChange={(values) => updateLineValues(line.key, values)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: "var(--color-success-bg)" }}>
        <div>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Total quantity</p>
          <p className="text-[16px] font-semibold" style={{ color: "var(--color-text)" }}>{totalQuantity.toFixed(1)} {unitLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Total amount</p>
          <p className="text-[18px] font-semibold" style={{ color: "var(--color-success)" }}>₹{totalAmount.toFixed(2)}</p>
        </div>
      </div>

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
        Save Load
      </PrimaryButton>

      <style jsx>{`
        .form-field { transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out; }
        .form-field:focus { box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12); }
        .link-btn { transition: opacity 0.2s ease-out; }
        .link-btn:active { opacity: 0.6; }
        .rate-line { transition: box-shadow 0.2s ease-out; }
        @keyframes popInLine {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .error-shake { animation: shake 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .form-field, .rate-line, .error-shake { animation-duration: 0.001s !important; transition-duration: 0.001s !important; }
        }
      `}</style>
    </form>
  );
}