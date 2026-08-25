import TomatoMark from "./TomatoMark";

export function Shell({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="page-enter shell-card max-w-sm w-full rounded-[28px] p-7"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 1px 2px rgba(45,42,38,0.04), 0 12px 32px -12px rgba(45,42,38,0.12)",
        }}
      >
        {children}
      </div>
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .shell-card, .brand-icon-wrap, .primary-btn {
            animation-duration: 0.001s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}

export function BrandHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="flex items-start gap-3.5 mb-8">
      <div className="brand-icon-wrap">
        <TomatoMark size={44} />
      </div>
      <div className="pt-0.5">
        {eyebrow && (
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-0.5 brand-eyebrow"
            style={{ color: "var(--color-accent)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="text-[22px] font-semibold leading-tight tracking-tight brand-title"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] mt-0.5 brand-subtitle" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <style jsx>{`
        .brand-icon-wrap {
          animation: popIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .brand-eyebrow {
          animation: fadeIn 0.4s ease-out 0.1s both;
        }
        .brand-title {
          animation: fadeIn 0.4s ease-out 0.15s both;
        }
        .brand-subtitle {
          animation: fadeIn 0.4s ease-out 0.2s both;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function PrimaryButton({ children, loading, className = "", ...props }) {
  return (
    <button
      className={`primary-btn btn-primary w-full text-white rounded-2xl py-3.5 font-medium text-[15px] disabled:opacity-50 disabled:active:scale-100 ${className}`}
      style={{
        backgroundColor: "var(--color-accent)",
        boxShadow: "0 4px 12px -2px rgba(193,68,14,0.35)",
      }}
      onMouseDown={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent-hover)")}
      onMouseUp={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent)")}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner /> {typeof children === "string" ? children : "Loading..."}
        </span>
      ) : (
        children
      )}
      <style jsx>{`
        .primary-btn {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.15s ease-out;
        }
        .primary-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        @media (hover: hover) {
          .primary-btn:not(:disabled):hover {
            box-shadow: 0 6px 16px -2px rgba(193,68,14,0.45);
          }
        }
      `}</style>
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}