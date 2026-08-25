"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="toast-wrap">
          <div
            className="toast-card"
            style={{
              backgroundColor: type_bg(toast.type),
              color: "#fff",
            }}
          >
            {toast.type === "success" ? "✓" : "!"} {toast.message}
          </div>
        </div>
      )}
      <style jsx global>{`
        .toast-wrap {
          position: fixed;
          bottom: 24px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 100;
          pointer-events: none;
        }
        .toast-card {
          padding: 12px 20px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          animation: toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both, toastOut 0.3s cubic-bezier(0.22, 1, 0.36, 1) 2.3s both;
        }
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes toastOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .toast-card {
            animation-duration: 0.001s !important;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function type_bg(type) {
  if (type === "error") return "var(--color-danger)";
  return "var(--color-success)";
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op if provider isn't mounted, so this never crashes a page
    return () => {};
  }
  return ctx;
}