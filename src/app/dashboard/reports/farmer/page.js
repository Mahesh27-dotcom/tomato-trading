"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReportShell from "@/components/reports/ReportShell";
import { unitLabel } from "@/lib/units";

async function fetchFarmerReportData({ from, to }) {
  const supabase = createClient();

  const { data: farmers } = await supabase.from("farmers").select("id, name, village");
  const { data: loads } = await supabase
    .from("loads")
    .select("farmer_id, load_date, unit, total_quantity, total_purchase_amount")
    .gte("load_date", from)
    .lte("load_date", to);
  const { data: payments } = await supabase
    .from("farmer_payments")
    .select("farmer_id, amount, payment_date")
    .gte("payment_date", from)
    .lte("payment_date", to);

  return (farmers || [])
    .map((f) => {
      const farmerLoads = (loads || []).filter((l) => l.farmer_id === f.id);
      const farmerPayments = (payments || []).filter((p) => p.farmer_id === f.id);

      // Quantity can't be summed across units (Crates + Kg is meaningless),
      // so group per unit instead of a single blind total.
      const quantityByUnit = farmerLoads.reduce((acc, l) => {
        const key = l.unit || "crate";
        acc[key] = (acc[key] || 0) + parseFloat(l.total_quantity || 0);
        return acc;
      }, {});
      const totalPurchaseAmount = farmerLoads.reduce((s, l) => s + parseFloat(l.total_purchase_amount || 0), 0);
      const totalPaid = farmerPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

      return {
        name: f.name,
        village: f.village || "-",
        loads: farmerLoads.length,
        quantityByUnit,
        totalPurchaseAmount,
        totalPaid,
        pending: totalPurchaseAmount - totalPaid,
      };
    })
    .filter((f) => f.loads > 0 || f.totalPaid > 0); // hide farmers with zero activity in range
}

function FarmerReportPreview(rows) {
  const totalPurchase = rows.reduce((s, r) => s + r.totalPurchaseAmount, 0);
  const totalPaid = rows.reduce((s, r) => s + r.totalPaid, 0);
  const totalPending = rows.reduce((s, r) => s + r.pending, 0);

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
        No farmer activity in this range.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Purchase</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>₹{totalPurchase.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Paid</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-success)" }}>₹{totalPaid.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Pending</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-danger)" }}>₹{totalPending.toFixed(0)}</p>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <span style={{ color: "var(--color-text)" }}>{r.name}</span>
            <span style={{ color: r.pending > 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
              ₹{r.pending.toFixed(0)} pending
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function buildFarmerPdf(rows, range, title) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${range.from} to ${range.to}`, 14, 25);

  // One "Qty" column per unit actually present in this report's range —
  // never a single blind quantity total (Crates + Kg can't be summed).
  const unitsPresent = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r.quantityByUnit || {})))
  );
  const qtyForUnit = (r, unit) => (r.quantityByUnit?.[unit] || 0);

  autoTable(doc, {
    startY: 32,
    head: [[
      "Farmer",
      "Village",
      "Loads",
      ...unitsPresent.map((u) => `Qty (${unitLabel(u)})`),
      "Purchase (₹)",
      "Paid (₹)",
      "Pending (₹)"
    ]],
    body: rows.map((r) => [
      r.name,
      r.village,
      r.loads,
      ...unitsPresent.map((u) => qtyForUnit(r, u).toFixed(1)),
      r.totalPurchaseAmount.toFixed(2),
      r.totalPaid.toFixed(2),
      r.pending.toFixed(2),
    ]),
    foot: [[
      "Total",
      "",
      "",
      ...unitsPresent.map((u) => rows.reduce((s, r) => s + qtyForUnit(r, u), 0).toFixed(1)),
      rows.reduce((s, r) => s + r.totalPurchaseAmount, 0).toFixed(2),
      rows.reduce((s, r) => s + r.totalPaid, 0).toFixed(2),
      rows.reduce((s, r) => s + r.pending, 0).toFixed(2),
    ]],
    headStyles: {
      fillColor: [193, 68, 14],
    },
    footStyles: {
      fillColor: [247, 245, 240],
      textColor: [45, 42, 38],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
    },
  });

  doc.save(`Farmer_Report_${range.from}_to_${range.to}.pdf`);
}

async function buildFarmerExcel(rows, range, title) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Farmer Report");

  sheet.addRow([title]);
  sheet.addRow([`${range.from} to ${range.to}`]);
  sheet.addRow([]);

  const unitsPresent = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r.quantityByUnit || {})))
  );
  const qtyForUnit = (r, unit) => (r.quantityByUnit?.[unit] || 0);

  const headerRow = sheet.addRow([
    "Farmer",
    "Village",
    "Loads",
    ...unitsPresent.map((u) => `Qty (${unitLabel(u)})`),
    "Purchase (₹)",
    "Paid (₹)",
    "Pending (₹)",
  ]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1440E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  rows.forEach((r) => {
    sheet.addRow([
      r.name,
      r.village,
      r.loads,
      ...unitsPresent.map((u) => qtyForUnit(r, u)),
      r.totalPurchaseAmount,
      r.totalPaid,
      r.pending,
    ]);
  });

  const totalRow = sheet.addRow([
    "Total", "", "",
    ...unitsPresent.map((u) => rows.reduce((s, r) => s + qtyForUnit(r, u), 0)),
    rows.reduce((s, r) => s + r.totalPurchaseAmount, 0),
    rows.reduce((s, r) => s + r.totalPaid, 0),
    rows.reduce((s, r) => s + r.pending, 0),
  ]);
  totalRow.font = { bold: true };

  sheet.columns.forEach((col) => (col.width = 16));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Farmer_Report_${range.from}_to_${range.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FarmerReportPage() {
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
          Farmer-wise Report
        </h1>

        <ReportShell
          title="Farmer-wise Report"
          onFetchData={fetchFarmerReportData}
          renderPreview={FarmerReportPreview}
          buildPdf={buildFarmerPdf}
          buildExcel={buildFarmerExcel}
        />
      </div>
    </div>
  );
}