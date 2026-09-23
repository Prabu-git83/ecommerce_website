import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as settingsService from "../settings/service";
import { ok } from "../../../lib/response";

const DELIVERY_PAYMENT_KEYS = [
  "free_shipping_threshold",
  "delivery_days_estimate",
  "payment_cod_enabled",
  "payment_card_enabled",
  "payment_upi_enabled",
  "payment_wallet_enabled",
] as const;

function pick(settings: Record<settingsService.SettingKey, string>) {
  const result = {} as Record<(typeof DELIVERY_PAYMENT_KEYS)[number], string>;
  for (const key of DELIVERY_PAYMENT_KEYS) result[key] = settings[key];
  return result;
}

export default async function adminDeliveryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["delivery", "payments"]);
  });

  app.get("/delivery-payments", async () => {
    const settings = await settingsService.getSettings();
    return ok(pick(settings));
  });

  app.put("/delivery-payments", async (request) => {
    const body = z
      .object({
        free_shipping_threshold: z.string().optional(),
        delivery_days_estimate: z.string().optional(),
        payment_cod_enabled: z.enum(["true", "false"]).optional(),
        payment_card_enabled: z.enum(["true", "false"]).optional(),
        payment_upi_enabled: z.enum(["true", "false"]).optional(),
        payment_wallet_enabled: z.enum(["true", "false"]).optional(),
      })
      .parse(request.body);
    const settings = await settingsService.updateSettings(body);
    return ok(pick(settings));
  });
}
