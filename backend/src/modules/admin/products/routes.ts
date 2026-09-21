import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as productsService from "./service";
import { ok } from "../../../lib/response";
import { ApiError } from "../../../lib/errors";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const listQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().optional(),
});

const productInputSchema = z.object({
  name: z.string().min(1).max(300),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().max(5000).optional(),
  shortDesc: z.string().max(500).optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(300).optional(),
  metaDescription: z.string().max(500).optional(),
});

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(300).optional(),
});

const variantSchema = z.object({
  name: z.string().max(200).optional(),
  sku: z.string().min(1).max(100),
  price: z.number().positive(),
  comparePrice: z.number().positive().nullable().optional(),
  taxRate: z.number().min(0).max(100).nullable().optional(),
  weightGrams: z.number().int().positive().nullable().optional(),
  attributes: z.record(z.string()).optional(),
  isDefault: z.boolean().optional(),
  initialStock: z.number().int().min(0).default(0),
  warehouseId: z.string().uuid().optional(),
});

export default async function adminProductRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireAdminAuth(request);
  });

  app.get("/products", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const items = await productsService.listProducts(query);
    return ok(items);
  });

  app.get("/products/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const product = await productsService.getProduct(id);
    return ok(product);
  });

  app.post("/products", async (request, reply) => {
    const body = productInputSchema.parse(request.body);
    const product = await productsService.createProduct({ ...body, categoryId: body.categoryId ?? null });
    reply.status(201);
    return ok(product);
  });

  app.put("/products/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = productInputSchema.partial().parse(request.body);
    const product = await productsService.updateProduct(id, body);
    return ok(product);
  });

  app.delete("/products/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const product = await productsService.archiveProduct(id);
    return ok(product);
  });

  app.post("/products/:id/images", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = imageSchema.parse(request.body);
    const image = await productsService.addImage(id, body.url, body.alt);
    reply.status(201);
    return ok(image);
  });

  app.post("/products/:id/images/upload", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const created = [];
    for await (const file of request.files()) {
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        throw ApiError.badRequest(`Unsupported image type: ${file.mimetype}`, "unsupported_file_type");
      }
      const buffer = await file.toBuffer();
      const image = await productsService.uploadImage(id, file.filename, file.mimetype, buffer);
      created.push(image);
    }
    if (created.length === 0) throw ApiError.badRequest("No files uploaded", "no_files");
    reply.status(201);
    return ok(created);
  });

  app.delete("/products/:id/images/:imageId", async (request) => {
    const { id, imageId } = z.object({ id: z.string().uuid(), imageId: z.string().uuid() }).parse(request.params);
    await productsService.removeImage(id, imageId);
    return ok({ success: true });
  });

  app.post("/products/:id/variants", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = variantSchema.parse(request.body);
    const variant = await productsService.addVariant(id, body, body.initialStock, body.warehouseId);
    reply.status(201);
    return ok(variant);
  });

  app.put("/products/:id/variants/:variantId", async (request) => {
    const { id, variantId } = z.object({ id: z.string().uuid(), variantId: z.string().uuid() }).parse(request.params);
    const body = variantSchema.partial().parse(request.body);
    const variant = await productsService.updateVariant(id, variantId, body);
    return ok(variant);
  });

  app.delete("/products/:id/variants/:variantId", async (request) => {
    const { id, variantId } = z.object({ id: z.string().uuid(), variantId: z.string().uuid() }).parse(request.params);
    await productsService.deleteVariant(id, variantId);
    return ok({ success: true });
  });
}
