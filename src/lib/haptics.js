// Subtle haptic feedback for important actions only (save, delete, confirm, payment).
// Silently does nothing on unsupported devices/browsers — safe to call anywhere.

const PATTERNS = {
  success: 15,        // short tap — save, confirm, mark complete
  warning: [10, 40, 10], // double pulse — delete, reject, discard
  error: [20, 30, 20, 30, 20], // stronger triple — failed payment, critical error
};

export function haptic(type = "success") {
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;

  try {
    navigator.vibrate(PATTERNS[type] || PATTERNS.success);
  } catch {
    // no-op — some browsers throw if called outside a user gesture
  }
}