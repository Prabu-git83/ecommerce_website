import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomBytes } from "node:crypto";
import { env } from "../config/env";

declare module "fastify" {
  interface FastifyRequest {
    cartToken: string;
  }
}

// Every request gets (or keeps) a guest cart token cookie so cart/checkout
// works before login; the cart is merged into the account on login.
export default fp(async (app: FastifyInstance) => {
  app.decorateRequest("cartToken", "");

  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    let token = request.cookies[env.CART_COOKIE_NAME];
    if (!token) {
      token = randomBytes(24).toString("hex");
      reply.setCookie(env.CART_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    request.cartToken = token;
  });
});
