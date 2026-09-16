export function formatMoney(value: number | string, currency = "INR") {
  const n = typeof value === "string" ? Number(value) : value;
  if (currency === "INR") {
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
