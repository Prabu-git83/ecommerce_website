import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as checkoutService from "./service";
import { ok } from "../../lib/response";
import { ApiError } from "../../lib/errors";

const confirmSchema = z.object({
  orderId: z.string().uuid(),
  addressId: z.string().uuid(),
  shippingMethod: z.enum(["standard", "express"]),
});

const payCallbackSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["card", "upi", "wallet", "cod"]),
});

export default async function checkoutRoutes(app: FastifyInstance) {
  app.get("/checkout/shipping-rates", async (request) => {
    const { subtotal } = z.object({ subtotal: z.coerce.number().default(0) }).parse(request.query);
    return ok(checkoutService.getShippingRates(subtotal));
  });

  app.post("/checkout/initiate", async (request, reply) => {
    if (!request.userId) throw ApiError.unauthorized("Please sign in to check out", "auth_required");
    const data = await checkoutService.initiateCheckout(request.cartToken, request.userId);
    reply.status(201);
    return ok(data);
  });

  app.post("/checkout/confirm", async (request) => {
    await app.requireAuth(request);
    const body = confirmSchema.parse(request.body);
    const data = await checkoutService.confirmCheckout(body.orderId, request.userId!, {
      addressId: body.addressId,
      shippingMethod: body.shippingMethod,
    });
    return ok(data);
  });

  app.post("/checkout/payment-callback", async (request) => {
    await app.requireAuth(request);
    const body = payCallbackSchema.parse(request.body);
    const data = await checkoutService.payForOrder(body.orderId, request.userId!, body.method);
    return ok(data);
  });
}
