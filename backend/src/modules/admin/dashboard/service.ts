import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../../../db/client";
import { orders, inventory, payments } from "../../../db/schema/index";

export async function getSummary() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const paidOrders = await db.query.orders.findMany({ where: and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since)) });
  const gmv = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const orderCount = paidOrders.length;
  const aov = orderCount ? gmv / orderCount : 0;

  const allInventory = await db.select().from(inventory);
  const lowStock = allInventory.filter((i) => (i.qtyAvailable ?? 0) > 0 && (i.qtyAvailable ?? 0) <= i.lowStockThreshold);
  const outOfStock = allInventory.filter((i) => (i.qtyAvailable ?? 0) <= 0);

  const awaitingFulfilment = await db.query.orders.findMany({ where: eq(orders.status, "confirmed") });
  const paymentFailedCount = await db.query.payments.findMany({ where: eq(payments.status, "failed") });

  const revenueRows = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      total: sql<string>`sum(${orders.total})`,
    })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return {
    gmv,
    orderCount,
    aov,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    needsAttention: {
      awaitingFulfilment: awaitingFulfilment.length,
      paymentFailed: paymentFailedCount.length,
      lowStockSkus: lowStock.length,
    },
    revenueByDay: revenueRows.map((r) => ({ date: r.day, total: Number(r.total) })),
  };
}
