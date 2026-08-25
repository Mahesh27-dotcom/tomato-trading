"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReportShell from "@/components/reports/ReportShell";
import { unitLabel } from "@/lib/units";

async function fetchBuyerReportData({ from, to }) {
  const supabase = createClient();

  const { data: buyers } = await supabase.from("buyers").select("id, name, market_name");
  const { data: sales } = await supabase
    .from("sales")
    .select("buyer_id, sale_date, quantity_sold, sale_amount, loads(unit)")
    .gte("sale_date", from)
    .lte("sale_date", to);
  const { data: payments } = await supabase
    .from("buyer_payments")
    .select("buyer_id, amount, payment_date")
    .gte("payment_date", from)
    .lte("payment_date", to);

  return (buyers || [])
    .map((b) => {
      const buyerSales = (sales || []).filter((s) => s.buyer_id === b.id);
      const buyerPayments = (payments || []).filter((p) => p.buyer_id === b.id);

      // Quantity can't be summed across units (Crates + Kg is meaningless),
      // so group per unit instead of a single blind total.
      const quantityByUnit = buyerSales.reduce((acc, r) => {
        const key = r.loads?.unit || "crate";
        acc[key] = (acc[key] || 0) + parseFloat(r.quantity_sold || 0);
        return acc;
      }, {});
      const totalSalesAmount = buyerSales.reduce((s, r) => s + parseFloat(r.sale_amount || 0), 0);
      const totalReceived = buyerPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

      return {
        name: b.name,
        market: b.market_name || "-",
        purchases: buyerSales.length,
        quantityByUnit,
        totalSalesAmount,
        totalReceived,
        pending: totalSalesAmount - totalReceived,
      };
    })
    .filter((b) => b.purchases > 0 || b.totalReceived > 0);
}

function BuyerReportPreview(rows) {
  const totalSales = rows.reduce((s, r) => s + r.totalSalesAmount, 0);
  const totalReceived = rows.reduce((s, r) => s + r.totalReceived, 0);
  const totalPending = rows.reduce((s, r) => s + r.pending, 0);

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
        No buyer activity in this range.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Sales</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>₹{totalSales.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Received</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-success)" }}>₹{totalReceived.toFixed(0)}</p>
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

async function buildBuyerPdf(rows, range, title) {
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
      "Buyer",
      "Market",
      "Purchases",
      ...unitsPresent.map((u) => `Qty (${unitLabel(u)})`),
      "Sales (₹)",
      "Received (₹)",
      "Pending (₹)",
    ]],
    body: rows.map((r) => [
      r.name,
      r.market,
      r.purchases,
      ...unitsPresent.map((u) => qtyForUnit(r, u).toFixed(1)),
      r.totalSalesAmount.toFixed(2),
      r.totalReceived.toFixed(2),
      r.pending.toFixed(2),
    ]),
    foot: [[
      "Total", "", "",
      ...unitsPresent.map((u) => rows.reduce((s, r) => s + qtyForUnit(r, u), 0).toFixed(1)),
      rows.reduce((s, r) => s + r.totalSalesAmount, 0).toFixed(2),
      rows.reduce((s, r) => s + r.totalReceived, 0).toFixed(2),
      rows.reduce((s, r) => s + r.pending, 0).toFixed(2),
    ]],
    headStyles: { fillColor: [193, 68, 14] },
    footStyles: { fillColor: [247, 245, 240], textColor: [45, 42, 38], fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  doc.save(`Buyer_Report_${range.from}_to_${range.to}.pdf`);
}

async function buildBuyerExcel(rows, range, title) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Buyer Report");

  sheet.addRow([title]);
  sheet.addRow([`${range.from} to ${range.to}`]);
  sheet.addRow([]);

  const unitsPresent = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r.quantityByUnit || {})))
  );
  const qtyForUnit = (r, unit) => (r.quantityByUnit?.[unit] || 0);

  const headerRow = sheet.addRow([
    "Buyer",
    "Market",
    "Purchases",
    ...unitsPresent.map((u) => `Qty (${unitLabel(u)})`),
    "Sales (₹)",
    "Received (₹)",
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
      r.market,
      r.purchases,
      ...unitsPresent.map((u) => qtyForUnit(r, u)),
      r.totalSalesAmount,
      r.totalReceived,
      r.pending,
    ]);
  });

  const totalRow = sheet.addRow([
    "Total", "", "",
    ...unitsPresent.map((u) => rows.reduce((s, r) => s + qtyForUnit(r, u), 0)),
    rows.reduce((s, r) => s + r.totalSalesAmount, 0),
    rows.reduce((s, r) => s + r.totalReceived, 0),
    rows.reduce((s, r) => s + r.pending, 0),
  ]);
  totalRow.font = { bold: true };

  sheet.columns.forEach((col) => (col.width = 16));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Buyer_Report_${range.from}_to_${range.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BuyerReportPage() {
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
          Buyer-wise Report
        </h1>

        <ReportShell
          title="Buyer-wise Report"
          onFetchData={fetchBuyerReportData}
          renderPreview={BuyerReportPreview}
          buildPdf={buildBuyerPdf}
          buildExcel={buildBuyerExcel}
        />
      </div>
    </div>
  );
}