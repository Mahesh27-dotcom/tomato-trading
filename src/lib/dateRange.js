export function getDateRange(preset) {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  if (preset === "yesterday") {
    from.setDate(today.getDate() - 1);
    to.setDate(today.getDate() - 1);
  } else if (preset === "week") {
    from.setDate(today.getDate() - today.getDay());
  } else if (preset === "month") {
    from.setDate(1);
  }

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}