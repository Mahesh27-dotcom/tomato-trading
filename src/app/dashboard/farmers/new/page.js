"use client";

import { useRouter } from "next/navigation";
import FarmerForm from "@/components/farmers/FarmerForm";

export default function NewFarmerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard/farmers")}
          className="text-[14px] font-medium mb-5"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to farmers
        </button>

        <h1 className="text-[22px] font-semibold mb-6" style={{ color: "var(--color-text)" }}>
          Add Farmer
        </h1>

        <FarmerForm />
      </div>
    </div>
  );
}