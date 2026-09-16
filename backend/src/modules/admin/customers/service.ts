import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../../db/client";
import { users, customerProfiles, addresses, orders, customerNotes } from "../../../db/schema/index";
import { ApiError } from "../../../lib/errors";

export async function listCustomers(params: { q?: string; status?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 50, 200);
  const conditions = [];
  if (params.status) conditions.push(eq(users.status, params.status));
  if (params.q) {
    conditions.push(or(ilike(users.email, `%${params.q}%`), ilike(customerProfiles.firstName, `%${params.q}%`), ilike(customerProfiles.lastName, `%${params.q}%`))!);
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      status: users.status,
      createdAt: users.createdAt,
      firstName: customerProfiles.firstName,
      lastName: customerProfiles.lastName,
      orderCount: sql<number>`(select count(*)::int from ${orders} where ${orders.customerId} = ${users.id})`,
      totalSpend: sql<string>`coalesce((select sum(${orders.total}) from ${orders} where ${orders.customerId} = ${users.id} and ${orders.paymentStatus} = 'paid'), 0)`,
    })
    .from(users)
    .leftJoin(customerProfiles, eq(customerProfiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return rows;
}

export async function getCustomer(id: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) throw ApiError.notFound("Customer not found");

  const [profile, addressList, orderList, notes] = await Promise.all([
    db.query.customerProfiles.findFirst({ where: eq(customerProfiles.userId, id) }),
    db.query.addresses.findMany({ where: eq(addresses.userId, id) }),
    db.query.orders.findMany({ where: eq(orders.customerId, id), orderBy: [desc(orders.createdAt)] }),
    db.query.customerNotes.findMany({ where: eq(customerNotes.userId, id), orderBy: [desc(customerNotes.createdAt)] }),
  ]);

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    addresses: addressList,
    orders: orderList,
    notes,
  };
}

export async function updateStatus(id: string, status: "active" | "suspended") {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) throw ApiError.notFound("Customer not found");
  const [updated] = await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  return updated;
}

export async function addNote(userId: string, note: string, adminUserId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw ApiError.notFound("Customer not found");
  const [created] = await db.insert(customerNotes).values({ userId, note, adminUserId }).returning();
  return created;
}
