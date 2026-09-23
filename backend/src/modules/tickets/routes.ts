import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as ticketsService from "./service";
import { ok } from "../../lib/response";

export default async function ticketsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireAuth(request);
  });

  app.get("/tickets", async (request) => {
    const items = await ticketsService.listTickets(request.userId!);
    return ok(items);
  });

  app.get("/tickets/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const ticket = await ticketsService.getTicket(request.userId!, id);
    return ok(ticket);
  });
}
