import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as ordersService from "./service";
import { ok } from "../../lib/response";

export default async function ordersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireAuth(request);
  });

  app.get("/orders", async (request) => {
    const list = await ordersService.listOrders(request.userId!);
    return ok(list);
  });

  app.get("/orders/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const order = await ordersService.getOrderDetail(request.userId!, id);
    return ok(order);
  });

  app.post("/orders/:id/cancel", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { reason } = z.object({ reason: z.string().max(500).optional() }).parse(request.body ?? {});
    const order = await ordersService.cancelOrder(request.userId!, id, reason);
    return ok(order);
  });

  app.post("/orders/:id/return", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { reason } = z.object({ reason: z.string().min(1).max(500) }).parse(request.body);
    const order = await ordersService.requestReturn(request.userId!, id, reason);
    return ok(order);
  });

  app.get("/orders/:id/tracking", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const events = await ordersService.getTracking(request.userId!, id);
    return ok(events);
  });
}
