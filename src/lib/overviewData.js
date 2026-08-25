import { createClient } from "@/utils/supabase/client";

export async function fetchOverviewData(period, customRange = null) {
  const supabase = createClient();

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const trendFrom = sevenDaysAgo.toISOString().slice(0, 10);
  const trendTo = today.toISOString().slice(0, 10);

  // Single bulk fetch covering both the period stats AND the 7-day trend,
  // by always fetching from the earlier of (period start, 7 days ago).
  const periodRange = getRangeForPeriod(period, customRange);
  const fetchFrom = periodRange.from < trendFrom ? periodRange.from : trendFrom;
  const [
    loadsRes,
    salesRes,
    resalesRes,
    expensesRes,
    allLoadsRes,
    allSalesRes,
    allFarmerPayRes,
    allBuyerPayRes,
    rejectionsRes,
  ] = await Promise.all([
    supabase
      .from("loads")
      .select("total_purchase_amount, load_date")
      .gte("load_date", fetchFrom),

    supabase
      .from("sales")
      .select("sale_amount, sale_date")
      .gte("sale_date", fetchFrom),

    supabase
      .from("resales")
      .select("resale_amount, resale_date")
      .gte("resale_date", fetchFrom),

    supabase
      .from("expenses")
      .select("expense_type, amount, expense_date")
      .gte("expense_date", fetchFrom),

supabase.from("loads").select("total_purchase_amount, load_date"),
supabase.from("sales").select("sale_amount, sale_date"),
supabase.from("farmer_payments").select("amount, payment_date"),
supabase.from("buyer_payments").select("amount, payment_date"),

    supabase
      .from("rejections")
      .select(
        "rejected_quantity, status, rejection_date, sales:sale_id(sale_rate, loads(unit))"
      )
      .gte("rejection_date", fetchFrom),
  ]);

  const sum = (rows, field) =>
    (rows || []).reduce((s, r) => s + parseFloat(r[field] || 0), 0);

  const inRange = (rows, dateField, from, to) =>
    (rows || []).filter((r) => r[dateField] >= from && r[dateField] <= to);

  const periodLoads = inRange(
    loadsRes.data,
    "load_date",
    periodRange.from,
    periodRange.to
  );

  const periodSales = inRange(
    salesRes.data,
    "sale_date",
    periodRange.from,
    periodRange.to
  );

  const periodResales = inRange(
    resalesRes.data,
    "resale_date",
    periodRange.from,
    periodRange.to
  );

  const periodExpenses = inRange(
    expensesRes.data,
    "expense_date",
    periodRange.from,
    periodRange.to
  );

  const periodRejections = inRange(
    rejectionsRes.data,
    "rejection_date",
    periodRange.from,
    periodRange.to
  );

  const totalPurchaseAmount = sum(periodLoads, "total_purchase_amount");
  const totalSalesAmount = sum(periodSales, "sale_amount");
  const totalResaleAmount = sum(periodResales, "resale_amount");
  const totalExpenses = sum(periodExpenses, "amount");

  const transportationExpenses = periodExpenses
    .filter((e) => e.expense_type === "Transportation")
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const labourExpenses = periodExpenses
    .filter((e) => e.expense_type === "Labour")
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const profitOrLoss =
    totalSalesAmount +
    totalResaleAmount -
    totalPurchaseAmount -
    totalExpenses;

  const allTotalPurchase = sum(allLoadsRes.data, "total_purchase_amount");
  const allTotalSales = sum(allSalesRes.data, "sale_amount");
  const allFarmerPaid = sum(allFarmerPayRes.data, "amount");
  const allBuyerPaid = sum(allBuyerPayRes.data, "amount");

  // Cumulative pending balance per day
const cumulativeUpTo = (rows, dateField, amountField, day) =>
  (rows || [])
    .filter((r) => r[dateField] <= day)
    .reduce((s, r) => s + parseFloat(r[amountField] || 0), 0);

  const byType = {};

  periodExpenses.forEach((e) => {
    byType[e.expense_type] =
      (byType[e.expense_type] || 0) + parseFloat(e.amount || 0);
  });

  const expenseBreakdown = Object.entries(byType).map(([name, value]) => ({
    name,
    value,
  }));

  // Rejection Analysis — quantity is grouped by unit (Crates/Kg can never
  // be summed together); currency (totalRejectedValue) stays a normal sum.
  const rejectionTrendMap = {}; // { [date]: { [unit]: qty } }
  const statusMap = {}; // { [unit]: { "Pending Resale": qty, Resold: qty, Discarded: qty } }
  const rejectedUnitsSet = new Set();

  let totalRejectedValue = 0;

  periodRejections.forEach((r) => {
    const qty = parseFloat(r.rejected_quantity || 0);
    const unit = r.sales?.loads?.unit || "crate";
    rejectedUnitsSet.add(unit);

    if (!rejectionTrendMap[r.rejection_date]) rejectionTrendMap[r.rejection_date] = {};
    rejectionTrendMap[r.rejection_date][unit] =
      (rejectionTrendMap[r.rejection_date][unit] || 0) + qty;

    if (!statusMap[unit]) {
      statusMap[unit] = { "Pending Resale": 0, Resold: 0, Discarded: 0 };
    }
    if (statusMap[unit][r.status] !== undefined) {
      statusMap[unit][r.status] += qty;
    }

    const rate = parseFloat(r.sales?.sale_rate || 0);
    totalRejectedValue += qty * rate;
  });

  const rejectedUnits = Array.from(rejectedUnitsSet);

  const rejectionTrend = Object.entries(rejectionTrendMap)
    .map(([date, byUnit]) => ({
      day: new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      fullDate: date,
      ...byUnit,
    }))
    .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

  const rejectionStatusBreakdownByUnit = {};
  rejectedUnits.forEach((unit) => {
    rejectionStatusBreakdownByUnit[unit] = Object.entries(statusMap[unit]).map(
      ([status, quantity]) => ({ status, quantity })
    );
  });

  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const pendingTrend = days.map((day) => {
  const purchaseToDate = cumulativeUpTo(allLoadsRes.data, "load_date", "total_purchase_amount", day);
  const farmerPaidToDate = cumulativeUpTo(allFarmerPayRes.data, "payment_date", "amount", day);
  const salesToDate = cumulativeUpTo(allSalesRes.data, "sale_date", "sale_amount", day);
  const buyerPaidToDate = cumulativeUpTo(allBuyerPayRes.data, "payment_date", "amount", day);

  return {
    day: new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    fullDate: day,
    farmerPending: purchaseToDate - farmerPaidToDate,
    buyerPending: salesToDate - buyerPaidToDate,
  };
});

  const profitTrend = days.map((day) => {
    const dPurchase = sum(
      (loadsRes.data || []).filter((r) => r.load_date === day),
      "total_purchase_amount"
    );

    const dSales = sum(
      (salesRes.data || []).filter((r) => r.sale_date === day),
      "sale_amount"
    );

    const dResale = sum(
      (resalesRes.data || []).filter((r) => r.resale_date === day),
      "resale_amount"
    );

    const dExp = sum(
      (expensesRes.data || []).filter((r) => r.expense_date === day),
      "amount"
    );

    return {
      day: new Date(day).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      fullDate: day,
      profit: dSales + dResale - dPurchase - dExp,
      purchase: dPurchase,
      sales: dSales,
    };
  });

  return {
    totalPurchaseAmount,
    totalSalesAmount,
    totalResaleAmount,
    totalExpenses,
    transportationExpenses,
    labourExpenses,
    profit: profitOrLoss > 0 ? profitOrLoss : 0,
    loss: profitOrLoss < 0 ? Math.abs(profitOrLoss) : 0,
    farmerPending: allTotalPurchase - allFarmerPaid,
    buyerPending: allTotalSales - allBuyerPaid,
    expenseBreakdown,
    profitTrend,

    rejectionAnalysis: {
      trend: rejectionTrend,
      units: rejectedUnits,
      statusBreakdownByUnit: rejectionStatusBreakdownByUnit,
      totalRejectedValue,
    },
    pendingPayment: {
  farmerPending: allTotalPurchase - allFarmerPaid,
  buyerPending: allTotalSales - allBuyerPaid,
  trend: pendingTrend,
},
  };
}

export function getRangeForPeriod(period, customRange = null) {
  if (period === "custom" && customRange?.from && customRange?.to) {
    return {
      from: customRange.from,
      to: customRange.to,
    };
  }

  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (period === "yesterday") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  } else if (period === "week") {
    start.setDate(today.getDate() - today.getDay());
  } else if (period === "month") {
    start.setDate(1);
  }

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

// Keep this for now
export async function getRejectionAnalysis(supabase, startDate, endDate) {
  // unchanged
}