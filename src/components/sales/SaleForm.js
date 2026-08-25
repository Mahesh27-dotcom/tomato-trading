"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import BuyerSelect from "@/components/sales/BuyerSelect";
import UnitAwareAmountFields, { UnitPicker, isAmountValid } from "@/components/UnitAwareAmountFields";
import { haptic } from "@/lib/haptics";

function emptySaleLine() {
  return { key: crypto.randomUUID(), buyerId: "", quantity: "", rate: "", total: "" };
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
  const unitLabel = load.unit === "kg" ? "kg" : "crates";

  const updateLineValues = (key, values) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...values } : l)));
  };

  const addLine = () => {
    haptic("success");
    setLines((ls) => [...ls, emptySaleLine()]);
  };

  const removeLine = (key) => {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  };

  const totalNewQuantity = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0);
  const totalNewAmount = lines.reduce((sum, l) => sum + (parseFloat(l.total) || 0), 0);
  const remainingAfter = remaining - totalNewQuantity;
  const overLimit = remainingAfter < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validLines = lines.filter((l) => l.buyerId && isAmountValid(l));

    if (validLines.length === 0) {
      setError("Add at least one valid buyer, quantity, price, and total.");
      return;
    }

    if (totalNewQuantity > remaining + 0.001) {
      setError(`Total quantity (${totalNewQuantity} ${unitLabel}) exceeds remaining unsold quantity (${remaining} ${unitLabel}) on this load.`);
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
      sale_amount: parseFloat(l.total),
      sale_date: saleDate,
      created_by: user.id,
    }));

    const { error: insertError } = await supabase.from("sales").insert(saleRows);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    haptic("success");
    setLoading(false);
    router.push(`/dashboard/loads/${load.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section: Remaining stock */}
      <div>
        <SectionLabel>Stock Status</SectionLabel>
        <div
          className="live-card rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
        >
          <div>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Remaining to sell
            </p>
            <p className="text-[18px] font-semibold" style={{ color: "var(--color-success)" }}>
              {remaining} {unitLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              After this sale
            </p>
            <p
              className="text-[16px] font-semibold live-value"
              style={{ color: overLimit ? "var(--color-danger)" : "var(--color-text)" }}
            >
              {remainingAfter.toFixed(1)} {unitLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Section: Sale details */}
      <div>
        <SectionLabel>Sale Details</SectionLabel>
        <Field label="Sale date">
          <input
            type="date"
            required
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none form-field"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
          />
        </Field>
      </div>

      {/* Section: Buyers & quantities */}
      <div>
        <div className="mb-2.5">
          <UnitPicker unit={load.unit} editable={false} />
        </div>
        <div className="flex items-center justify-between mb-2.5">
          <SectionLabel noMargin>Buyers & Quantities</SectionLabel>
          <button type="button" onClick={addLine} className="link-btn text-[13px] font-medium" style={{ color: "var(--color-accent)" }}>
            + Add buyer
          </button>
        </div>

        <div className="space-y-2.5">
          {lines.map((line, idx) => (
            <div
              key={line.key}
              className="sale-line rounded-2xl p-3.5"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", animation: "popInLine 0.25s cubic-bezier(0.22, 1, 0.36, 1) both" }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                  Sale {idx + 1}
                </span>
                {lines.length > 1 && (
                  <button type="button" onClick={() => removeLine(line.key)} className="link-btn text-[12px] font-medium" style={{ color: "var(--color-danger)" }}>
                    Remove
                  </button>
                )}
              </div>

              <div className="mb-2.5">
                <BuyerSelect buyers={buyers} value={line.buyerId} onChange={(id) => updateLineValues(line.key, { buyerId: id })} />
              </div>

              <UnitAwareAmountFields
                unit={load.unit}
                quantity={line.quantity}
                rate={line.rate}
                total={line.total}
                onChange={(values) => updateLineValues(line.key, values)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section: Totals */}
      <div>
        <SectionLabel>Summary</SectionLabel>
        <div
          className="live-card rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: "var(--color-success-bg)" }}
        >
          <div>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              This sale — quantity
            </p>
            <p className="text-[16px] font-semibold live-value" style={{ color: "var(--color-text)" }}>
              {totalNewQuantity.toFixed(1)} {unitLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              This sale — amount
            </p>
            <p className="text-[18px] font-semibold live-value" style={{ color: "var(--color-success)" }}>
              ₹{totalNewAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[13px] rounded-2xl px-4 py-3 error-shake" style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <PrimaryButton type="submit" loading={loading}>
        Save Sale
      </PrimaryButton>

      <style jsx>{`
        .form-field {
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
        }
        .form-field:focus {
          box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12);
        }
        .link-btn {
          transition: opacity 0.2s ease-out;
        }
        .link-btn:active {
          opacity: 0.6;
        }
        .live-value {
          transition: color 0.2s ease-out;
        }
        .live-card {
          transition: box-shadow 0.2s ease-out;
        }
        @keyframes popInLine {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
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
          .form-field, .sale-line, .error-shake, .live-value {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </form>
  );
}

function SectionLabel({ children, noMargin }) {
  return (
    <h3
      className={`text-[12px] font-semibold uppercase tracking-wide ${noMargin ? "" : "mb-2.5"}`}
      style={{ color: "var(--color-text-muted)" }}
    >
      {children}
    </h3>
  );
}