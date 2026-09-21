import { and, asc, desc, eq, ilike, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../../db/client";
import {
  products,
  productImages,
  productVariants,
  inventory,
  categories,
  warehouses,
} from "../../../db/schema/index";
import { slugify } from "../../../lib/slugify";
import { ApiError } from "../../../lib/errors";
import { uploadObject } from "../../../lib/storage";

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  // Small collision loop — fine at this catalogue size, avoids a dedicated uniqueness-check endpoint.
  while (true) {
    const existing = await db.query.products.findFirst({ where: eq(products.slug, slug) });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function listProducts(params: { status?: string; category?: string; q?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 50, 200);
  const conditions = [];
  if (params.status) conditions.push(eq(products.status, params.status));
  if (params.q) conditions.push(ilike(products.name, `%${params.q}%`));
  if (params.category) {
    const category = await db.query.categories.findFirst({ where: eq(categories.slug, params.category) });
    if (category) {
      // Include products filed under this category's children too (e.g. "Electronics" covers "Audio"/"Wearables").
      const children = await db.query.categories.findMany({ where: eq(categories.parentId, category.id) });
      conditions.push(inArray(products.categoryId, [category.id, ...children.map((c) => c.id)]));
    }
  }

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt))
    .limit(limit);

  return Promise.all(
    rows.map(async (p) => {
      const variants = await db.query.productVariants.findMany({ where: eq(productVariants.productId, p.id) });
      const variantIds = variants.map((v) => v.id);
      const inventoryRows = variantIds.length
        ? await db.select().from(inventory).where(inArray(inventory.variantId, variantIds))
        : [];
      const totalStock = inventoryRows.reduce((sum, i) => sum + (i.qtyAvailable ?? 0), 0);
      const image = await db.query.productImages.findFirst({
        where: eq(productImages.productId, p.id),
        orderBy: [asc(productImages.sortOrder)],
      });
      const prices = variants.map((v) => Number(v.price));
      const category = p.categoryId ? await db.query.categories.findFirst({ where: eq(categories.id, p.categoryId) }) : null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        status: p.status,
        isFeatured: p.isFeatured,
        image: image?.url ?? null,
        price: prices.length ? Math.min(...prices) : null,
        variantCount: variants.length,
        totalStock,
        category: category ? { id: category.id, name: category.name } : null,
        createdAt: p.createdAt,
      };
    })
  );
}

export async function getProduct(id: string) {
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) throw ApiError.notFound("Product not found");

  const [images, variants, category] = await Promise.all([
    db.query.productImages.findMany({ where: eq(productImages.productId, id), orderBy: [asc(productImages.sortOrder)] }),
    db.query.productVariants.findMany({ where: eq(productVariants.productId, id) }),
    product.categoryId ? db.query.categories.findFirst({ where: eq(categories.id, product.categoryId) }) : null,
  ]);

  const variantIds = variants.map((v) => v.id);
  const inventoryRows = variantIds.length
    ? await db.select().from(inventory).where(inArray(inventory.variantId, variantIds))
    : [];
  const invByVariant = new Map(inventoryRows.map((i) => [i.variantId, i]));

  return {
    ...product,
    images,
    category,
    variants: variants.map((v) => ({ ...v, inventory: invByVariant.get(v.id) ?? null })),
  };
}

export type ProductInput = {
  name: string;
  brand?: string;
  categoryId: string | null;
  description?: string;
  shortDesc?: string;
  status: string;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
};

export async function createProduct(input: ProductInput) {
  const slug = await uniqueSlug(input.name);
  const [product] = await db
    .insert(products)
    .values({
      name: input.name,
      slug,
      brand: input.brand,
      categoryId: input.categoryId,
      description: input.description,
      shortDesc: input.shortDesc,
      status: input.status,
      isFeatured: input.isFeatured,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    })
    .returning();
  return product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!existing) throw ApiError.notFound("Product not found");

  const slug = input.name && input.name !== existing.name ? await uniqueSlug(input.name, id) : undefined;

  const [updated] = await db
    .update(products)
    .set({ ...input, ...(slug ? { slug } : {}) })
    .where(eq(products.id, id))
    .returning();
  return updated;
}

export async function archiveProduct(id: string) {
  const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!existing) throw ApiError.notFound("Product not found");
  const [updated] = await db.update(products).set({ status: "archived" }).where(eq(products.id, id)).returning();
  return updated;
}

