"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/Shell";
import { getDateRange } from "@/lib/dateRange";
import { haptic } from "@/lib/haptics";

export default function ReportShell({ title, onFetchData, renderPreview, buildPdf, buildExcel }) {
  const [preset, setPreset] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);

  const activeRange =
    preset === "custom" && customFrom && customTo
      ? { from: customFrom, to: customTo }
      : getDateRange(preset === "custom" ? "today" : preset);

  const handleGenerate = async () => {
    setLoading(true);
    const data = await onFetchData(activeRange);
    setRows(data);
    setLoading(false);
  };

  const handleExportPdf = async () => {
    if (!rows) return;
    setExporting("pdf");
    await buildPdf(rows, activeRange, title);
    haptic("success");
    setExporting(null);
  };

  const handleExportExcel = async () => {
    if (!rows) return;
    setExporting("excel");
    await buildExcel(rows, activeRange, title);
    haptic("success");
    setExporting(null);
  };

  return (
    <div className="space-y-5">
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {["today", "yesterday", "week", "month", "custom"].map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className="preset-btn flex-1 text-[12px] font-medium py-2 rounded-xl capitalize"
            style={{
              backgroundColor: preset === p ? "var(--color-accent)" : "transparent",
              color: preset === p ? "#fff" : "var(--color-text-muted)",
            }}
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
            className="input-base rounded-xl px-3 py-2.5 text-[13px] outline-none form-field"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="input-base rounded-xl px-3 py-2.5 text-[13px] outline-none form-field"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
          />
        </div>
      )}

      <PrimaryButton onClick={handleGenerate} loading={loading}>
        Generate Report
      </PrimaryButton>

      {rows && (
        <div className="result-enter">
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {renderPreview(rows)}
          </div>

          <div className="flex gap-2.5 mt-5">
            <button
              onClick={handleExportPdf}
              disabled={exporting !== null}
              className="export-btn flex-1 rounded-2xl py-3.5 font-medium text-[14px] disabled:opacity-50"
              style={{ backgroundColor: "var(--color-text)", color: "#fff" }}
            >
              {exporting === "pdf" ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting !== null}
              className="export-btn flex-1 rounded-2xl py-3.5 font-medium text-[14px] disabled:opacity-50"
              style={{ backgroundColor: "var(--color-success)", color: "#fff" }}
            >
              {exporting === "excel" ? "Generating..." : "Download Excel"}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .preset-btn {
          transition: background-color 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .preset-btn:active {
          transform: scale(0.95);
        }
        .form-field {
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
        }
        .form-field:focus {
          box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12);
        }
        .custom-range-enter {
          animation: dropIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .result-enter {
          animation: fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .export-btn {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .export-btn:active {
          transform: scale(0.96);
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .preset-btn, .form-field, .custom-range-enter, .result-enter, .export-btn {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}