import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as catalogueService from "./service";
import { ok } from "../../lib/response";
import { ApiError } from "../../lib/errors";

const listQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().optional(),
});

export default async function catalogueRoutes(app: FastifyInstance) {
  app.get("/categories", async () => {
    const tree = await catalogueService.getCategoryTree();
    return ok(tree);
  });

  app.get("/products/featured", async (request) => {
    const { limit } = z.object({ limit: z.coerce.number().optional() }).parse(request.query);
    const items = await catalogueService.getFeaturedProducts(limit);
    return ok(items);
  });

  app.get("/products/search", async (request) => {
    const { q, limit } = z.object({ q: z.string().min(1), limit: z.coerce.number().optional() }).parse(request.query);
    const items = await catalogueService.searchProducts(q, limit);
    return ok(items);
  });

  app.get("/products/:slug", async (request) => {
    const { slug } = z.object({ slug: z.string() }).parse(request.params);
    const product = await catalogueService.getProductBySlug(slug);
    if (!product) throw ApiError.notFound("Product not found");
    return ok(product);
  });

  app.get("/products", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const result = await catalogueService.listProducts({
      categorySlug: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
      cursor: query.cursor,
      limit: query.limit,
    });
    return ok(result.items, { nextCursor: result.nextCursor, category: result.category });
  });

  app.get("/categories/:slug/products", async (request) => {
    const { slug } = z.object({ slug: z.string() }).parse(request.params);
    const query = listQuerySchema.parse(request.query);
    const result = await catalogueService.listProducts({ ...query, categorySlug: slug });
    return ok(result.items, { nextCursor: result.nextCursor, category: result.category });
  });
}
