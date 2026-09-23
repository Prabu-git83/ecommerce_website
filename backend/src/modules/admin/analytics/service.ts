import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../../../db/client";
import { orders, orderItems, products, productVariants, categories, users } from "../../../db/schema/index";

export async function getAnalytics() {
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);

  const [revenueRows, statusRows, topProductRows, categoryRows, customerGrowthRows, totalsRows, customerCountRows] = await Promise.all([
    db
      .select({ day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`, total: sql<string>`sum(${orders.total})` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since90)))
      .groupBy(sql`1`)
      .orderBy(sql`1`),

    db.select({ status: orders.status, count: sql<number>`count(*)::int` }).from(orders).groupBy(orders.status),

    db
      .select({
        name: sql<string>`${orderItems.productSnapshot}->>'name'`,
        unitsSold: sql<number>`sum(${orderItems.quantity})::int`,
        revenue: sql<string>`sum(${orderItems.totalPrice})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(eq(orders.paymentStatus, "paid"))
      .groupBy(sql`1`)
      .orderBy(sql`sum(${orderItems.totalPrice}) desc`)
      .limit(6),

    db
      .select({
        category: sql<string>`coalesce(${categories.name}, 'Uncategorised')`,
        revenue: sql<string>`sum(${orderItems.totalPrice})`,
        unitsSold: sql<number>`sum(${orderItems.quantity})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(productVariants, eq(productVariants.id, orderItems.variantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(orders.paymentStatus, "paid"))
      .groupBy(sql`1`)
      .orderBy(sql`sum(${orderItems.totalPrice}) desc`),

    db
      .select({ week: sql<string>`to_char(date_trunc('week', ${users.createdAt}), 'YYYY-MM-DD')`, count: sql<number>`count(*)::int` })
      .from(users)
      .groupBy(sql`1`)
      .orderBy(sql`1`),

    db
      .select({ totalRevenue: sql<string>`coalesce(sum(${orders.total}), 0)`, totalOrders: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid")),

    db.select({ count: sql<number>`count(*)::int` }).from(users),
  ]);

  const totalRevenue = Number(totalsRows[0]?.totalRevenue ?? 0);
  const totalOrders = totalsRows[0]?.totalOrders ?? 0;

  return {
    totals: {
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
      totalCustomers: customerCountRows[0]?.count ?? 0,
    },
    revenueByDay: revenueRows.map((r) => ({ date: r.day, total: Number(r.total) })),
    ordersByStatus: statusRows,
    topProducts: topProductRows.map((p) => ({ name: p.name ?? "Unknown", unitsSold: p.unitsSold, revenue: Number(p.revenue) })),
    salesByCategory: categoryRows.map((c) => ({ category: c.category, revenue: Number(c.revenue), unitsSold: c.unitsSold })),
    customerGrowth: customerGrowthRows.map((r) => ({ week: r.week, count: r.count })),
  };
}
