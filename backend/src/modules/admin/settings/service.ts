import { db } from "../../../db/client";
import { platformSettings } from "../../../db/schema/index";

export const SETTING_KEYS = [
  "default_tax_rate",
  "low_stock_threshold",
  "free_shipping_threshold",
  "currency",
  "support_email",
  "support_hours",
  "delivery_days_estimate",
  "payment_cod_enabled",
  "payment_card_enabled",
  "payment_upi_enabled",
  "payment_wallet_enabled",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

const DEFAULTS: Record<SettingKey, string> = {
  default_tax_rate: "18",
  low_stock_threshold: "5",
  free_shipping_threshold: "999",
  currency: "INR",
  support_email: "support@arca.local",
  support_hours: "Monday-Saturday, 10am-7pm IST",
  delivery_days_estimate: "3-5",
  payment_cod_enabled: "true",
  payment_card_enabled: "true",
  payment_upi_enabled: "true",
  payment_wallet_enabled: "true",
};

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await db.select().from(platformSettings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const result = {} as Record<SettingKey, string>;
  for (const key of SETTING_KEYS) {
    result[key] = map.get(key) ?? DEFAULTS[key];
  }
  return result;
}

export async function updateSettings(values: Partial<Record<SettingKey, string>>) {
  for (const key of SETTING_KEYS) {
    const value = values[key];
    if (value === undefined) continue;
    await db
      .insert(platformSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date() } });
  }
  return getSettings();
}
