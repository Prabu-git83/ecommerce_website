import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  orders,
  orderItems,
  orderStatusHistory,
  payments,
  refunds,
  users,
  customerProfiles,
} from "../../../db/schema/index";
import { ApiError } from "../../../lib/errors";

export async function listOrders(params: { status?: string; q?: string; dateFrom?: string; dateTo?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 50, 200);
  const conditions = [];
  if (params.status) conditions.push(eq(orders.status, params.status));
  if (params.dateFrom) conditions.push(gte(orders.createdAt, new Date(params.dateFrom)));
  if (params.dateTo) conditions.push(lte(orders.createdAt, new Date(params.dateTo)));

  let rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      total: orders.total,
      currency: orders.currency,
      createdAt: orders.createdAt,
      customerId: orders.customerId,
      customerEmail: users.email,
      firstName: customerProfiles.firstName,
      lastName: customerProfiles.lastName,
    })
    .from(orders)
    .leftJoin(users, eq(orders.customerId, users.id))
    .leftJoin(customerProfiles, eq(customerProfiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  if (params.q) {
    const q = params.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(q) ||
        (r.customerEmail ?? "").toLowerCase().includes(q) ||
        `${r.firstName ?? ""} ${r.lastName ?? ""}`.toLowerCase().includes(q)
    );
  }

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status,
    paymentStatus: r.paymentStatus,
    paymentMethod: r.paymentMethod,
    total: r.total,
    currency: r.currency,
    createdAt: r.createdAt,
    customerName: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.customerEmail || "Guest",
    customerEmail: r.customerEmail,
  }));
}

export async function getOrderCounts() {
  const rows = await db.select({ status: orders.status, count: sql<number>`count(*)::int` }).from(orders).groupBy(orders.status);
  const counts: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    counts[r.status] = r.count;
    total += r.count;
  }
  return { total, byStatus: counts };
}

export async function getOrder(id: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) throw ApiError.notFound("Order not found");

  const [items, history, paymentRows, customer] = await Promise.all([
    db.query.orderItems.findMany({ where: eq(orderItems.orderId, id) }),
    db.query.orderStatusHistory.findMany({ where: eq(orderStatusHistory.orderId, id), orderBy: [orderStatusHistory.createdAt] }),
    db.query.payments.findMany({ where: eq(payments.orderId, id) }),
    order.customerId ? db.query.users.findFirst({ where: eq(users.id, order.customerId) }) : null,
  ]);

  const paymentIds = paymentRows.map((p) => p.id);
  const refundRows = paymentIds.length
    ? await db.query.refunds.findMany({ where: or(...paymentIds.map((id) => eq(refunds.paymentId, id))) })
    : [];

  const profile = order.customerId
    ? await db.query.customerProfiles.findFirst({ where: eq(customerProfiles.userId, order.customerId) })
    : null;

  return {
    ...order,
    items,
    history,
    payments: paymentRows,
    refunds: refundRows,
    customer: customer ? { id: customer.id, email: customer.email, firstName: profile?.firstName, lastName: profile?.lastName } : null,
  };
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["return_requested"],
  return_requested: ["returned"],
};

export async function updateStatus(id: string, status: string, note: string | undefined, adminUserId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) throw ApiError.notFound("Order not found");

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw ApiError.conflict(`Order can't move from "${order.status}" to "${status}"`, "invalid_transition");
  }

  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date(), ...(status === "cancelled" && note ? { cancelReason: note } : {}) })
    .where(eq(orders.id, id))
    .returning();

  await db.insert(orderStatusHistory).values({ orderId: id, status, note: note ?? `Updated by admin` });
  void adminUserId;
  return updated;
}

export async function processRefund(orderId: string, amount: number, reason: string, adminUserId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.paymentStatus !== "paid") {
    throw ApiError.conflict("Only paid orders can be refunded", "not_refundable");
  }

  const payment = await db.query.payments.findFirst({ where: and(eq(payments.orderId, orderId), eq(payments.status, "captured")) });
  if (!payment) throw ApiError.notFound("No captured payment found for this order");

  if (amount > Number(payment.amount)) {
    throw ApiError.badRequest(`Refund amount can't exceed the captured amount (${payment.amount})`, "refund_too_large");
  }

  const [refund] = await db
    .insert(refunds)
    .values({
      paymentId: payment.id,
      amount: String(amount),
      reason,
      status: "processed",
      providerRef: `refund_mock_${Date.now()}`,
      initiatedBy: adminUserId,
    })
    .returning();

  const fullyRefunded = amount >= Number(payment.amount);
  await db
    .update(payments)
    .set({ status: fullyRefunded ? "refunded" : "partially_refunded" })
    .where(eq(payments.id, payment.id));

  await db
    .update(orders)
    .set({ paymentStatus: fullyRefunded ? "refunded" : "partially_refunded", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await db.insert(orderStatusHistory).values({
    orderId,
    status: order.status,
    note: `Refund of ${order.currency} ${amount} processed — ${reason}`,
  });

  return refund;
}
