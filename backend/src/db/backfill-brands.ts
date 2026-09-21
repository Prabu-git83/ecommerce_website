// One-off, idempotent backfill: assigns a brand to each seeded product that
// doesn't have one yet, so the storefront's brand filter has real facets to
// show. Safe to re-run — only touches rows where brand is still null.
import "dotenv/config";
import { eq, isNull, and } from "drizzle-orm";
import { db, queryClient } from "./client";
import { products } from "./schema/index";

const BRAND_BY_SLUG: Record<string, string> = {
  "wireless-earbuds-pro": "Sonik",
  "studio-buds-anc": "Sonik",
  "sport-buds-lite": "Pulse",
  "nova-buds-air": "Pulse",
  "chrono-field-watch": "Meridian",
  "linen-overshirt": "Arca Studio",
  "wool-overcoat": "Arca Studio",
  "oxford-weave-shirt": "Fieldnote",
  "ceramic-table-lamp": "Kiln & Co",
  "arc-floor-lamp": "Kiln & Co",
  "cotton-handloom-throw": "Loom House",
  "linen-bedding-set": "Loom House",
  "mineral-face-serum": "Bare Lab",
  "clay-cleansing-bar": "Bare Lab",
};

async function main() {
  let updated = 0;
  for (const [slug, brand] of Object.entries(BRAND_BY_SLUG)) {
    const result = await db
      .update(products)
      .set({ brand })
      .where(and(eq(products.slug, slug), isNull(products.brand)))
      .returning({ id: products.id });
    if (result.length > 0) {
      updated += 1;
      console.log(`Set brand "${brand}" on ${slug}`);
    }
  }
  console.log(`Backfilled ${updated} product(s). Already-branded rows were left untouched.`);
  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
