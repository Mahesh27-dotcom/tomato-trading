import { createClient } from "@/utils/supabase/client";

export async function fetchNotesLog({ from, to }) {
  const supabase = createClient();

  const [farmersRes, buyersRes, loadsRes, expensesRes, rejectionsRes] = await Promise.all([
    supabase
  .from("farmers")
  .select("id, name, notes, created_at")
  .not("notes", "is", "null")
  .neq("notes", "")
  .gte("created_at", from)
  .lte("created_at", `${to}T23:59:59`),
    supabase
      .from("buyers")
      .select("id, name, notes, created_at")
      .not("notes", "is", "null")
      .neq("notes", "")
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`),
    supabase
      .from("loads")
      .select("id, load_number, notes, load_date, farmers(name)")
      .not("notes", "is", "null")
      .neq("notes", "")
      .gte("load_date", from)
      .lte("load_date", to),
    supabase
      .from("expenses")
      .select("id, expense_type, notes, expense_date, load_id, loads(load_number)")
      .not("notes", "is", "null")
      .neq("notes", "")
      .gte("expense_date", from)
      .lte("expense_date", to),
    supabase
      .from("rejections")
      .select("id, remarks, rejection_date, sale_id, sales(load_id, buyers(name), loads(load_number))")
      .not("remarks", "is", "null")
      .neq("remarks", "")
      .gte("rejection_date", from)
      .lte("rejection_date", to),
  ]);

  const entries = [];

  (farmersRes.data || []).forEach((f) => {
    entries.push({
      id: `farmer-${f.id}`,
      source: "Farmer",
      identifier: f.name,
      date: f.created_at.slice(0, 10),
      nnote: f.notes,
      route: `/dashboard/farmers/${f.id}`,
    });
  });

  (buyersRes.data || []).forEach((b) => {
    entries.push({
      id: `buyer-${b.id}`,
      source: "Buyer",
      identifier: b.name,
      date: b.created_at.slice(0, 10),
      note: b.notes,
      route: `/dashboard/buyers/${b.id}`,
    });
  });

  (loadsRes.data || []).forEach((l) => {
    entries.push({
      id: `load-${l.id}`,
      source: "Load",
      identifier: `${l.load_number} · ${l.farmers?.name || ""}`,
      date: l.load_date,
      note: l.notes,
      route: `/dashboard/loads/${l.id}`,
    });
  });

  (expensesRes.data || []).forEach((e) => {
    entries.push({
      id: `expense-${e.id}`,
      source: "Expense",
      identifier: `${e.expense_type} · ${e.loads?.load_number || "Day-wise"}`,
      date: e.expense_date,
      note: e.notes,
      route: e.load_id ? `/dashboard/loads/${e.load_id}` : null,
    });
  });

  (rejectionsRes.data || []).forEach((r) => {
    const loadId = r.sales?.load_id;
    const loadNumber = r.sales?.loads?.load_number || "";
    const buyerName = r.sales?.buyers?.name || "";
    entries.push({
      id: `rejection-${r.id}`,
      source: "Rejection",
      identifier: `${buyerName} · ${loadNumber}`,
      date: r.rejection_date,
      note: r.remarks,
      route: loadId ? `/dashboard/loads/${loadId}` : null,
    });
  });

  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  return entries;
}