"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import TomatoMark from "@/components/ui/TomatoMark";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setProfile(data);
    };

    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TomatoMark size={40} />
            <div>
              <p
                className="text-[15px] font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {profile?.full_name || "..."}
              </p>

              <p
                className="text-[12px] capitalize"
                style={{ color: "var(--color-text-muted)" }}
              >
                {profile?.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-[13px] font-medium px-3.5 py-2 rounded-xl active:opacity-60"
            style={{
              color: "var(--color-accent)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            Log out
          </button>
        </div>

        {/* Admin-only Approvals */}
        {profile?.role === "admin" && (
          <button
            onClick={() => router.push("/dashboard/approvals")}
            className="w-full mb-5 rounded-2xl px-4 py-3.5 text-left flex items-center justify-between"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span
              className="text-[14px] font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Staff Approvals
            </span>

            <span style={{ color: "var(--color-accent)" }}>→</span>
          </button>
        )}

        {/* Farmers */}
        <button
          onClick={() => router.push("/dashboard/farmers")}
          className="w-full mb-5 rounded-2xl px-4 py-3.5 text-left flex items-center justify-between"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span
            className="text-[14px] font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Farmers
          </span>

          <span style={{ color: "var(--color-accent)" }}>→</span>
        </button>

        {/* Buyers */}
        <button
          onClick={() => router.push("/dashboard/buyers")}
          className="w-full mb-5 rounded-2xl px-4 py-3.5 text-left flex items-center justify-between"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span
            className="text-[14px] font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Buyers
          </span>

          <span style={{ color: "var(--color-accent)" }}>→</span>
        </button>

        {/* Loads */}
        <button
          onClick={() => router.push("/dashboard/loads")}
          className="w-full mb-5 rounded-2xl px-4 py-3.5 text-left flex items-center justify-between"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span
            className="text-[14px] font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Loads
          </span>

          <span style={{ color: "var(--color-accent)" }}>→</span>
        </button>

        <div
          className="rounded-2xl p-6 text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ color: "var(--color-text-muted)" }}>
            Dashboard content coming soon — this is a placeholder screen
            confirming your login works end-to-end.
          </p>
        </div>
      </div>
    </div>
  );
}