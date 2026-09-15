import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as cartService from "./service";
import { ok } from "../../lib/response";

const addItemSchema = z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20).default(1) });
const updateItemSchema = z.object({ quantity: z.number().int().min(0).max(20) });
const couponSchema = z.object({ code: z.string().min(2).max(50) });

export default async function cartRoutes(app: FastifyInstance) {
  app.get("/cart", async (request) => {
    const data = await cartService.getCartDetail(request.cartToken, request.userId);
    return ok(data);
  });

  app.post("/cart/items", async (request, reply) => {
    const body = addItemSchema.parse(request.body);
    const data = await cartService.addItem(request.cartToken, request.userId, body.variantId, body.quantity);
    reply.status(201);
    return ok(data);
  });

  app.put("/cart/items/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateItemSchema.parse(request.body);
    const data = await cartService.updateItemQuantity(request.cartToken, request.userId, id, body.quantity);
    return ok(data);
  });

  app.delete("/cart/items/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const data = await cartService.removeItem(request.cartToken, request.userId, id);
    return ok(data);
  });

  app.post("/cart/coupon", async (request) => {
    const body = couponSchema.parse(request.body);
    const data = await cartService.applyCoupon(request.cartToken, request.userId, body.code);
    return ok(data);
  });

  app.delete("/cart/coupon", async (request) => {
    const data = await cartService.removeCoupon(request.cartToken, request.userId);
    return ok(data);
  });
}
