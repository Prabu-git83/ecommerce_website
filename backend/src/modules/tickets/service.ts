import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { contactMessages, ticketReplies } from "../../db/schema/index";
import { ApiError } from "../../lib/errors";

export async function listTickets(userId: string) {
  return db.query.contactMessages.findMany({
    where: eq(contactMessages.userId, userId),
    orderBy: [desc(contactMessages.createdAt)],
  });
}

export async function getTicket(userId: string, id: string) {
  const ticket = await db.query.contactMessages.findFirst({
    where: and(eq(contactMessages.id, id), eq(contactMessages.userId, userId)),
  });
  if (!ticket) throw ApiError.notFound("Ticket not found");

  const replies = await db.query.ticketReplies.findMany({
    where: eq(ticketReplies.ticketId, id),
    orderBy: [asc(ticketReplies.createdAt)],
  });

  return { ...ticket, replies: replies.map((r) => ({ id: r.id, note: r.note, createdAt: r.createdAt })) };
}
