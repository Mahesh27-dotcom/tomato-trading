"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SearchButton from "@/components/ui/SearchButton";
import CountUp from "@/components/ui/CountUp";
import { haptic } from "@/lib/haptics";

export default function CashbookPage() {
  const router = useRouter();
  const supabase = createClient();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [openingBalanceSetting, setOpeningBalanceSetting] = useState(0);
  const [cashInEntries, setCashInEntries] = useState([]);
  const [cashOutEntries, setCashOutEntries] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingOpening, setEditingOpening] = useState(false);
  const [openingInput, setOpeningInput] = useState("");
  const [savingOpening, setSavingOpening] = useState(false);

  const loadCashbook = async () => {
    setLoading(true);

    const { data: settingRow } = await supabase.from("app_settings").select("value").eq("key", "cashbook_opening_balance").single();

    const baseOpening = parseFloat(settingRow?.value || 0);
    setOpeningBalanceSetting(baseOpening);

    const { data: dayIn } = await supabase.from("buyer_payments").select("*, buyers(name)").eq("payment_date", selectedDate);

    const { data: dayFarmerOut } = await supabase.from("farmer_payments").select("*, farmers(name)").eq("payment_date", selectedDate);

    const { data: dayExpenseOut } = await supabase.from("expenses").select("*").eq("expense_date", selectedDate);

    const { data: priorIn } = await supabase.from("buyer_payments").select("amount").lt("payment_date", selectedDate);

    const { data: priorFarmerOut } = await supabase.from("farmer_payments").select("amount").lt("payment_date", selectedDate);

    const { data: priorExpenseOut } = await supabase.from("expenses").select("amount").lt("expense_date", selectedDate);

    const priorInTotal = (priorIn || []).reduce((s, r) => s + parseFloat(r.amount), 0);
    const priorOutTotal =
      (priorFarmerOut || []).reduce((s, r) => s + parseFloat(r.amount), 0) +
      (priorExpenseOut || []).reduce((s, r) => s + parseFloat(r.amount), 0);

    setOpeningBalance(baseOpening + priorInTotal - priorOutTotal);

    const combinedOut = [
      ...(dayFarmerOut || []).map((p) => ({
        id: `farmer-${p.id}`,
        label: `Farmer payment · ${p.farmers?.name || ""}`,
        amount: parseFloat(p.amount),
      })),
      ...(dayExpenseOut || []).map((e) => ({
        id: `expense-${e.id}`,
        label: e.expense_type,
        amount: parseFloat(e.amount),
      })),
    ];

    setCashInEntries((dayIn || []).map((p) => ({ id: p.id, label: `Buyer payment · ${p.buyers?.name || ""}`, amount: parseFloat(p.amount) })));
    setCashOutEntries(combinedOut);
    setLoading(false);
  };

  useEffect(() => {
    loadCashbook();
  }, [selectedDate]);

  const totalCashIn = cashInEntries.reduce((s, e) => s + e.amount, 0);
  const totalCashOut = cashOutEntries.reduce((s, e) => s + e.amount, 0);
  const closingBalance = openingBalance + totalCashIn - totalCashOut;

  const handleSaveOpening = async () => {
    const val = parseFloat(openingInput);
    if (isNaN(val)) return;

    setSavingOpening(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("app_settings").update({ value: val.toString(), updated_by: user.id }).eq("key", "cashbook_opening_balance");

    haptic("success");
    setSavingOpening(false);
    setEditingOpening(false);
    await loadCashbook();
  };

  const changeDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <div
          className="flex items-center justify-between mb-5"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="back-btn text-[14px] font-medium inline-flex items-center gap-1"
            style={{ color: "var(--color-accent)" }}
          >
            <span className="back-arrow">←</span> Back to dashboard
          </button>
        </div>

        <div
          className="flex items-center justify-between mb-5"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.03s both" }}
        >
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--color-text)" }}>
            Cashbook
          </h1>
          <SearchButton />
        </div>

        <div
          className="flex items-center gap-2.5 mb-5"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both" }}
        >
          <button
            onClick={() => changeDay(-1)}
            className="day-nav-btn rounded-xl px-3.5 py-2.5 text-[16px]"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-base flex-1 rounded-xl px-4 py-2.5 text-[14px] outline-none form-field"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          />
          <button
            onClick={() => changeDay(1)}
            className="day-nav-btn rounded-xl px-3.5 py-2.5 text-[16px]"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton-block rounded-2xl" style={{ height: 90 }} />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="skeleton-block rounded-2xl" style={{ height: 66 }} />
              <div className="skeleton-block rounded-2xl" style={{ height: 66 }} />
            </div>
            <div className="skeleton-block rounded-2xl" style={{ height: 76 }} />
            <div className="skeleton-block rounded-2xl" style={{ height: 60 }} />
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl p-4 mb-5"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    Opening Balance
                  </p>
                  <p className="text-[18px] font-semibold">
                    <CountUp value={openingBalance} prefix="₹" />
                  </p>
                </div>
                {!editingOpening && (
                  <button
                    onClick={() => {
                      setOpeningInput(openingBalanceSetting.toString());
                      setEditingOpening(true);
                    }}
                    className="link-btn text-[12px] font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Edit starting balance
                  </button>
                )}
              </div>

              {editingOpening && (
                <div className="edit-panel flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <input
                    type="number"
                    value={openingInput}
                    onChange={(e) => setOpeningInput(e.target.value)}
                    placeholder="One-time starting cash"
                    className="input-base flex-1 rounded-xl px-3 py-2 text-[14px] outline-none form-field"
                    style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
                  />
                  <button
                    onClick={handleSaveOpening}
                    disabled={savingOpening}
                    className="save-btn text-white text-[13px] font-medium px-3.5 py-2 rounded-xl disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  >
                    {savingOpening ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingOpening(false)} className="link-btn text-[13px] font-medium px-2" style={{ color: "var(--color-text-muted)" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div
              className="grid grid-cols-2 gap-2.5 mb-5"
              style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both" }}
            >
              <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--color-success-bg)" }}>
                <p className="text-[11px] mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Cash In
                </p>
                <p className="text-[16px] font-semibold" style={{ color: "var(--color-success)" }}>
                  <CountUp value={totalCashIn} prefix="₹" />
                </p>
              </div>
              <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--color-danger-bg)" }}>
                <p className="text-[11px] mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Cash Out
                </p>
                <p className="text-[16px] font-semibold" style={{ color: "var(--color-danger)" }}>
                  <CountUp value={totalCashOut} prefix="₹" />
                </p>
              </div>
            </div>

            <div
              className="closing-card rounded-2xl p-4 mb-6"
              style={{ backgroundColor: "var(--color-text)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both" }}
            >
              <p className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                Closing Balance
              </p>
              <p className="text-[22px] font-semibold text-white">
                <CountUp value={closingBalance} prefix="₹" />
              </p>
            </div>

            <h2 className="text-[15px] font-semibold mb-2.5" style={{ color: "var(--color-text)" }}>
              Cash In ({cashInEntries.length})
            </h2>
            {cashInEntries.length === 0 ? (
              <p className="text-[13px] mb-5" style={{ color: "var(--color-text-muted)" }}>
                No cash in for this day.
              </p>
            ) : (
              <div className="space-y-2 mb-5">
                {cashInEntries.map((e, i) => (
                  <div
                    key={e.id}
                    className="entry-row rounded-xl px-3.5 py-3 flex items-center justify-between"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      animation: `fadeSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(0.2 + i * 0.03, 0.4)}s both`,
                    }}
                  >
                    <span className="text-[13px]" style={{ color: "var(--color-text)" }}>
                      {e.label}
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--color-success)" }}>
                      +₹{e.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-[15px] font-semibold mb-2.5" style={{ color: "var(--color-text)" }}>
              Cash Out ({cashOutEntries.length})
            </h2>
            {cashOutEntries.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                No cash out for this day.
              </p>
            ) : (
              <div className="space-y-2">
                {cashOutEntries.map((e, i) => (
                  <div
                    key={e.id}
                    className="entry-row rounded-xl px-3.5 py-3 flex items-center justify-between"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      animation: `fadeSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(0.2 + i * 0.03, 0.4)}s both`,
                    }}
                  >
                    <span className="text-[13px]" style={{ color: "var(--color-text)" }}>
                      {e.label}
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--color-danger)" }}>
                      -₹{e.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
        .skeleton-block {
          background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        .back-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out; }
        .back-btn:active { transform: scale(0.96); opacity: 0.7; }
        .back-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (hover: hover) { .back-btn:hover .back-arrow { transform: translateX(-3px); } }
        .day-nav-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease-out; }
        .day-nav-btn:active { transform: scale(0.9); }
        @media (hover: hover) { .day-nav-btn:hover { background-color: var(--color-bg); } }
        .form-field { transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out; }
        .form-field:focus { box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12); }
        .link-btn { transition: opacity 0.2s ease-out; }
        .link-btn:active { opacity: 0.6; }
        .save-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .save-btn:active { transform: scale(0.95); }
        .edit-panel { animation: fadeSlideIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .closing-card { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .entry-row { transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1); }
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