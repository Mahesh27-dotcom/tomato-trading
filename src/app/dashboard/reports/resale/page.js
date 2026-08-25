"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReportShell from "@/components/reports/ReportShell";
import { unitLabel } from "@/lib/units";

async function fetchResaleReportData({ from, to }) {
  const supabase = createClient();

  const { data: resales } = await supabase
    .from("resales")
    .select(
      "quantity, resale_rate, resale_amount, resale_date, buyers(name), rejections(reason, sales(loads(load_number, unit)))"
    )
    .gte("resale_date", from)
    .lte("resale_date", to)
    .order("resale_date", { ascending: false });

  return (resales || []).map((r) => ({
    date: r.resale_date,
    load: r.rejections?.sales?.loads?.load_number || "-",
    buyer: r.buyers?.name || "-",
    unit: r.rejections?.sales?.loads?.unit || "crate",
    quantity: parseFloat(r.quantity || 0),
    rate: parseFloat(r.resale_rate || 0),
    amount: parseFloat(r.resale_amount || 0),
    originalReason: r.rejections?.reason || "-",
  }));
}

function ResaleReportPreview(rows) {
  // Quantity can't be summed across units (Crates + Kg is meaningless).
  const qtyByUnit = rows.reduce((acc, r) => {
    acc[r.unit] = (acc[r.unit] || 0) + r.quantity;
    return acc;
  }, {});
  const qtySummary = Object.entries(qtyByUnit)
    .map(([unit, qty]) => `${qty.toFixed(1)} ${unitLabel(unit)}`)
    .join(" · ");
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
        No resales in this range.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Resold Qty</p>
          <p className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>{qtySummary || "0"}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Resale Revenue</p>
          <p className="text-[14px] font-semibold" style={{ color: "var(--color-success)" }}>₹{totalAmount.toFixed(2)}</p>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <span style={{ color: "var(--color-text)" }}>
              {r.load} · {r.buyer} · {r.quantity} {unitLabel(r.unit)}
            </span>
            <span style={{ color: "var(--color-success)" }}>₹{r.amount.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function buildResalePdf(rows, range, title) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${range.from} to ${range.to}`, 14, 25);

  // Each row shows its own quantity+unit inline; the footer total is
  // split per unit since Crates + Kg can't be summed.
  const unitsPresent = Array.from(new Set(rows.map((r) => r.unit)));
  const qtyFootCells = unitsPresent.map(
    (u) => `${rows.filter((r) => r.unit === u).reduce((s, r) => s + r.quantity, 0).toFixed(1)} ${unitLabel(u)}`
  );

  autoTable(doc, {
    startY: 32,
    head: [["Date", "Load", "Buyer", "Qty", "Rate (₹)", "Amount (₹)", "Original Reason"]],
    body: rows.map((r) => [
      r.date,
      r.load,
      r.buyer,
      `${r.quantity.toFixed(1)} ${unitLabel(r.unit)}`,
      r.rate.toFixed(2),
      r.amount.toFixed(2),
      r.originalReason,
    ]),
    foot: [[
      "Total", "", "",
      qtyFootCells.join(" · "),
      "",
      rows.reduce((s, r) => s + r.amount, 0).toFixed(2),
      "",
    ]],
    headStyles: { fillColor: [193, 68, 14] },
    footStyles: { fillColor: [247, 245, 240], textColor: [45, 42, 38], fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  doc.save(`Resale_Report_${range.from}_to_${range.to}.pdf`);
}

async function buildResaleExcel(rows, range, title) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Resale Report");

  sheet.addRow([title]);
  sheet.addRow([`${range.from} to ${range.to}`]);
  sheet.addRow([]);

  const unitsPresent = Array.from(new Set(rows.map((r) => r.unit)));
  const qtyFootCell = unitsPresent
    .map((u) => `${rows.filter((r) => r.unit === u).reduce((s, r) => s + r.quantity, 0)} ${unitLabel(u)}`)
    .join(" · ");

  const headerRow = sheet.addRow(["Date", "Load", "Buyer", "Qty", "Unit", "Rate (₹)", "Amount (₹)", "Original Reason"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1440E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  rows.forEach((r) =>
    sheet.addRow([r.date, r.load, r.buyer, r.quantity, unitLabel(r.unit), r.rate, r.amount, r.originalReason])
  );

  const totalRow = sheet.addRow([
    "Total", "", "",
    qtyFootCell,
    "", "",
    rows.reduce((s, r) => s + r.amount, 0),
    "",
  ]);
  totalRow.font = { bold: true };

  sheet.columns.forEach((col) => (col.width = 16));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Resale_Report_${range.from}_to_${range.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResaleReportPage() {
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
          Resale Report
        </h1>

        <ReportShell
          title="Resale Report"
          onFetchData={fetchResaleReportData}
          renderPreview={ResaleReportPreview}
          buildPdf={buildResalePdf}
          buildExcel={buildResaleExcel}
        />
      </div>
    </div>
  );
}