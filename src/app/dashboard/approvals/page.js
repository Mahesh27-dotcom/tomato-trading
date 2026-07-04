"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TomatoMark from "@/components/ui/TomatoMark";

export default function ApprovalsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending"); // pending | approved | all

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: me } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    if (me?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setProfile(me);

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_approved, created_at")
      .order("created_at", { ascending: false });

    setPending((data || []).filter((u) => !u.is_approved));
    setApproved((data || []).filter((u) => u.is_approved));

    setLoading(false);
  };

  const approve = async (id) => {
    setActionLoading(id);

    await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("id", id);

    await load();
    setActionLoading(null);
  };

  const reject = async (id) => {
    setActionLoading(id);

    const { data: { session } } = await supabase.auth.getSession();

    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reject-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: id }),
      }
    );

    await load();
    setActionLoading(null);
  };

  const filteredPending = pending.filter((u) =>
    (u.full_name + u.email).toLowerCase().includes(search.toLowerCase())
  );

  const filteredApproved = approved.filter((u) =>
    (u.full_name + u.email).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-5">
          <TomatoMark size={40} />
          <div>
            <p className="text-[16px] font-semibold" style={{ color: "var(--color-text)" }}>
              Staff Approvals
            </p>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Manage users
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div
          className="mb-4 rounded-2xl px-4 py-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              width: "100%",
              background: "transparent",
              outline: "none",
              color: "var(--color-text)",
            }}
          />
        </div>

        {/* FILTER */}
        <div className="flex gap-2 mb-5">
          {["pending", "approved", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-sm"
              style={{
                backgroundColor:
                  filter === f ? "var(--color-accent)" : "var(--color-surface)",
                color: filter === f ? "white" : "var(--color-text)",
                border: "1px solid var(--color-border)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* PENDING */}
        {(filter === "pending" || filter === "all") && (
          <>
            <p className="text-[13px] mb-2" style={{ color: "var(--color-text-muted)" }}>
              Pending ({filteredPending.length})
            </p>

            <div className="space-y-3 mb-6">
              {filteredPending.map((u) => (
                <div
                  key={u.id}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <p style={{ color: "var(--color-text)" }}>
                    {u.full_name}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {u.email}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approve(u.id)}
                      className="flex-1 rounded-xl py-2 text-sm font-medium"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        color: "white",
                      }}
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => reject(u.id)}
                      className="flex-1 rounded-xl py-2 text-sm font-medium"
                      style={{
                        backgroundColor: "var(--color-bg)",
                        color: "var(--color-text)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* APPROVED */}
        {(filter === "approved" || filter === "all") && (
          <>
            <p className="text-[13px] mb-2" style={{ color: "var(--color-text-muted)" }}>
              Approved ({filteredApproved.length})
            </p>

            <div className="space-y-2">
              {filteredApproved.map((u) => (
                <div
                  key={u.id}
                  className="rounded-2xl p-3 flex justify-between"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <p style={{ color: "var(--color-text)" }}>
                      {u.full_name}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                      {u.email}
                    </p>
                  </div>

                  <span style={{ color: "var(--color-accent)" }}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}