import "dotenv/config";
import { db, queryClient } from "./client";
import { categories, products, productVariants, productImages, inventory, warehouses, coupons, adminUsers } from "./schema/index";
import { hashPassword } from "../lib/password";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding database...");

  const [warehouse] = await db.insert(warehouses).values({ name: "Default Warehouse", code: "DEFAULT" }).returning();

  const categoryDefs = [
    { name: "Electronics", children: ["Audio", "Wearables"] },
    { name: "Fashion", children: ["Outerwear", "Shirts"] },
    { name: "Home", children: ["Lighting", "Textiles"] },
    { name: "Beauty", children: ["Skincare"] },
  ];

  const categoryIds: Record<string, string> = {};
  for (const def of categoryDefs) {
    const [parent] = await db
      .insert(categories)
      .values({ name: def.name, slug: slugify(def.name), sortOrder: 0 })
      .returning();
    categoryIds[def.name] = parent.id;
    for (const child of def.children) {
      const [c] = await db
        .insert(categories)
        .values({ name: child, slug: slugify(`${def.name}-${child}`), parentId: parent.id })
        .returning();
      categoryIds[`${def.name}/${child}`] = c.id;
    }
  }

  type SeedVariant = { name: string; sku: string; price: number; comparePrice?: number; attributes?: Record<string, string>; stock: number };
  type SeedProduct = {
    name: string;
    category: string;
    shortDesc: string;
    description: string;
    isFeatured?: boolean;
    images?: string[];
    variants: SeedVariant[];
  };

  // Deterministic placeholder photography (picsum.photos, seeded by SKU) —
  // stand-ins for real product photography, which this local build has none of.

  const productDefs: SeedProduct[] = [
    {
      name: "Wireless Earbuds Pro",
      category: "Electronics/Audio",
      shortDesc: "Adaptive noise cancelling",
      description: "Adaptive noise cancelling, thirty hours with the case, and a fit test in the app. Designed and tuned in Bengaluru.",
      isFeatured: true,
      images: [
        "https://picsum.photos/seed/EB-PRO-BLK/900/900",
        "https://picsum.photos/seed/EB-PRO-BLK-2/900/900",
      ],
      variants: [
        { name: "Black", sku: "EB-PRO-BLK", price: 6999, comparePrice: 9499, attributes: { color: "Black" }, stock: 12 },
        { name: "Ivory", sku: "EB-PRO-IVR", price: 6999, comparePrice: 9499, attributes: { color: "Ivory" }, stock: 18 },
      ],
    },
    {
      name: "Studio Buds ANC",
      category: "Electronics/Audio",
      shortDesc: "Studio-tuned active noise cancelling",
      description: "Reference-grade drivers with hybrid ANC and a 24-bit DAC over USB-C.",
      images: ["https://picsum.photos/seed/EB-STU-CHR/900/900"],
      variants: [{ name: "Charcoal", sku: "EB-STU-CHR", price: 11450, comparePrice: 13900, attributes: { color: "Charcoal" }, stock: 4 }],
    },
    {
      name: "Sport Buds Lite",
      category: "Electronics/Audio",
      shortDesc: "Sweat-proof, secure fit",
      description: "IPX5 rated, hooked fit for running, 9-hour battery life.",
      images: ["https://picsum.photos/seed/EB-SPT-STD/900/900"],
      variants: [{ name: "Standard", sku: "EB-SPT-STD", price: 2299, comparePrice: 2799, stock: 40 }],
    },
    {
      name: "Nova Buds Air",
      category: "Electronics/Audio",
      shortDesc: "Ultra-light everyday earbuds",
      description: "4.5g per earbud, transparent case, 20-hour combined battery.",
      images: ["https://picsum.photos/seed/EB-NOV-WHT/900/900"],
      variants: [{ name: "White", sku: "EB-NOV-WHT", price: 4299, comparePrice: 4999, attributes: { color: "White" }, stock: 25 }],
    },
    {
      name: "Chrono Field Watch",
      category: "Electronics/Wearables",
      shortDesc: "Hybrid smartwatch, two-week battery",
      description: "Analogue face with a hidden step counter and sleep tracker. Two-week battery life.",
      isFeatured: true,
      images: [
        "https://picsum.photos/seed/WA-CHR-STL40/900/900",
        "https://picsum.photos/seed/WA-CHR-STL40-2/900/900",
      ],
      variants: [
        { name: "Steel / 40mm", sku: "WA-CHR-STL40", price: 8999, comparePrice: 10499, attributes: { finish: "Steel", size: "40mm" }, stock: 9 },
        { name: "Black / 44mm", sku: "WA-CHR-BLK44", price: 9499, comparePrice: 10999, attributes: { finish: "Black", size: "44mm" }, stock: 6 },
      ],
    },
    {
      name: "Linen Overshirt",
      category: "Fashion/Outerwear",
      shortDesc: "Sand, washed finish",
      description: "Mid-weight European linen, washed for softness, relaxed fit through the body.",
      isFeatured: true,
      variants: [
        { name: "Sand / M", sku: "LN-OVR-SNDM", price: 2499, attributes: { color: "Sand", size: "M" }, stock: 15 },
        { name: "Sand / L", sku: "LN-OVR-SNDL", price: 2499, attributes: { color: "Sand", size: "L" }, stock: 11 },
        { name: "Ink / L", sku: "LN-OVR-INKL", price: 2499, attributes: { color: "Ink", size: "L" }, stock: 8 },
      ],
    },
    {
      name: "Wool Overcoat",
      category: "Fashion/Outerwear",
      shortDesc: "Double-faced wool, knee length",
      description: "Double-faced wool blend, fully lined, horn buttons. Cut for a tailored silhouette.",
      variants: [
        { name: "Camel / M", sku: "WL-COT-CAMM", price: 12900, comparePrice: 15900, attributes: { color: "Camel", size: "M" }, stock: 5 },
        { name: "Charcoal / L", sku: "WL-COT-CHRL", price: 12900, comparePrice: 15900, attributes: { color: "Charcoal", size: "L" }, stock: 3 },
      ],
    },
    {
      name: "Oxford Weave Shirt",
      category: "Fashion/Shirts",
      shortDesc: "Brushed cotton oxford",
      description: "Brushed cotton oxford weave, mother-of-pearl buttons, box pleat back.",
      variants: [
        { name: "White / M", sku: "OX-SHT-WHTM", price: 1899, attributes: { color: "White", size: "M" }, stock: 20 },
        { name: "Blue / M", sku: "OX-SHT-BLUM", price: 1899, attributes: { color: "Blue", size: "M" }, stock: 17 },
      ],
    },
    {
      name: "Ceramic Table Lamp",
      category: "Home/Lighting",
      shortDesc: "Hand-thrown, matte glaze",
      description: "Hand-thrown stoneware base with a matte glaze, paired with a linen shade.",
      isFeatured: true,
      variants: [{ name: "Sand", sku: "LMP-CER-SND", price: 3150, attributes: { color: "Sand" }, stock: 14 }],
    },
    {
      name: "Arc Floor Lamp",
      category: "Home/Lighting",
      shortDesc: "Brushed brass, marble base",
      description: "Brushed brass arm on a weighted marble base, dimmable warm LED.",
      variants: [{ name: "Brass", sku: "LMP-ARC-BRS", price: 8450, attributes: { finish: "Brass" }, stock: 6 }],
    },
    {
      name: "Cotton Handloom Throw",
      category: "Home/Textiles",
      shortDesc: "Handloom, 130×180cm",
      description: "Handloom-woven cotton throw, 130×180cm, pre-washed for softness.",
      variants: [
        { name: "Clay", sku: "TXT-THR-CLY", price: 1899, attributes: { color: "Clay" }, stock: 22 },
        { name: "Sage", sku: "TXT-THR-SGE", price: 1899, attributes: { color: "Sage" }, stock: 19 },
      ],
    },
    {
      name: "Linen Bedding Set",
      category: "Home/Textiles",
      shortDesc: "Stonewashed French linen, queen",
      description: "Stonewashed French linen duvet cover and two pillowcases, queen size.",
      variants: [{ name: "Oat / Queen", sku: "TXT-BED-OATQ", price: 6499, attributes: { color: "Oat", size: "Queen" }, stock: 7 }],
    },
    {
      name: "Mineral Face Serum",
      category: "Beauty/Skincare",
      shortDesc: "Niacinamide + zinc, 30ml",
      description: "10% niacinamide with zinc PCA, fragrance-free, for combination and oily skin.",
      variants: [{ name: "30ml", sku: "SKN-SER-30", price: 1450, stock: 30 }],
    },
    {
      name: "Clay Cleansing Bar",
      category: "Beauty/Skincare",
      shortDesc: "Kaolin clay, cold-pressed",
      description: "Cold-pressed kaolin clay bar for daily cleansing, suits all skin types.",
      variants: [{ name: "100g", sku: "SKN-CLB-100", price: 599, stock: 45 }],
    },
  ];

  for (const p of productDefs) {
    const [product] = await db
      .insert(products)
      .values({
        name: p.name,
        slug: slugify(p.name),
        shortDesc: p.shortDesc,
        description: p.description,
        status: "active",
        isFeatured: p.isFeatured ?? false,
        categoryId: categoryIds[p.category],
        metaTitle: p.name,
        metaDescription: p.shortDesc,
      })
      .returning();

    for (const [idx, url] of (p.images ?? []).entries()) {
      await db.insert(productImages).values({ productId: product.id, url, alt: p.name, sortOrder: idx });
    }

    for (const [idx, v] of p.variants.entries()) {
      const [variant] = await db
        .insert(productVariants)
        .values({
          productId: product.id,
          name: v.name,
          sku: v.sku,
          price: String(v.price),
          comparePrice: v.comparePrice ? String(v.comparePrice) : null,
          attributes: v.attributes ?? {},
          isDefault: idx === 0,
        })
        .returning();

      await db.insert(inventory).values({
        variantId: variant.id,
        warehouseId: warehouse.id,
        qtyOnHand: v.stock,
        qtyReserved: 0,
        lowStockThreshold: 5,
      });
    }
  }

  await db.insert(coupons).values([
    { code: "MONSOON15", type: "percent", value: "15", minSubtotal: "0" },
    { code: "FLAT200", type: "fixed", value: "200", minSubtotal: "1500" },
    { code: "ELECTRONICS10", type: "percent", value: "10", minSubtotal: "0" },
  ]);

  const adminPasswordHash = await hashPassword("admin123");
  await db.insert(adminUsers).values({
    email: "admin@arca.local",
    passwordHash: adminPasswordHash,
    name: "Admin",
    role: "admin",
  });
  console.log("Seeded admin user: admin@arca.local / admin123");

  console.log(`Seeded ${productDefs.length} products across ${categoryDefs.length} top-level categories.`);
  await queryClient.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
