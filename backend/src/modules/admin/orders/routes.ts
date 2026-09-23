import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as ordersService from "./service";
import { ok } from "../../../lib/response";

const listQuerySchema = z.object({
  status: z.string().optional(),
  q: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().optional(),
});

const statusSchema = z.object({
  status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned"]),
  note: z.string().max(500).optional(),
});

const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1).max(500),
});

export default async function adminOrderRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["orders"]);
  });

  app.get("/orders", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const items = await ordersService.listOrders(query);
    const counts = await ordersService.getOrderCounts();
    return ok(items, { counts });
  });

  app.get("/orders/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const order = await ordersService.getOrder(id);
    return ok(order);
  });

  app.put("/orders/:id/status", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = statusSchema.parse(request.body);
    const order = await ordersService.updateStatus(id, body.status, body.note, request.adminUserId!);
    return ok(order);
  });

  app.post("/orders/:id/refund", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = refundSchema.parse(request.body);
    const refund = await ordersService.processRefund(id, body.amount, body.reason, request.adminUserId!);
    return ok(refund);
  });
}
