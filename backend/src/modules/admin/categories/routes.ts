import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as categoriesService from "./service";
import { ok } from "../../../lib/response";

const categoryInputSchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export default async function adminCategoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["categories"]);
  });

  app.get("/categories", async () => {
    const tree = await categoriesService.listCategoriesTree();
    return ok(tree);
  });

  app.post("/categories", async (request, reply) => {
    const body = categoryInputSchema.parse(request.body);
    const category = await categoriesService.createCategory({ ...body, parentId: body.parentId ?? null });
    reply.status(201);
    return ok(category);
  });

  app.put("/categories/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = categoryInputSchema.partial().parse(request.body);
    const category = await categoriesService.updateCategory(id, body);
    return ok(category);
  });

  app.delete("/categories/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const category = await categoriesService.deactivateCategory(id);
    return ok(category);
  });
}
