import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as themesService from "./service";
import { THEMES } from "../../../lib/themes";
import { ok } from "../../../lib/response";

export default async function adminThemeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireSuperAdmin(request);
  });

  app.get("/themes", async () => {
    const result = await themesService.listThemes();
    return ok(result);
  });

  app.put("/themes/active", async (request) => {
    const themeIds = THEMES.map((t) => t.id) as [string, ...string[]];
    const { themeId } = z.object({ themeId: z.enum(themeIds) }).parse(request.body);
    const result = await themesService.setActiveTheme(themeId);
    return ok(result);
  });
}
