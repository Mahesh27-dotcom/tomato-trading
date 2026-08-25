"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReportShell from "@/components/reports/ReportShell";
import { unitLabel } from "@/lib/units";

async function fetchSummaryReportData({ from, to }) {
  const supabase = createClient();

  const [loadsRes, salesRes, expensesRes, farmerPayRes, buyerPayRes, allLoadsRes, allSalesRes, allFarmerPayRes, allBuyerPayRes] =
    await Promise.all([
      supabase.from("loads").select("load_number, load_date, vehicle_number, unit, total_quantity, total_purchase_amount, farmers(name)").gte("load_date", from).lte("load_date", to),
      supabase.from("sales").select("sale_date, quantity_sold, sale_rate, sale_amount, loads(load_number, unit), buyers(name)").gte("sale_date", from).lte("sale_date", to),
      supabase.from("expenses").select("expense_date, expense_type, amount, notes").gte("expense_date", from).lte("expense_date", to),
      supabase.from("farmer_payments").select("payment_date, amount, farmers(name)").gte("payment_date", from).lte("payment_date", to),
      supabase.from("buyer_payments").select("payment_date, amount, buyers(name)").gte("payment_date", from).lte("payment_date", to),
      supabase.from("loads").select("total_purchase_amount"),
      supabase.from("sales").select("sale_amount"),
      supabase.from("farmer_payments").select("amount"),
      supabase.from("buyer_payments").select("amount"),
    ]);

  const sum = (rows, field) => (rows || []).reduce((s, r) => s + parseFloat(r[field] || 0), 0);

  const totalPurchase = sum(loadsRes.data, "total_purchase_amount");
  const totalSales = sum(salesRes.data, "sale_amount");
  const totalExpenses = sum(expensesRes.data, "amount");
  const totalFarmerPaid = sum(farmerPayRes.data, "amount");
  const totalBuyerPaid = sum(buyerPayRes.data, "amount");
  const profitOrLoss = totalSales - totalPurchase - totalExpenses;

  const farmerPending = sum(allLoadsRes.data, "total_purchase_amount") - sum(allFarmerPayRes.data, "amount");
  const buyerPending = sum(allSalesRes.data, "sale_amount") - sum(allBuyerPayRes.data, "amount");

  return {
    summary: {
      totalPurchase,
      totalSales,
      totalExpenses,
      totalFarmerPaid,
      totalBuyerPaid,
      profit: profitOrLoss > 0 ? profitOrLoss : 0,
      loss: profitOrLoss < 0 ? Math.abs(profitOrLoss) : 0,
      farmerPending,
      buyerPending,
    },
    loads: loadsRes.data || [],
    sales: salesRes.data || [],
    expenses: expensesRes.data || [],
    farmerPayments: farmerPayRes.data || [],
    buyerPayments: buyerPayRes.data || [],
  };
}

function SummaryReportPreview(data) {
  const { summary, loads, sales, expenses, farmerPayments, buyerPayments } = data;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <SummaryStat label="Total Purchase" value={summary.totalPurchase} />
        <SummaryStat label="Total Sales" value={summary.totalSales} />
        <SummaryStat label="Total Expenses" value={summary.totalExpenses} />
        <SummaryStat
          label={summary.profit > 0 ? "Profit" : "Loss"}
          value={summary.profit || summary.loss}
          color={summary.profit > 0 ? "var(--color-success)" : "var(--color-danger)"}
        />
        <SummaryStat label="Farmer Pending (all-time)" value={summary.farmerPending} />
        <SummaryStat label="Buyer Pending (all-time)" value={summary.buyerPending} />
      </div>

      <TransactionGroup title={`Loads (${loads.length})`}>
        {loads.map((l, i) => (
          <Row key={i} left={`${l.load_number} · ${l.farmers?.name || ""}`} right={`₹${l.total_purchase_amount}`} />
        ))}
      </TransactionGroup>

      <TransactionGroup title={`Sales (${sales.length})`}>
        {sales.map((s, i) => (
          <Row key={i} left={`${s.loads?.load_number || ""} → ${s.buyers?.name || ""}`} right={`₹${s.sale_amount}`} />
        ))}
      </TransactionGroup>

      <TransactionGroup title={`Expenses (${expenses.length})`}>
        {expenses.map((e, i) => (
          <Row key={i} left={e.expense_type} right={`₹${e.amount}`} />
        ))}
      </TransactionGroup>

      <TransactionGroup title={`Farmer Payments (${farmerPayments.length})`}>
        {farmerPayments.map((p, i) => (
          <Row key={i} left={p.farmers?.name || ""} right={`₹${p.amount}`} />
        ))}
      </TransactionGroup>

      <TransactionGroup title={`Buyer Payments (${buyerPayments.length})`}>
        {buyerPayments.map((p, i) => (
          <Row key={i} left={p.buyers?.name || ""} right={`₹${p.amount}`} />
        ))}
      </TransactionGroup>
    </div>
  );
}

function SummaryStat({ label, value, color }) {
  return (
    <div>
      <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-[13px] font-semibold" style={{ color: color || "var(--color-text)" }}>
        ₹{value.toFixed(0)}
      </p>
    </div>
  );
}

function TransactionGroup({ title, children }) {
  const items = children?.props?.children || children;
  const hasItems = Array.isArray(items) ? items.length > 0 : true;
  if (!hasItems) return null;

  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
        {title}
      </p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">{children}</div>
    </div>
  );
}

function Row({ left, right }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span style={{ color: "var(--color-text)" }}>{left}</span>
      <span style={{ color: "var(--color-text-muted)" }}>{right}</span>
    </div>
  );
}