export async function addImage(productId: string, url: string, alt?: string) {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) throw ApiError.notFound("Product not found");

  const existing = await db.query.productImages.findMany({ where: eq(productImages.productId, productId) });
  const [image] = await db
    .insert(productImages)
    .values({ productId, url, alt, sortOrder: existing.length })
    .returning();
  return image;
}

export async function uploadImage(productId: string, filename: string, contentType: string, buffer: Buffer) {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) throw ApiError.notFound("Product not found");

  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const key = `products/${productId}/${nanoid()}${ext}`;
  const url = await uploadObject(key, buffer, contentType);

  const existing = await db.query.productImages.findMany({ where: eq(productImages.productId, productId) });
  const [image] = await db
    .insert(productImages)
    .values({ productId, url, alt: product.name, sortOrder: existing.length })
    .returning();
  return image;
}

export async function removeImage(productId: string, imageId: string) {
  const image = await db.query.productImages.findFirst({ where: and(eq(productImages.id, imageId), eq(productImages.productId, productId)) });
  if (!image) throw ApiError.notFound("Image not found");
  await db.delete(productImages).where(eq(productImages.id, imageId));
}

export type VariantInput = {
  name?: string;
  sku: string;
  price: number;
  comparePrice?: number | null;
  taxRate?: number | null;
  weightGrams?: number | null;
  attributes?: Record<string, string>;
  isDefault?: boolean;
};

export async function addVariant(productId: string, input: VariantInput, initialStock: number, warehouseId?: string) {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) throw ApiError.notFound("Product not found");

  const existingSku = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, input.sku) });
  if (existingSku) throw ApiError.conflict("A variant with this SKU already exists", "sku_taken");

  const [variant] = await db
    .insert(productVariants)
    .values({
      productId,
      name: input.name,
      sku: input.sku,
      price: String(input.price),
      comparePrice: input.comparePrice != null ? String(input.comparePrice) : null,
      taxRate: input.taxRate != null ? String(input.taxRate) : null,
      weightGrams: input.weightGrams ?? null,
      attributes: input.attributes ?? {},
      isDefault: input.isDefault ?? false,
    })
    .returning();

  let resolvedWarehouseId = warehouseId;
  if (!resolvedWarehouseId) {
    const defaultWarehouse = await db.query.warehouses.findFirst();
    resolvedWarehouseId = defaultWarehouse?.id;
  }

  await db.insert(inventory).values({
    variantId: variant.id,
    warehouseId: resolvedWarehouseId,
    qtyOnHand: initialStock,
    qtyReserved: 0,
    lowStockThreshold: 5,
  });

  return variant;
}

export async function updateVariant(productId: string, variantId: string, input: Partial<VariantInput>) {
  const existing = await db.query.productVariants.findFirst({ where: and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)) });
  if (!existing) throw ApiError.notFound("Variant not found");

  if (input.sku && input.sku !== existing.sku) {
    const skuTaken = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, input.sku) });
    if (skuTaken) throw ApiError.conflict("A variant with this SKU already exists", "sku_taken");
  }

  const [updated] = await db
    .update(productVariants)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.price !== undefined ? { price: String(input.price) } : {}),
      ...(input.comparePrice !== undefined ? { comparePrice: input.comparePrice != null ? String(input.comparePrice) : null } : {}),
      ...(input.taxRate !== undefined ? { taxRate: input.taxRate != null ? String(input.taxRate) : null } : {}),
      ...(input.weightGrams !== undefined ? { weightGrams: input.weightGrams } : {}),
      ...(input.attributes !== undefined ? { attributes: input.attributes } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    })
    .where(eq(productVariants.id, variantId))
    .returning();
  return updated;
}

export async function deleteVariant(productId: string, variantId: string) {
  const existing = await db.query.productVariants.findFirst({ where: and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)) });
  if (!existing) throw ApiError.notFound("Variant not found");

  try {
    await db.delete(inventory).where(eq(inventory.variantId, variantId));
    await db.delete(productVariants).where(eq(productVariants.id, variantId));
  } catch (err: any) {
    if (err?.code === "23503") {
      throw ApiError.conflict("This variant can't be deleted — it's referenced by existing orders", "variant_in_use");
    }
    throw err;
  }
}
