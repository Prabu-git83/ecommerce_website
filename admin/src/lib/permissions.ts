export const PERMISSION_KEYS = ["products", "categories", "inventory", "tickets", "orders", "delivery", "payments", "configuration", "themes", "banner", "logo"] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  tickets: "Tickets",
  orders: "Order management",
  delivery: "Delivery",
  payments: "Payment modes",
  configuration: "Configuration",
  themes: "Themes",
  banner: "Homepage banner",
  logo: "Logo",
};

export function hasPermission(
  admin: { role: string; permissions?: string[] } | null,
  key: PermissionKey | PermissionKey[]
): boolean {
  if (!admin) return false;
  if (admin.role === "super_admin") return true;
  const keys = Array.isArray(key) ? key : [key];
  return keys.some((k) => (admin.permissions ?? []).includes(k));
}
