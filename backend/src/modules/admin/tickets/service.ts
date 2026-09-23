import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../../db/client";
import { contactMessages, ticketReplies } from "../../../db/schema/index";
import { ApiError } from "../../../lib/errors";

export async function listTickets(params: { status?: string; q?: string }) {
  const conditions = [];
  if (params.status) conditions.push(eq(contactMessages.status, params.status));
  if (params.q) {
    conditions.push(
      or(
        ilike(contactMessages.name, `%${params.q}%`),
        ilike(contactMessages.email, `%${params.q}%`),
        ilike(contactMessages.subject, `%${params.q}%`)
      )!
    );
  }

  const items = await db
    .select()
    .from(contactMessages)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(contactMessages.createdAt));

  const allRows = await db.select({ status: contactMessages.status }).from(contactMessages);
  const byStatus: Record<string, number> = {};
  for (const r of allRows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  return { items, counts: { total: allRows.length, byStatus } };
}

export async function getTicket(id: string) {
  const ticket = await db.query.contactMessages.findFirst({ where: eq(contactMessages.id, id) });
  if (!ticket) throw ApiError.notFound("Ticket not found");
  const replies = await db.query.ticketReplies.findMany({
    where: eq(ticketReplies.ticketId, id),
    orderBy: [desc(ticketReplies.createdAt)],
  });
  return { ...ticket, replies };
}

export async function updateStatus(id: string, status: string) {
  const ticket = await db.query.contactMessages.findFirst({ where: eq(contactMessages.id, id) });
  if (!ticket) throw ApiError.notFound("Ticket not found");
  const [updated] = await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id)).returning();
  return updated;
}

export async function addReply(ticketId: string, note: string, adminUserId: string) {
  const ticket = await db.query.contactMessages.findFirst({ where: eq(contactMessages.id, ticketId) });
  if (!ticket) throw ApiError.notFound("Ticket not found");
  const [created] = await db.insert(ticketReplies).values({ ticketId, note, adminUserId }).returning();
  // A reply on a fresh ticket implicitly moves it from "new" to "open".
  if (ticket.status === "new") {
    await db.update(contactMessages).set({ status: "open" }).where(eq(contactMessages.id, ticketId));
  }
  return created;
}
