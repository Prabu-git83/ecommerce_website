import { desc, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { inventory, productVariants, products, stockMovements, warehouses } from "../../../db/schema/index";
import { ApiError } from "../../../lib/errors";

export async function listInventory(params: { lowStockOnly?: boolean; q?: string }) {
  const rows = await db
    .select({
      inventoryId: inventory.id,
      variantId: inventory.variantId,
      qtyOnHand: inventory.qtyOnHand,
      qtyReserved: inventory.qtyReserved,
      qtyAvailable: inventory.qtyAvailable,
      lowStockThreshold: inventory.lowStockThreshold,
      updatedAt: inventory.updatedAt,
      sku: productVariants.sku,
      variantName: productVariants.name,
      productId: products.id,
      productName: products.name,
      warehouseId: warehouses.id,
      warehouseName: warehouses.name,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
    .orderBy(products.name);

  let items = rows;
  if (params.lowStockOnly) {
    items = items.filter((r) => (r.qtyAvailable ?? 0) <= r.lowStockThreshold);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    items = items.filter((r) => r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q));
  }
  return items;
}

export async function updateThreshold(variantId: string, lowStockThreshold: number) {
  const existing = await db.query.inventory.findFirst({ where: eq(inventory.variantId, variantId) });
  if (!existing) throw ApiError.notFound("Inventory record not found for this variant");
  const [updated] = await db
    .update(inventory)
    .set({ lowStockThreshold, updatedAt: new Date() })
    .where(eq(inventory.variantId, variantId))
    .returning();
  return updated;
}

export async function adjustStock(
  variantId: string,
  input: { type: "in" | "out" | "adjustment"; quantity: number; reason?: string },
  adminUserId: string
) {
  const record = await db.query.inventory.findFirst({ where: eq(inventory.variantId, variantId) });
  if (!record) throw ApiError.notFound("Inventory record not found for this variant");

  const qtyBefore = record.qtyOnHand;
  let qtyAfter: number;
  let delta: number;

  if (input.type === "in") {
    delta = input.quantity;
    qtyAfter = qtyBefore + delta;
  } else if (input.type === "out") {
    if (input.quantity > qtyBefore) {
      throw ApiError.badRequest(`Only ${qtyBefore} in stock — can't remove ${input.quantity}`, "insufficient_stock");
    }
    delta = -input.quantity;
    qtyAfter = qtyBefore + delta;
  } else {
    // adjustment: quantity is the corrected absolute qty_on_hand (a recount)
    qtyAfter = input.quantity;
    delta = qtyAfter - qtyBefore;
  }

  const [updated] = await db
    .update(inventory)
    .set({ qtyOnHand: qtyAfter, updatedAt: new Date() })
    .where(eq(inventory.variantId, variantId))
    .returning();

  await db.insert(stockMovements).values({
    variantId,
    warehouseId: record.warehouseId,
    type: input.type,
    quantity: delta,
    qtyBefore,
    qtyAfter,
    reason: input.reason,
    adminUserId,
  });

  return updated;
}

export async function getHistory(variantId: string) {
  return db.query.stockMovements.findMany({
    where: eq(stockMovements.variantId, variantId),
    orderBy: [desc(stockMovements.createdAt)],
  });
}
