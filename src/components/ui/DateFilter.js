"use client";

import { useState, useEffect, useRef } from "react";
import { getDateRange } from "@/lib/dateRange";

const PRESETS = ["today", "yesterday", "week", "month", "custom"];

export default function DateFilter({ onRangeChange, defaultPreset = "today" }) {
  const [preset, setPreset] = useState(defaultPreset);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const btnRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    if (preset === "custom") {
      if (customFrom && customTo) {
        onRangeChange({ from: customFrom, to: customTo, preset });
      }
      return;
    }
    const range = getDateRange(preset);
    onRangeChange({ ...range, preset });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    const btn = btnRefs.current[preset];
    const container = containerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [preset]);

  return (
    <div className="space-y-2.5">
      <div
        ref={containerRef}
        className="flex gap-1 p-1 rounded-2xl relative"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="date-pill-indicator absolute top-1 bottom-1 rounded-xl"
          style={{
            backgroundColor: "var(--color-accent)",
            left: indicatorStyle.left ?? 0,
            width: indicatorStyle.width ?? 0,
            opacity: indicatorStyle.width ? 1 : 0,
          }}
        />
        {PRESETS.map((p) => (
          <button
            key={p}
            ref={(el) => (btnRefs.current[p] = el)}
            onClick={() => setPreset(p)}
            className="date-pill-btn flex-1 text-[12px] font-medium py-2 rounded-xl capitalize relative"
            style={{ color: preset === p ? "#fff" : "var(--color-text-muted)" }}
          >
            {p}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-2.5 custom-range-enter">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="input-base rounded-xl px-3 py-2.5 text-[13px] outline-none"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="input-base rounded-xl px-3 py-2.5 text-[13px] outline-none"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
          />
        </div>
      )}

      <style jsx>{`
        .date-pill-indicator {
          transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1), width 0.28s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.15s ease-out;
          z-index: 0;
        }
        .date-pill-btn {
          z-index: 1;
          transition: color 0.2s ease-out, transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .date-pill-btn:active {
          transform: scale(0.95);
        }
        .custom-range-enter {
          animation: dropIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes dropIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .date-pill-indicator,
          .date-pill-btn,
          .custom-range-enter {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}