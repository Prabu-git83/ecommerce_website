import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as inventoryService from "./service";
import { ok } from "../../../lib/response";
import { db } from "../../../db/client";
import { warehouses } from "../../../db/schema/index";

const adjustSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int().min(0),
  reason: z.string().max(300).optional(),
});

export default async function adminInventoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["inventory"]);
  });

  app.get("/warehouses", async () => {
    const list = await db.select().from(warehouses);
    return ok(list);
  });

  app.get("/inventory", async (request) => {
    const { lowStockOnly, q } = z
      .object({ lowStockOnly: z.coerce.boolean().optional(), q: z.string().optional() })
      .parse(request.query);
    const items = await inventoryService.listInventory({ lowStockOnly, q });
    return ok(items);
  });

  app.put("/inventory/:variantId/threshold", async (request) => {
    const { variantId } = z.object({ variantId: z.string().uuid() }).parse(request.params);
    const { lowStockThreshold } = z.object({ lowStockThreshold: z.number().int().min(0) }).parse(request.body);
    const updated = await inventoryService.updateThreshold(variantId, lowStockThreshold);
    return ok(updated);
  });

  app.post("/inventory/:variantId/adjust", async (request) => {
    const { variantId } = z.object({ variantId: z.string().uuid() }).parse(request.params);
    const body = adjustSchema.parse(request.body);
    const updated = await inventoryService.adjustStock(variantId, body, request.adminUserId!);
    return ok(updated);
  });

  app.get("/inventory/:variantId/history", async (request) => {
    const { variantId } = z.object({ variantId: z.string().uuid() }).parse(request.params);
    const history = await inventoryService.getHistory(variantId);
    return ok(history);
  });
}
