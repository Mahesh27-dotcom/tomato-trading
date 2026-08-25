"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TomatoMark from "@/components/ui/TomatoMark";
import SearchButton from "@/components/ui/SearchButton";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/components/ui/Toast";

export default function ApprovalsPage() {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [profile, setProfile] = useState(null);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: me } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();

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

  const approve = async (id, name) => {
    haptic("success");
    setActionLoading(id);

    await supabase.from("profiles").update({ is_approved: true }).eq("id", id);

    await load();
    showToast(`${name || "User"} approved`);
    setActionLoading(null);
  };

  const reject = async (id, name) => {
    if (!confirm(`Reject ${name || "this user"}'s access request? This cannot be undone.`)) return;

    haptic("warning");
    setActionLoading(id);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reject-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId: id }),
    });

    await load();
    showToast(`${name || "User"} rejected`, "error");
    setActionLoading(null);
  };

  const filteredPending = pending.filter((u) => (u.full_name + u.email).toLowerCase().includes(search.toLowerCase()));

  const filteredApproved = approved.filter((u) => (u.full_name + u.email).toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-md mx-auto px-4 py-6 space-y-3">
          <div className="skeleton-block rounded-2xl" style={{ height: 40, width: 180 }} />
          <div className="skeleton-block rounded-2xl" style={{ height: 46, marginTop: 8 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block rounded-2xl" style={{ height: 96 }} />
          ))}
        </div>
        <style jsx global>{`
          @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
          .skeleton-block {
            background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <div
          className="flex items-center justify-between mb-5"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="back-btn text-[14px] font-medium inline-flex items-center gap-1"
            style={{ color: "var(--color-accent)" }}
          >
            <span className="back-arrow">←</span> Back to dashboard
          </button>
          <SearchButton />
        </div>

        {/* HEADER */}
        <div
          className="flex items-center gap-3 mb-5"
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both" }}
        >
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
          className="search-wrap mb-4 rounded-2xl px-4 py-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ width: "100%", background: "transparent", outline: "none", color: "var(--color-text)" }}
          />
        </div>

        {/* FILTER */}
        <div className="flex gap-2 mb-5" style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both" }}>
          {["pending", "approved", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="filter-chip px-3 py-1.5 rounded-xl text-sm capitalize"
              style={{
                backgroundColor: filter === f ? "var(--color-accent)" : "var(--color-surface)",
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

            {filteredPending.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center mb-6"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                  No pending requests.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {filteredPending.map((u, i) => (
                  <div
                    key={u.id}
                    className="user-card rounded-2xl p-4"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      animation: `fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(0.2 + i * 0.05, 0.4)}s both`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="shrink-0 rounded-full flex items-center justify-center"
                        style={{ width: 40, height: 40, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                      >
                        <span className="text-[14px] font-semibold" style={{ color: "var(--color-accent)" }}>
                          {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium truncate" style={{ color: "var(--color-text)" }}>
                          {u.full_name}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: "var(--color-text-muted)" }}>
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approve(u.id, u.full_name)}
                        disabled={actionLoading === u.id}
                        className="action-btn flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                      >
                        {actionLoading === u.id ? "..." : "✓ Approve"}
                      </button>

                      <button
                        onClick={() => reject(u.id, u.full_name)}
                        disabled={actionLoading === u.id}
                        className="action-btn flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                      >
                        {actionLoading === u.id ? "..." : "✕ Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* APPROVED */}
        {(filter === "approved" || filter === "all") && (
          <>
            <p className="text-[13px] mb-2" style={{ color: "var(--color-text-muted)" }}>
              Approved ({filteredApproved.length})
            </p>

            {filteredApproved.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                  No approved users yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredApproved.map((u, i) => (
                  <div
                    key={u.id}
                    className="user-card rounded-2xl p-3 flex items-center gap-3"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      animation: `fadeSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(i * 0.03, 0.3)}s both`,
                    }}
                  >
                    <div
                      className="shrink-0 rounded-full flex items-center justify-center"
                      style={{ width: 32, height: 32, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                    >
                      <span className="text-[12px] font-semibold" style={{ color: "var(--color-accent)" }}>
                        {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] truncate" style={{ color: "var(--color-text)" }}>
                        {u.full_name}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>
                        {u.email}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-accent)" }}
                    >
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .back-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out; }
        .back-btn:active { transform: scale(0.96); opacity: 0.7; }
        .back-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (hover: hover) { .back-btn:hover .back-arrow { transform: translateX(-3px); } }
        .search-wrap :global(input) { transition: color 0.2s ease-out; }
        .filter-chip { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .filter-chip:active { transform: scale(0.95); }
        .user-card {
          box-shadow: 0 1px 2px rgba(45, 42, 38, 0.04);
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (hover: hover) {
          .user-card:hover { box-shadow: 0 6px 16px rgba(45, 42, 38, 0.06); }
        }
        .action-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .action-btn:active:not(:disabled) { transform: scale(0.95); }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001s !important;
            animation-delay: 0s !important;
            transition-duration: 0.001s !important;
          }
          .user-card:hover, .back-btn:hover .back-arrow { transform: none !important; }
        }
      `}</style>
    </div>
  );
}