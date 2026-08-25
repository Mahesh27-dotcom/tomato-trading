"use client";

import { useState, useEffect, useRef } from "react";
import TextInput from "@/components/ui/TextInput";

const UNITS = ["crate", "kg"];
const UNIT_LABELS = {
  crate: { plural: "Crates", singular: "Crate" },
  kg: { plural: "Kg", singular: "Kg" },
};

const toNumber = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n) => (n === null ? null : Math.round(n * 100) / 100);

/**
 * The sliding unit pill (Crates/Kg), rendered ONCE per form.
 * - editable=true: Load Create (and Load Edit, only when no Sales/Resales
 *   are linked yet)
 * - editable=false: everywhere else — Sale, Resale forms, and Load Edit
 *   once transactions exist against it (permanently locked)
 */
export function UnitPicker({ unit, onUnitChange, editable = true }) {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const btnRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    const btn = btnRefs.current[unit];
    const container = containerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [unit]);

  const unitLabel = UNIT_LABELS[unit]?.plural || "Units";
  const labelClass = "block text-[13px] font-medium mb-1.5";
  const labelStyle = { color: "var(--color-text-muted)" };

  if (!editable) {
    return (
      <div
        className="rounded-2xl px-4 py-3 text-[14px]"
        style={{
          backgroundColor: "var(--color-bg)",
          border: "1.5px solid var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        Unit:{" "}
        <span className="font-medium" style={{ color: "var(--color-text)" }}>
          {unitLabel}
        </span>{" "}
        <span className="text-[12px]">(locked)</span>
      </div>
    );
  }

  return (
    <div>
      <label className={labelClass} style={labelStyle}>
        Unit
      </label>
      <div
        ref={containerRef}
        className="flex gap-1 p-1 rounded-2xl relative"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="unit-pill-indicator absolute top-1 bottom-1 rounded-xl"
          style={{
            backgroundColor: "var(--color-accent)",
            left: indicatorStyle.left ?? 0,
            width: indicatorStyle.width ?? 0,
            opacity: indicatorStyle.width ? 1 : 0,
          }}
        />
        {UNITS.map((u) => (
          <button
            key={u}
            type="button"
            ref={(el) => (btnRefs.current[u] = el)}
            onClick={() => onUnitChange(u)}
            className="unit-pill-btn flex-1 text-[14px] font-medium py-2.5 rounded-xl relative"
            style={{ color: unit === u ? "#fff" : "var(--color-text-muted)" }}
          >
            {UNIT_LABELS[u].plural}
          </button>
        ))}
      </div>
      <style jsx>{`
        .unit-pill-indicator {
          transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1), width 0.28s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.15s ease-out;
          z-index: 0;
        }
        .unit-pill-btn {
          z-index: 1;
          transition: color 0.2s ease-out, transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .unit-pill-btn:active {
          transform: scale(0.95);
        }
        @media (prefers-reduced-motion: reduce) {
          .unit-pill-indicator,
          .unit-pill-btn {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Quantity + Price + Total trio with bidirectional calculation and the
 * "driving field" highlight. Rendered once per rate line (Load can have
 * several; Sale/Resale typically have one, but the shape is the same).
 * `unit` is read-only here — purely for labels — since unit selection
 * lives in <UnitPicker /> at the form level, not per line.
 */
export default function UnitAwareAmountFields({ unit, quantity, rate, total, onChange }) {
  const [drivingField, setDrivingField] = useState("rate"); // 'rate' | 'total'
  const [touched, setTouched] = useState({ quantity: false, rate: false, total: false });

  const unitLabel = UNIT_LABELS[unit]?.plural || "Units";
  const unitSingular = UNIT_LABELS[unit]?.singular || "Unit";

  const handleQuantityChange = (e) => {
    const newQuantity = e.target.value;
    const qtyNum = toNumber(newQuantity);

    let newRate = rate;
    let newTotal = total;

    if (qtyNum !== null && qtyNum > 0) {
      if (drivingField === "rate") {
        const rateNum = toNumber(rate);
        if (rateNum !== null) newTotal = String(round2(qtyNum * rateNum));
      } else {
        const totalNum = toNumber(total);
        if (totalNum !== null) newRate = String(round2(totalNum / qtyNum));
      }
    }

    onChange({ quantity: newQuantity, rate: newRate, total: newTotal });
  };

  const handleRateChange = (e) => {
    const newRate = e.target.value;
    setDrivingField("rate");

    const rateNum = toNumber(newRate);
    const qtyNum = toNumber(quantity);
    const newTotal =
      qtyNum !== null && rateNum !== null ? String(round2(qtyNum * rateNum)) : total;

    onChange({ quantity, rate: newRate, total: newTotal });
  };

  const handleTotalChange = (e) => {
    const newTotal = e.target.value;
    setDrivingField("total");

    const totalNum = toNumber(newTotal);
    const qtyNum = toNumber(quantity);
    const newRate =
      qtyNum !== null && qtyNum > 0 && totalNum !== null
        ? String(round2(totalNum / qtyNum))
        : rate;

    onChange({ quantity, rate: newRate, total: newTotal });
  };

  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const qtyNum = toNumber(quantity);
  const rateNum = toNumber(rate);
  const totalNum = toNumber(total);

  const quantityError =
    touched.quantity && (qtyNum === null || qtyNum <= 0) ? "Quantity must be greater than 0" : null;
  const rateError =
    touched.rate && (rateNum === null || rateNum < 0) ? "Price cannot be negative" : null;
  const totalError =
    touched.total && (totalNum === null || totalNum < 0) ? "Total cannot be negative" : null;

  const labelClass = "block text-[13px] font-medium mb-1.5 flex items-center gap-1.5";
  const labelStyle = { color: "var(--color-text-muted)" };
  const errorStyle = { color: "#B3261E" };

  const isRateDriving = drivingField === "rate";
  const isTotalDriving = drivingField === "total";

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass} style={labelStyle}>
          Quantity ({unitLabel})
        </label>
        <TextInput
          inputMode="decimal"
          value={quantity ?? ""}
          onChange={handleQuantityChange}
          onBlur={() => markTouched("quantity")}
          placeholder="0"
        />
        {quantityError && (
          <p className="text-[12px] mt-1" style={errorStyle}>
            {quantityError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelClass} style={labelStyle}>
            Price/{unitSingular}
            {isRateDriving && <span className="manual-badge">Manual</span>}
          </label>
          <div className="driving-wrap" style={{ boxShadow: isRateDriving ? "0 0 0 2px rgba(193,68,14,0.18)" : "none" }}>
            <TextInput
              inputMode="decimal"
              value={rate ?? ""}
              onChange={handleRateChange}
              onBlur={() => markTouched("rate")}
              placeholder="0.00"
            />
          </div>
          {rateError && (
            <p className="text-[12px] mt-1" style={errorStyle}>
              {rateError}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>
            Total
            {isTotalDriving && <span className="manual-badge">Manual</span>}
          </label>
          <div className="driving-wrap" style={{ boxShadow: isTotalDriving ? "0 0 0 2px rgba(193,68,14,0.18)" : "none" }}>
            <TextInput
              inputMode="decimal"
              value={total ?? ""}
              onChange={handleTotalChange}
              onBlur={() => markTouched("total")}
              placeholder="0.00"
            />
          </div>
          {totalError && (
            <p className="text-[12px] mt-1" style={errorStyle}>
              {totalError}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .driving-wrap {
          border-radius: 1rem;
          transition: box-shadow 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .manual-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 999px;
          background-color: rgba(193, 68, 14, 0.12);
          color: var(--color-accent);
          animation: badgeIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes badgeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .driving-wrap,
          .manual-badge {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}

export function isAmountValid({ quantity, rate, total }) {
  const q = toNumber(quantity);
  const r = toNumber(rate);
  const t = toNumber(total);
  return q !== null && q > 0 && r !== null && r >= 0 && t !== null && t >= 0;
}