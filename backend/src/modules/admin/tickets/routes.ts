import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as ticketsService from "./service";
import { ok } from "../../../lib/response";

const STATUSES = ["new", "open", "resolved", "closed"] as const;

export default async function adminTicketRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["tickets"]);
  });

  app.get("/tickets", async (request) => {
    const query = z.object({ status: z.string().optional(), q: z.string().optional() }).parse(request.query);
    const result = await ticketsService.listTickets(query);
    return ok(result.items, { counts: result.counts });
  });

  app.get("/tickets/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const ticket = await ticketsService.getTicket(id);
    return ok(ticket);
  });

  app.put("/tickets/:id/status", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = z.object({ status: z.enum(STATUSES) }).parse(request.body);
    const ticket = await ticketsService.updateStatus(id, status);
    return ok(ticket);
  });

  app.post("/tickets/:id/replies", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { note } = z.object({ note: z.string().min(1).max(2000) }).parse(request.body);
    const created = await ticketsService.addReply(id, note, request.adminUserId!);
    reply.status(201);
    return ok(created);
  });
}
