"use client";

import { useRouter } from "next/navigation";

export default function SearchButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/dashboard/search")}
      aria-label="Search"
      className="flex items-center justify-center w-9 h-9 rounded-full"
      style={{
        color: "var(--color-text-muted)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" strokeLinecap="round" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}