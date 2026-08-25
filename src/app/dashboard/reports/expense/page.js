"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReportShell from "@/components/reports/ReportShell";

async function fetchExpenseReportData({ from, to }) {
  const supabase = createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("expense_type, amount, expense_date, notes, loads(load_number)")
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: false });

  return (expenses || []).map((e) => ({
    date: e.expense_date,
    type: e.expense_type,
    amount: parseFloat(e.amount || 0),
    load: e.loads?.load_number || "Day-wise",
    notes: e.notes || "",
  }));
}

function ExpenseReportPreview(rows) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byType = {};
  rows.forEach((r) => {
    byType[r.type] = (byType[r.type] || 0) + r.amount;
  });

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
        No expenses in this range.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Total Expenses</p>
        <p className="text-[18px] font-semibold" style={{ color: "var(--color-danger)" }}>₹{total.toFixed(2)}</p>
      </div>
      <div className="space-y-1.5 mb-3">
        {Object.entries(byType).map(([type, amt]) => (
          <div key={type} className="flex items-center justify-between text-[12px]">
            <span style={{ color: "var(--color-text-muted)" }}>{type}</span>
            <span style={{ color: "var(--color-text)" }}>₹{amt.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function buildExpensePdf(rows, range, title) {
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
    head: [["Date", "Type", "Load", "Amount (₹)", "Notes"]],
    body: rows.map((r) => [r.date, r.type, r.load, r.amount.toFixed(2), r.notes]),
    foot: [["Total", "", "", rows.reduce((s, r) => s + r.amount, 0).toFixed(2), ""]],
    headStyles: { fillColor: [193, 68, 14] },
    footStyles: { fillColor: [247, 245, 240], textColor: [45, 42, 38], fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  doc.save(`Expense_Report_${range.from}_to_${range.to}.pdf`);
}

async function buildExpenseExcel(rows, range, title) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Expense Report");

  sheet.addRow([title]);
  sheet.addRow([`${range.from} to ${range.to}`]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(["Date", "Type", "Load", "Amount (₹)", "Notes"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1440E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  rows.forEach((r) => sheet.addRow([r.date, r.type, r.load, r.amount, r.notes]));

  const totalRow = sheet.addRow(["Total", "", "", rows.reduce((s, r) => s + r.amount, 0), ""]);
  totalRow.font = { bold: true };

  sheet.columns.forEach((col) => (col.width = 18));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Expense_Report_${range.from}_to_${range.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExpenseReportPage() {
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
          Expense Report
        </h1>

        <ReportShell
          title="Expense Report"
          onFetchData={fetchExpenseReportData}
          renderPreview={ExpenseReportPreview}
          buildPdf={buildExpensePdf}
          buildExcel={buildExpenseExcel}
        />
      </div>
    </div>
  );
}