"use client";

import { useState, useRef, useEffect } from "react";

export default function BuyerSelect({ buyers, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selected = buyers.find((b) => b.id === value);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = buyers.filter((b) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || (b.market_name || "").toLowerCase().includes(q);
  });

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="buyer-select-btn w-full rounded-2xl px-4 py-3 text-[14px] outline-none text-left flex items-center justify-between"
        style={{ color: selected ? "var(--color-text)" : "var(--color-text-muted)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
      >
        {selected ? `${selected.name}${selected.market_name ? ` (${selected.market_name})` : ""}` : "Select buyer"}
        <span className="chevron" style={{ color: "var(--color-text-muted)", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div
          className="dropdown-panel absolute z-10 w-full mt-1.5 rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buyers..."
            className="w-full px-4 py-2.5 text-[13px] outline-none"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
          />
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p className="text-[13px] text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                No buyers match.
              </p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange(b.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="option-row w-full flex items-center gap-2.5 text-left px-4 py-2.5"
                  style={{ backgroundColor: value === b.id ? "var(--color-bg)" : "transparent" }}
                >
                  <div
                    className="shrink-0 rounded-full flex items-center justify-center"
                    style={{ width: 28, height: 28, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: "var(--color-accent)" }}>
                      {b.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate" style={{ color: "var(--color-text)" }}>
                      {b.name}
                    </p>
                    {b.market_name && (
                      <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>
                        {b.market_name}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .buyer-select-btn {
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
        }
        .buyer-select-btn:focus {
          box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12);
        }
        .chevron {
          display: inline-block;
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .dropdown-panel {
          animation: dropIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .option-row {
          transition: background-color 0.15s ease-out;
        }
        .option-row:hover {
          background-color: var(--color-bg);
        }
        @media (prefers-reduced-motion: reduce) {
          .buyer-select-btn, .chevron, .dropdown-panel, .option-row {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}