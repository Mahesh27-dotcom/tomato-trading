"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import UnitAwareAmountFields, { UnitPicker, isAmountValid } from "@/components/UnitAwareAmountFields";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/components/ui/Toast";

function emptyRateLine() {
  return { key: crypto.randomUUID(), id: null, quantity: "", rate: "", total: "" };
}

export default function EditLoadPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const showToast = useToast();

  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState("");
  const [loadDate, setLoadDate] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [unit, setUnit] = useState("crate");
  const [rateLines, setRateLines] = useState([emptyRateLine()]);
  const [removedLineIds, setRemovedLineIds] = useState([]);
  const [unitLocked, setUnitLocked] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEverything = async () => {
      const { data: farmersData } = await supabase.from("farmers").select("id, name, village").order("name");
      setFarmers(farmersData || []);

      const { data: loadData, error: loadError } = await supabase
        .from("loads")
        .select("*")
        .eq("id", params.id)
        .single();

      if (loadError || !loadData) {
        setError("Load not found.");
        setPageLoading(false);
        return;
      }

      const { data: rateData } = await supabase
        .from("purchase_rates")
        .select("*")
        .eq("load_id", params.id)
        .order("created_at");

      const { count: salesCount } = await supabase
        .from("sales")
        .select("*", { count: "exact", head: true })
        .eq("load_id", params.id);

      setFarmerId(loadData.farmer_id);
      setLoadDate(loadData.load_date);
      setVehicleNumber(loadData.vehicle_number || "");
      setNotes(loadData.notes || "");
      setUnit(loadData.unit || "crate");
      setUnitLocked((salesCount || 0) > 0);

      const existingLines = (rateData || []).map((r) => ({
        key: r.id,
        id: r.id,
        quantity: String(r.quantity),
        rate: String(r.rate),
        total: String(r.amount),
      }));

      setRateLines(existingLines.length > 0 ? existingLines : [emptyRateLine()]);
      setPageLoading(false);
    };

    loadEverything();
  }, [params.id]);

  const updateLineValues = (key, values) => {
    setRateLines((lines) => lines.map((l) => (l.key === key ? { ...l, ...values } : l)));
  };

  const addLine = () => {
    haptic("success");
    setRateLines((lines) => [...lines, emptyRateLine()]);
  };

  const removeLine = (key) => {
    setRateLines((lines) => {
      if (lines.length <= 1) return lines;
      const line = lines.find((l) => l.key === key);
      if (line?.id) {
        setRemovedLineIds((ids) => [...ids, line.id]);
      }
      return lines.filter((l) => l.key !== key);
    });
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

    const { error: loadError } = await supabase
      .from("loads")
      .update({
        farmer_id: farmerId,
        load_date: loadDate,
        vehicle_number: vehicleNumber,
        unit,
        total_quantity: totalQuantity,
        total_purchase_amount: totalAmount,
        notes,
      })
      .eq("id", params.id);

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    if (removedLineIds.length > 0) {
      const { error: deleteError } = await supabase.from("purchase_rates").delete().in("id", removedLineIds);
      if (deleteError) {
        setError(deleteError.message);
        setLoading(false);
        return;
      }
    }

    const linesToUpdate = validLines.filter((l) => l.id);
    const linesToInsert = validLines.filter((l) => !l.id);

    for (const l of linesToUpdate) {
      const { error: updateError } = await supabase
        .from("purchase_rates")
        .update({
          quantity: parseFloat(l.quantity),
          rate: parseFloat(l.rate),
          amount: parseFloat(l.total),
        })
        .eq("id", l.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    }

    if (linesToInsert.length > 0) {
      const insertRows = linesToInsert.map((l) => ({
        load_id: params.id,
        quantity: parseFloat(l.quantity),
        rate: parseFloat(l.rate),
        amount: parseFloat(l.total),
      }));

      const { error: insertError } = await supabase.from("purchase_rates").insert(insertRows);
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    haptic("success");
    setLoading(false);
    showToast("Load updated");
    router.push(`/dashboard/loads/${params.id}`);
    router.refresh();
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-md mx-auto px-4 py-6 space-y-3">
          <div className="skeleton-block rounded-2xl" style={{ height: 20, width: 120 }} />
          <div className="skeleton-block rounded-2xl" style={{ height: 300, marginTop: 16 }} />
        </div>
        <style jsx global>{`
          @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
          .skeleton-block {
            background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push(`/dashboard/loads/${params.id}`)}
          className="back-btn text-[14px] font-medium mb-5 inline-flex items-center gap-1"
          style={{ color: "var(--color-accent)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <span className="back-arrow">←</span> Back to load
        </button>

        <h1
          className="text-[22px] font-semibold mb-6"
          style={{ color: "var(--color-text)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both" }}
        >
          Edit Load
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}>
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

          <div>
            <UnitPicker unit={unit} onUnitChange={setUnit} editable={!unitLocked} />
            {unitLocked && (
              <p className="text-[12px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                Unit is locked because this load already has sales recorded against it.
              </p>
            )}
          </div>

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
            Save Changes
          </PrimaryButton>
        </form>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes popInLine {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .form-field { transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out; }
        .form-field:focus { box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12); }
        .link-btn { transition: opacity 0.2s ease-out; }
        .link-btn:active { opacity: 0.6; }
        .rate-line { transition: box-shadow 0.2s ease-out; }
        .back-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out; }
        .back-btn:active { transform: scale(0.96); opacity: 0.7; }
        .back-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (hover: hover) { .back-btn:hover .back-arrow { transform: translateX(-3px); } }
        .error-shake { animation: shake 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001s !important;
            animation-delay: 0s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}