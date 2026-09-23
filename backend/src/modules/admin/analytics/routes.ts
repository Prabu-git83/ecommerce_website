import type { FastifyInstance } from "fastify";
import * as analyticsService from "./service";
import { ok } from "../../../lib/response";

export default async function adminAnalyticsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireSuperAdmin(request);
  });

  app.get("/analytics", async () => {
    const data = await analyticsService.getAnalytics();
    return ok(data);
  });
}
