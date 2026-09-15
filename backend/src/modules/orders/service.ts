import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { orders, orderItems, orderStatusHistory, productImages, productVariants } from "../../db/schema/index";
import { ApiError } from "../../lib/errors";

export async function listOrders(userId: string) {
  return db.query.orders.findMany({ where: eq(orders.customerId, userId), orderBy: [desc(orders.createdAt)] });
}

export async function getOrderDetail(userId: string, orderId: string) {
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.customerId, userId)) });
  if (!order) throw ApiError.notFound("Order not found");

  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) });
  const itemsWithImages = await Promise.all(
    items.map(async (item) => {
      const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.id, item.variantId) });
      const image = variant
        ? await db.query.productImages.findFirst({ where: eq(productImages.productId, variant.productId), orderBy: (i, { asc }) => [asc(i.sortOrder)] })
        : null;
      return { ...item, image: image?.url ?? null };
    })
  );

  const history = await db.query.orderStatusHistory.findMany({
    where: eq(orderStatusHistory.orderId, order.id),
    orderBy: [orderStatusHistory.createdAt],
  });

  return { ...order, items: itemsWithImages, history };
}

const CANCELLABLE_STATUSES = new Set(["pending", "confirmed", "processing"]);

export async function cancelOrder(userId: string, orderId: string, reason?: string) {
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.customerId, userId)) });
  if (!order) throw ApiError.notFound("Order not found");
  if (!CANCELLABLE_STATUSES.has(order.status)) {
    throw ApiError.conflict("This order can no longer be cancelled", "not_cancellable");
  }

  const [updated] = await db
    .update(orders)
    .set({ status: "cancelled", cancelReason: reason, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  await db.insert(orderStatusHistory).values({ orderId, status: "cancelled", note: reason ?? "Cancelled by customer" });
  return updated;
}

export async function requestReturn(userId: string, orderId: string, reason: string) {
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.customerId, userId)) });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status !== "delivered") {
    throw ApiError.conflict("Only delivered orders can be returned", "not_returnable");
  }

  const [updated] = await db
    .update(orders)
    .set({ status: "return_requested", updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  await db.insert(orderStatusHistory).values({ orderId, status: "return_requested", note: reason });
  return updated;
}

export async function getTracking(userId: string, orderId: string) {
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.customerId, userId)) });
  if (!order) throw ApiError.notFound("Order not found");
  return db.query.orderStatusHistory.findMany({ where: eq(orderStatusHistory.orderId, orderId), orderBy: [orderStatusHistory.createdAt] });
}
