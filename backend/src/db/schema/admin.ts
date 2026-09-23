import { pgTable, uuid, varchar, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { productVariants, warehouses } from "./catalogue";
import { payments } from "./orders";
import { contactMessages } from "./misc";

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 30 }).notNull().default("admin"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per stock change — the audit trail behind "inventory history".
// `quantity` is the signed delta actually applied to qty_on_hand.
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  type: varchar("type", { length: 20 }).notNull(), // 'in' | 'out' | 'adjustment'
  quantity: integer("quantity").notNull(),
  qtyBefore: integer("qty_before").notNull(),
  qtyAfter: integer("qty_after").notNull(),
  reason: varchar("reason", { length: 300 }),
  adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 30 }).notNull().default("processed"),
  providerRef: varchar("provider_ref", { length: 200 }),
  initiatedBy: uuid("initiated_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Lightweight stand-in for a full support-ticket system (out of Phase 2
// scope) — gives admins a place to log customer support history per account.
export const customerNotes = pgTable("customer_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Internal reply/resolution log on a support ticket (a contact_messages row).
export const ticketReplies = pgTable("ticket_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => contactMessages.id, { onDelete: "cascade" }),
  adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Flat key/value store for platform-wide settings editable from the admin
// Configuration page (default tax rate, low-stock threshold, etc).
export const platformSettings = pgTable("platform_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
