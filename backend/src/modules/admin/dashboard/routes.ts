import type { FastifyInstance } from "fastify";
import * as dashboardService from "./service";
import { ok } from "../../../lib/response";

export default async function adminDashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireAdminAuth(request);
  });

  app.get("/dashboard", async () => {
    const summary = await dashboardService.getSummary();
    return ok(summary);
  });
}
