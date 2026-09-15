import { and, asc, desc, eq, gte, lte, ilike, sql, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { categories, products, productVariants, productImages, inventory } from "../../db/schema/index";

export async function getCategoryTree() {
  const rows = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.sortOrder)],
  });
  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const key = row.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, [] as any);
    (byParent.get(key) as any).push(row);
  }
  function build(parentId: string | null): any[] {
    return (byParent.get(parentId) ?? []).map((c: any) => ({ ...c, children: build(c.id) }));
  }
  return build(null);
}

async function attachImagesAndPriceRange(productRows: (typeof products.$inferSelect)[]) {
  return Promise.all(
    productRows.map(async (p) => {
      const image = await db.query.productImages.findFirst({
        where: eq(productImages.productId, p.id),
        orderBy: [asc(productImages.sortOrder)],
      });
      const variants = await db.query.productVariants.findMany({ where: eq(productVariants.productId, p.id) });
      const prices = variants.map((v) => Number(v.price));
      const comparePrices = variants.map((v) => (v.comparePrice ? Number(v.comparePrice) : null)).filter(Boolean) as number[];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDesc: p.shortDesc,
        image: image?.url ?? null,
        price: prices.length ? Math.min(...prices) : null,
        comparePrice: comparePrices.length ? Math.max(...comparePrices) : null,
        isFeatured: p.isFeatured,
      };
    })
  );
}

export async function listProducts(params: {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest";
  cursor?: string;
  limit?: number;
}) {
  const limit = Math.min(params.limit ?? 24, 60);
  const conditions = [eq(products.status, "active")];

  if (params.categorySlug) {
    const category = await db.query.categories.findFirst({ where: eq(categories.slug, params.categorySlug) });
    if (!category) return { items: [], nextCursor: null, category: null };
    // A parent category page also shows products filed under its children
    // (e.g. "Electronics" includes items filed under "Audio"/"Wearables").
    const children = await db.query.categories.findMany({ where: eq(categories.parentId, category.id) });
    const categoryIds = [category.id, ...children.map((c) => c.id)];
    conditions.push(inArray(products.categoryId, categoryIds));
  }

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(params.sort === "newest" ? desc(products.createdAt) : desc(products.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  let items = await attachImagesAndPriceRange(pageRows);

  if (params.minPrice !== undefined) items = items.filter((i) => (i.price ?? 0) >= params.minPrice!);
  if (params.maxPrice !== undefined) items = items.filter((i) => (i.price ?? 0) <= params.maxPrice!);
  if (params.sort === "price_asc") items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  if (params.sort === "price_desc") items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

  const category = params.categorySlug
    ? await db.query.categories.findFirst({ where: eq(categories.slug, params.categorySlug) })
    : null;

  return { items, nextCursor: hasMore ? pageRows[pageRows.length - 1].id : null, category };
}

export async function getFeaturedProducts(limit = 8) {
  const rows = await db.query.products.findMany({
    where: and(eq(products.status, "active"), eq(products.isFeatured, true)),
    limit,
    orderBy: [desc(products.createdAt)],
  });
  return attachImagesAndPriceRange(rows);
}

export async function searchProducts(q: string, limit = 24) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.status, "active"), ilike(products.name, `%${q}%`)))
    .limit(limit);
  return attachImagesAndPriceRange(rows);
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({ where: and(eq(products.slug, slug), eq(products.status, "active")) });
  if (!product) return null;

  const [images, variants, category] = await Promise.all([
    db.query.productImages.findMany({ where: eq(productImages.productId, product.id), orderBy: [asc(productImages.sortOrder)] }),
    db.query.productVariants.findMany({ where: eq(productVariants.productId, product.id) }),
    product.categoryId ? db.query.categories.findFirst({ where: eq(categories.id, product.categoryId) }) : null,
  ]);

  const variantIds = variants.map((v) => v.id);
  const inventoryRows = variantIds.length
    ? await db.select().from(inventory).where(inArray(inventory.variantId, variantIds))
    : [];
  const invByVariant = new Map(inventoryRows.map((i) => [i.variantId, i]));

  const variantsWithStock = variants.map((v) => {
    const inv = invByVariant.get(v.id);
    return {
      ...v,
      qtyAvailable: inv?.qtyAvailable ?? 0,
      lowStock: (inv?.qtyAvailable ?? 0) > 0 && (inv?.qtyAvailable ?? 0) <= (inv?.lowStockThreshold ?? 5),
    };
  });

  const related = await db.query.products.findMany({
    where: and(eq(products.status, "active"), product.categoryId ? eq(products.categoryId, product.categoryId) : sql`true`),
    limit: 5,
  });
  const relatedFiltered = related.filter((r) => r.id !== product.id).slice(0, 4);

  return {
    ...product,
    images: images.map((i) => i.url),
    variants: variantsWithStock,
    category,
    related: await attachImagesAndPriceRange(relatedFiltered),
  };
}
