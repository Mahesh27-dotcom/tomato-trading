"use client";

export default function DashboardTemplate({ children }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        minHeight: "100vh",
        animation: "pageEnter 0.23s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      {children}
      <style jsx global>{`
        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateY(9px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}