import { pgTable, uuid, varchar, text, boolean, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  name: varchar("name", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  brand: varchar("brand", { length: 150 }),
  description: text("description"),
  shortDesc: varchar("short_desc", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  isFeatured: boolean("is_featured").notNull().default(false),
  metaTitle: varchar("meta_title", { length: 300 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 300 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  comparePrice: numeric("compare_price", { precision: 12, scale: 2 }),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }), // percent; null = platform default (18% GST)
  weightGrams: integer("weight_grams"),
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  isDefault: boolean("is_default").notNull().default(false),
});

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 30 }).notNull().unique(),
});

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  qtyOnHand: integer("qty_on_hand").notNull().default(0),
  qtyReserved: integer("qty_reserved").notNull().default(0),
  qtyAvailable: integer("qty_available").generatedAlwaysAs(
    sql`(qty_on_hand - qty_reserved)`
  ),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