async function buildSummaryPdf(data, range, title) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${range.from} to ${range.to}`, 14, 25);

  const { summary, loads, sales, expenses, farmerPayments, buyerPayments } = data;

  autoTable(doc, {
    startY: 32,
    head: [["Metric", "Amount (₹)"]],
    body: [
      ["Total Purchase", summary.totalPurchase.toFixed(2)],
      ["Total Sales", summary.totalSales.toFixed(2)],
      ["Total Expenses", summary.totalExpenses.toFixed(2)],
      [summary.profit > 0 ? "Profit" : "Loss", (summary.profit || summary.loss).toFixed(2)],
      ["Farmer Pending (all-time)", summary.farmerPending.toFixed(2)],
      ["Buyer Pending (all-time)", summary.buyerPending.toFixed(2)],
    ],
    headStyles: { fillColor: [193, 68, 14] },
    styles: { fontSize: 9 },
  });

  let y = doc.lastAutoTable.finalY + 10;

  if (loads.length > 0) {
    doc.setFontSize(12);
    doc.text("Loads", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Load No.", "Farmer", "Vehicle", "Qty", "Amount (₹)"]],
      body: loads.map((l) => [l.load_number, l.farmers?.name || "", l.vehicle_number, `${l.total_quantity} ${unitLabel(l.unit)}`, l.total_purchase_amount]),
      headStyles: { fillColor: [63, 125, 79] },
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (sales.length > 0) {
    doc.setFontSize(12);
    doc.text("Sales", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Load No.", "Buyer", "Qty", "Rate", "Amount (₹)"]],
      body: sales.map((s) => [s.loads?.load_number || "", s.buyers?.name || "", `${s.quantity_sold} ${unitLabel(s.loads?.unit)}`, s.sale_rate, s.sale_amount]),
      headStyles: { fillColor: [63, 125, 79] },
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (expenses.length > 0) {
    doc.setFontSize(12);
    doc.text("Expenses", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Type", "Amount (₹)", "Notes"]],
      body: expenses.map((e) => [e.expense_type, e.amount, e.notes || ""]),
      headStyles: { fillColor: [63, 125, 79] },
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (farmerPayments.length > 0) {
    doc.setFontSize(12);
    doc.text("Farmer Payments", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Farmer", "Amount (₹)"]],
      body: farmerPayments.map((p) => [p.farmers?.name || "", p.amount]),
      headStyles: { fillColor: [63, 125, 79] },
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (buyerPayments.length > 0) {
    doc.setFontSize(12);
    doc.text("Buyer Payments", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Buyer", "Amount (₹)"]],
      body: buyerPayments.map((p) => [p.buyers?.name || "", p.amount]),
      headStyles: { fillColor: [63, 125, 79] },
      styles: { fontSize: 8 },
    });
  }

  doc.save(`Business_Summary_${range.from}_to_${range.to}.pdf`);
}

async function buildSummaryExcel(data, range, title) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const { summary, loads, sales, expenses, farmerPayments, buyerPayments } = data;

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.addRow([title]);
  summarySheet.addRow([`${range.from} to ${range.to}`]);
  summarySheet.addRow([]);
  const headerRow = summarySheet.addRow(["Metric", "Amount (₹)"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1440E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });
  summarySheet.addRow(["Total Purchase", summary.totalPurchase]);
  summarySheet.addRow(["Total Sales", summary.totalSales]);
  summarySheet.addRow(["Total Expenses", summary.totalExpenses]);
  summarySheet.addRow([summary.profit > 0 ? "Profit" : "Loss", summary.profit || summary.loss]);
  summarySheet.addRow(["Farmer Pending (all-time)", summary.farmerPending]);
  summarySheet.addRow(["Buyer Pending (all-time)", summary.buyerPending]);
  summarySheet.columns.forEach((col) => (col.width = 22));

  const addDetailSheet = (name, headers, rows) => {
    if (rows.length === 0) return;
    const sheet = workbook.addWorksheet(name);
    const hRow = sheet.addRow(headers);
    hRow.font = { bold: true };
    hRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3F7D4F" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });
    rows.forEach((r) => sheet.addRow(r));
    sheet.columns.forEach((col) => (col.width = 18));
  };

  addDetailSheet("Loads", ["Load No.", "Farmer", "Vehicle", "Qty", "Unit", "Amount"], loads.map((l) => [l.load_number, l.farmers?.name || "", l.vehicle_number, l.total_quantity, unitLabel(l.unit), l.total_purchase_amount]));
  addDetailSheet("Sales", ["Load No.", "Buyer", "Qty", "Unit", "Rate", "Amount"], sales.map((s) => [s.loads?.load_number || "", s.buyers?.name || "", s.quantity_sold, unitLabel(s.loads?.unit), s.sale_rate, s.sale_amount]));
  addDetailSheet("Expenses", ["Type", "Amount", "Notes"], expenses.map((e) => [e.expense_type, e.amount, e.notes || ""]));
  addDetailSheet("Farmer Payments", ["Farmer", "Amount"], farmerPayments.map((p) => [p.farmers?.name || "", p.amount]));
  addDetailSheet("Buyer Payments", ["Buyer", "Amount"], buyerPayments.map((p) => [p.buyers?.name || "", p.amount]));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Business_Summary_${range.from}_to_${range.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SummaryReportPage() {
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
          Business Summary Report
        </h1>

        <ReportShell
          title="Business Summary Report"
          onFetchData={fetchSummaryReportData}
          renderPreview={SummaryReportPreview}
          buildPdf={buildSummaryPdf}
          buildExcel={buildSummaryExcel}
        />
      </div>
    </div>
  );
}