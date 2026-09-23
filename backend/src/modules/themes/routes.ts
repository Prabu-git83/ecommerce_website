import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { platformSettings } from "../../db/schema/index";
import { getTheme, DEFAULT_THEME_ID } from "../../lib/themes";
import { ok } from "../../lib/response";

export default async function themesRoutes(app: FastifyInstance) {
  app.get("/themes/active", async () => {
    const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, "active_theme_id") });
    const theme = getTheme(row?.value ?? DEFAULT_THEME_ID);
    return ok({ id: theme.id, name: theme.name, tokens: theme.tokens });
  });
}
