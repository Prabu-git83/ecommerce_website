import { asc, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { categories, products } from "../../../db/schema/index";
import { slugify } from "../../../lib/slugify";
import { ApiError } from "../../../lib/errors";

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function listCategoriesTree() {
  const rows = await db.query.categories.findMany({ orderBy: [asc(categories.sortOrder)] });
  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const key = row.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, [] as any);
    (byParent.get(key) as any).push(row);
  }
  async function build(parentId: string | null): Promise<any[]> {
    const children = byParent.get(parentId) ?? [];
    return Promise.all(
      children.map(async (c: any) => {
        const productCount = (await db.query.products.findMany({ where: eq(products.categoryId, c.id) })).length;
        return { ...c, productCount, children: await build(c.id) };
      })
    );
  }
  return build(null);
}

export type CategoryInput = {
  name: string;
  parentId: string | null;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
};

export async function createCategory(input: CategoryInput) {
  const slug = await uniqueSlug(input.name);
  const [category] = await db.insert(categories).values({ ...input, slug }).returning();
  return category;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const existing = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  if (!existing) throw ApiError.notFound("Category not found");

  const slug = input.name && input.name !== existing.name ? await uniqueSlug(input.name, id) : undefined;

  const [updated] = await db
    .update(categories)
    .set({ ...input, ...(slug ? { slug } : {}) })
    .where(eq(categories.id, id))
    .returning();
  return updated;
}

export async function deactivateCategory(id: string) {
  const existing = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  if (!existing) throw ApiError.notFound("Category not found");
  const [updated] = await db.update(categories).set({ isActive: false }).where(eq(categories.id, id)).returning();
  return updated;
}
