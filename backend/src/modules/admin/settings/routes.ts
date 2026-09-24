import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as settingsService from "./service";
import { ok } from "../../../lib/response";

export default async function adminSettingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["configuration"]);
  });

  app.get("/settings", async () => {
    const settings = await settingsService.getSettings();
    return ok(settings);
  });

  app.put("/settings", async (request) => {
    const body = z.record(z.string()).parse(request.body);
    const settings = await settingsService.updateSettings(body as Partial<Record<settingsService.SettingKey, string>>);
    return ok(settings);
  });
}
