import { customAlphabet } from "nanoid";

const numeric = customAlphabet("0123456789", 4);

export function generateOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ORD-${y}${m}${d}-${numeric()}`;
}
