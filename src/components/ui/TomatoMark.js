export default function TomatoMark({ size = 40 }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--color-accent)",
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8.5c-3.5 0-6.2 2.6-6.2 6.4C5.8 18.4 8.4 21 12 21s6.2-2.6 6.2-6.1c0-3.8-2.7-6.4-6.2-6.4z"
          fill="white"
        />
        <path
          d="M12 8.5c1-1.6 1-2.9.3-4.2M12 8.5c-1-1.6-1-2.9-.3-4.2M9.3 5.3c.9-.5 1.9-.6 2.7-.3M14.7 5.3c-.9-.5-1.9-.6-2.7-.3"
          stroke="white"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}