const UNIT_LABELS = {
  crate: "crates",
  kg: "kg",
};

/**
 * Returns the display label for a given unit value.
 * Defaults to "crates" for null/undefined/unrecognized values.
 */
export function unitLabel(unit) {
  return UNIT_LABELS[unit] || "crates";
}