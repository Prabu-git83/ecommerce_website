import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { env } from "./config/env";
import { registerErrorHandler } from "./plugins/errorHandler";
import authPlugin from "./plugins/auth";
import cartPlugin from "./plugins/cart";

import authRoutes from "./modules/auth/routes";
import customerRoutes from "./modules/customers/routes";
import catalogueRoutes from "./modules/catalogue/routes";
import cartRoutes from "./modules/cart/routes";
import checkoutRoutes from "./modules/checkout/routes";
import ordersRoutes from "./modules/orders/routes";
import contactRoutes from "./modules/contact/routes";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "info" : "warn",
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } } : undefined,
    },
  });

  await app.register(cors, {
    origin: [env.WEB_APP_URL],
    credentials: true,
  });
  await app.register(cookie, { secret: env.COOKIE_SECRET });

  registerErrorHandler(app);
  await app.register(authPlugin);
  await app.register(cartPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(
    async (v1) => {
      await v1.register(authRoutes);
      await v1.register(customerRoutes);
      await v1.register(catalogueRoutes);
      await v1.register(cartRoutes);
      await v1.register(checkoutRoutes);
      await v1.register(ordersRoutes);
      await v1.register(contactRoutes);
    },
    { prefix: "/v1" }
  );

  return app;
}
