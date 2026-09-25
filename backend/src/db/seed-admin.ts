// One-off, idempotent enrichment for Phase 2 (Admin Portal): adds the
// default admin user, default product images + discounts for the
// Electronics category, and an Electronics-only coupon — without touching
// any existing data (safe to run against a DB that already has real
// order/cart/user history from Phase 1 testing).
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, queryClient } from "./client";
import { adminUsers, products, productImages, productVariants, coupons, categories } from "./schema/index";
import { hashPassword } from "../lib/password";

async function main() {
  const existingAdmin = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, "admin@arca.local") });
  if (!existingAdmin) {
    const passwordHash = await hashPassword(process.env.ADMIN_INITIAL_PASSWORD ?? "admin123");
    await db.insert(adminUsers).values({ email: "admin@arca.local", passwordHash, name: "Admin", role: "admin" });
    console.log("Created admin user: admin@arca.local");
  } else {
    console.log("Admin user already exists, skipping.");
  }

  const existingCoupon = await db.query.coupons.findFirst({ where: eq(coupons.code, "ELECTRONICS10") });
  if (!existingCoupon) {
    await db.insert(coupons).values({ code: "ELECTRONICS10", type: "percent", value: "10", minSubtotal: "0" });
    console.log("Created coupon: ELECTRONICS10");
  } else {
    console.log("Coupon ELECTRONICS10 already exists, skipping.");
  }

  const electronicsImages: Record<string, string[]> = {
    "wireless-earbuds-pro": ["https://picsum.photos/seed/EB-PRO-BLK/900/900", "https://picsum.photos/seed/EB-PRO-BLK-2/900/900"],
    "studio-buds-anc": ["https://picsum.photos/seed/EB-STU-CHR/900/900"],
    "sport-buds-lite": ["https://picsum.photos/seed/EB-SPT-STD/900/900"],
    "nova-buds-air": ["https://picsum.photos/seed/EB-NOV-WHT/900/900"],
    "chrono-field-watch": ["https://picsum.photos/seed/WA-CHR-STL40/900/900", "https://picsum.photos/seed/WA-CHR-STL40-2/900/900"],
  };

  const discounts: Record<string, number> = {
    "EB-STU-CHR": 13900,
    "EB-SPT-STD": 2799,
    "EB-NOV-WHT": 4999,
    "WA-CHR-STL40": 10499,
    "WA-CHR-BLK44": 10999,
  };

  let imagesAdded = 0;
  for (const [slug, urls] of Object.entries(electronicsImages)) {
    const product = await db.query.products.findFirst({ where: eq(products.slug, slug) });
    if (!product) continue;
    const existingImages = await db.query.productImages.findMany({ where: eq(productImages.productId, product.id) });
    if (existingImages.length > 0) continue;
    for (const [idx, url] of urls.entries()) {
      await db.insert(productImages).values({ productId: product.id, url, alt: product.name, sortOrder: idx });
      imagesAdded += 1;
    }
  }
  console.log(`Added ${imagesAdded} product images.`);

  let discountsApplied = 0;
  for (const [sku, comparePrice] of Object.entries(discounts)) {
    const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, sku) });
    if (!variant || variant.comparePrice) continue;
    await db.update(productVariants).set({ comparePrice: String(comparePrice) }).where(eq(productVariants.id, variant.id));
    discountsApplied += 1;
  }
  console.log(`Applied ${discountsApplied} discounts.`);

  const electronics = await db.query.categories.findFirst({ where: eq(categories.slug, "electronics") });
  console.log(`Electronics category id: ${electronics?.id ?? "not found"}`);

  await queryClient.end();
}

main().catch((err) => {
  console.error("Enrichment failed:", err);
  process.exit(1);
});
