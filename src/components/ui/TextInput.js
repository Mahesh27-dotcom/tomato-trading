"use client";

import { useState } from "react";

export default function TextInput({
  type = "text",
  showToggle = false,
  className = "",
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const actualType = isPassword && showToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="relative">
      <input
        type={actualType}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={`input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none ${
          isPassword && showToggle ? "pr-12" : ""
        } ${className}`}
        style={{
          color: "var(--color-text)",
          backgroundColor: "var(--color-bg)",
          border: `1.5px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
          boxShadow: focused ? "0 0 0 4px rgba(193,68,14,0.10)" : "none",
        }}
        {...props}
      />
      {isPassword && showToggle && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a20.6 20.6 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a20.6 20.6 0 01-2.16 3.02M14.12 14.12a3 3 0 11-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  );
}