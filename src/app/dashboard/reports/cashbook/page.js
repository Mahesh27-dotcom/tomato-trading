"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReportShell from "@/components/reports/ReportShell";

function getDatesBetween(from, to) {
  const dates = [];
  let current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

async function fetchCashbookReportData({ from, to }) {
  const supabase = createClient();

  const { data: settingRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "cashbook_opening_balance")
    .single();
  const baseOpening = parseFloat(settingRow?.value || 0);

  // Fetch everything up to `to` in one shot, then bucket by day in JS
  const [buyerPayRes, farmerPayRes, expensesRes] = await Promise.all([
    supabase.from("buyer_payments").select("amount, payment_date").lte("payment_date", to),
    supabase.from("farmer_payments").select("amount, payment_date").lte("payment_date", to),
    supabase.from("expenses").select("amount, expense_date").lte("expense_date", to),
  ]);

  const sum = (rows, field, dateField, date) =>
    (rows || [])
      .filter((r) => r[dateField] === date)
      .reduce((s, r) => s + parseFloat(r[field] || 0), 0);

  const sumBefore = (rows, field, dateField, date) =>
    (rows || [])
      .filter((r) => r[dateField] < date)
      .reduce((s, r) => s + parseFloat(r[field] || 0), 0);

  const dates = getDatesBetween(from, to);
  let runningOpening = null;

  return dates.map((date) => {
    const cashIn = sum(buyerPayRes.data, "amount", "payment_date", date);
    const cashOut =
      sum(farmerPayRes.data, "amount", "payment_date", date) +
      sum(expensesRes.data, "amount", "expense_date", date);

    const opening =
      runningOpening !== null
        ? runningOpening
        : baseOpening +
          sumBefore(buyerPayRes.data, "amount", "payment_date", date) -
          (sumBefore(farmerPayRes.data, "amount", "payment_date", date) +
            sumBefore(expensesRes.data, "amount", "expense_date", date));

    const closing = opening + cashIn - cashOut;
    runningOpening = closing;

    return { date, opening, cashIn, cashOut, closing };
  });
}

function CashbookReportPreview(rows) {
  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
        No data in this range.
      </p>
    );
  }

  const totalIn = rows.reduce((s, r) => s + r.cashIn, 0);
  const totalOut = rows.reduce((s, r) => s + r.cashOut, 0);
  const finalClosing = rows[rows.length - 1].closing;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Cash In</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-success)" }}>₹{totalIn.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Cash Out</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-danger)" }}>₹{totalOut.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Closing</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>₹{finalClosing.toFixed(0)}</p>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <span style={{ color: "var(--color-text)" }}>{r.date}</span>
            <span style={{ color: "var(--color-text-muted)" }}>
              +{r.cashIn.toFixed(0)} / -{r.cashOut.toFixed(0)} → ₹{r.closing.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function buildCashbookPdf(rows, range, title) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${range.from} to ${range.to}`, 14, 25);

  autoTable(doc, {
    startY: 32,
    head: [["Date", "Opening (₹)", "Cash In (₹)", "Cash Out (₹)", "Closing (₹)"]],
    body: rows.map((r) => [
      r.date,
      r.opening.toFixed(2),
      r.cashIn.toFixed(2),
      r.cashOut.toFixed(2),
      r.closing.toFixed(2),
    ]),
    headStyles: { fillColor: [193, 68, 14] },
    styles: { fontSize: 9 },
  });

  doc.save(`Cashbook_Report_${range.from}_to_${range.to}.pdf`);
}

async function buildCashbookExcel(rows, range, title) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cashbook Report");

  sheet.addRow([title]);
  sheet.addRow([`${range.from} to ${range.to}`]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(["Date", "Opening (₹)", "Cash In (₹)", "Cash Out (₹)", "Closing (₹)"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1440E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  rows.forEach((r) => sheet.addRow([r.date, r.opening, r.cashIn, r.cashOut, r.closing]));

  sheet.columns.forEach((col) => (col.width = 16));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cashbook_Report_${range.from}_to_${range.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CashbookReportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard/reports")}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to reports
        </button>

        <h1 className="text-[22px] font-semibold mb-6" style={{ color: "var(--color-text)" }}>
          Cashbook Report
        </h1>

        <ReportShell
          title="Cashbook Report"
          onFetchData={fetchCashbookReportData}
          renderPreview={CashbookReportPreview}
          buildPdf={buildCashbookPdf}
          buildExcel={buildCashbookExcel}
        />
      </div>
    </div>
  );
}