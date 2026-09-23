import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { platformSettings } from "../../../db/schema/index";
import { THEMES, DEFAULT_THEME_ID, getTheme } from "../../../lib/themes";
import { ApiError } from "../../../lib/errors";

const ACTIVE_THEME_KEY = "active_theme_id";

export async function getActiveThemeId(): Promise<string> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, ACTIVE_THEME_KEY) });
  return row?.value ?? DEFAULT_THEME_ID;
}

export async function listThemes() {
  const activeThemeId = await getActiveThemeId();
  return { themes: THEMES, activeThemeId };
}

export async function setActiveTheme(themeId: string) {
  if (!THEMES.some((t) => t.id === themeId)) throw ApiError.badRequest("Unknown theme", "unknown_theme");
  await db
    .insert(platformSettings)
    .values({ key: ACTIVE_THEME_KEY, value: themeId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value: themeId, updatedAt: new Date() } });
  return { themes: THEMES, activeThemeId: themeId };
}

export { getTheme };
