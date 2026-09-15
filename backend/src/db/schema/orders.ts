import { pgTable, uuid, varchar, integer, numeric, timestamp, jsonb, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { productVariants } from "./catalogue";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  customerId: uuid("customer_id").references(() => users.id),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  // pending -> confirmed -> processing -> shipped -> delivered
  // pending -> cancelled
  // delivered -> return_requested -> returned
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("unpaid"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  shippingAmount: numeric("shipping_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  couponCode: varchar("coupon_code", { length: 50 }),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot").notNull(),
  shippingMethod: varchar("shipping_method", { length: 100 }),
  paymentMethod: varchar("payment_method", { length: 30 }),
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id),
  productSnapshot: jsonb("product_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 30 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // 'mock' | 'razorpay' | 'stripe' | 'cod'
  providerRef: varchar("provider_ref", { length: 200 }),
  method: varchar("method", { length: 50 }), // 'card' | 'upi' | 'wallet' | 'cod'
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
