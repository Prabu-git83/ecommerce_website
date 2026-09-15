import { pgTable, uuid, varchar, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";
import { productVariants } from "./catalogue";

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // 'percent' | 'fixed'
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  minSubtotal: numeric("min_subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),
  timesUsed: integer("times_used").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | converted | abandoned
  couponCode: varchar("coupon_code", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
