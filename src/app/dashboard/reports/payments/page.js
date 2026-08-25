"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReportShell from "@/components/reports/ReportShell";

async function fetchPaymentReportData({ from, to }) {
  const supabase = createClient();

  const { data: farmerPayments } = await supabase
    .from("farmer_payments")
    .select("amount, payment_date, payment_mode, notes, farmers(name)")
    .gte("payment_date", from)
    .lte("payment_date", to);

  const { data: buyerPayments } = await supabase
    .from("buyer_payments")
    .select("amount, payment_date, payment_mode, notes, buyers(name)")
    .gte("payment_date", from)
    .lte("payment_date", to);

  const combined = [
    ...(farmerPayments || []).map((p) => ({
      date: p.payment_date,
      type: "Farmer Payment",
      party: p.farmers?.name || "-",
      mode: p.payment_mode || "-",
      amount: parseFloat(p.amount || 0),
      notes: p.notes || "",
    })),
    ...(buyerPayments || []).map((p) => ({
      date: p.payment_date,
      type: "Buyer Payment",
      party: p.buyers?.name || "-",
      mode: p.payment_mode || "-",
      amount: parseFloat(p.amount || 0),
      notes: p.notes || "",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return combined;
}

function PaymentReportPreview(rows) {
  const farmerTotal = rows.filter((r) => r.type === "Farmer Payment").reduce((s, r) => s + r.amount, 0);
  const buyerTotal = rows.filter((r) => r.type === "Buyer Payment").reduce((s, r) => s + r.amount, 0);

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
        No payments in this range.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Paid to Farmers</p>
          <p className="text-[14px] font-semibold" style={{ color: "var(--color-danger)" }}>₹{farmerTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Received from Buyers</p>
          <p className="text-[14px] font-semibold" style={{ color: "var(--color-success)" }}>₹{buyerTotal.toFixed(2)}</p>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <span style={{ color: "var(--color-text)" }}>
              {r.party} <span style={{ color: "var(--color-text-muted)" }}>· {r.type === "Farmer Payment" ? "Paid" : "Received"}</span>
            </span>
            <span style={{ color: r.type === "Farmer Payment" ? "var(--color-danger)" : "var(--color-success)" }}>
              ₹{r.amount.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function buildPaymentPdf(rows, range, title) {
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
    head: [["Date", "Type", "Party", "Mode", "Amount (₹)", "Notes"]],
    body: rows.map((r) => [r.date, r.type, r.party, r.mode, r.amount.toFixed(2), r.notes]),
    foot: [["Total", "", "", "", rows.reduce((s, r) => s + r.amount, 0).toFixed(2), ""]],
    headStyles: { fillColor: [193, 68, 14] },
    footStyles: { fillColor: [247, 245, 240], textColor: [45, 42, 38], fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  doc.save(`Payment_Report_${range.from}_to_${range.to}.pdf`);
}

async function buildPaymentExcel(rows, range, title) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Payment Report");

  sheet.addRow([title]);
  sheet.addRow([`${range.from} to ${range.to}`]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(["Date", "Type", "Party", "Mode", "Amount (₹)", "Notes"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1440E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  rows.forEach((r) => sheet.addRow([r.date, r.type, r.party, r.mode, r.amount, r.notes]));

  const totalRow = sheet.addRow(["Total", "", "", "", rows.reduce((s, r) => s + r.amount, 0), ""]);
  totalRow.font = { bold: true };

  sheet.columns.forEach((col) => (col.width = 18));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Payment_Report_${range.from}_to_${range.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PaymentReportPage() {
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
          Payment Report
        </h1>

        <ReportShell
          title="Payment Report"
          onFetchData={fetchPaymentReportData}
          renderPreview={PaymentReportPreview}
          buildPdf={buildPaymentPdf}
          buildExcel={buildPaymentExcel}
        />
      </div>
    </div>
  );
}