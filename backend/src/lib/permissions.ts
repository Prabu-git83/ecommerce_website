// The set of module-level permissions a super admin can grant to a regular
// admin. Dashboard is always visible to any authenticated admin; Customers,
// Analytics, and Users & roles remain super-admin-only and are not part of
// this delegable set.
export const PERMISSION_KEYS = ["products", "categories", "inventory", "tickets", "orders", "delivery", "payments", "configuration", "themes", "banner"] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export function isPermissionKey(value: string): value is PermissionKey {
  return (PERMISSION_KEYS as readonly string[]).includes(value);
}
