import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { carts, cartItems, productVariants, products, productImages, inventory, coupons } from "../../db/schema/index";
import { ApiError } from "../../lib/errors";

async function getOrCreateCart(sessionToken: string, userId: string | null) {
  let cart = await db.query.carts.findFirst({ where: eq(carts.sessionToken, sessionToken) });
  if (!cart) {
    [cart] = await db.insert(carts).values({ sessionToken, userId: userId ?? undefined }).returning();
  } else if (userId && !cart.userId) {
    [cart] = await db.update(carts).set({ userId, updatedAt: new Date() }).where(eq(carts.id, cart.id)).returning();
  }
  return cart;
}

// Called right after login/register: folds the anonymous cart the browser
// was using into the customer's existing cart (if they already had one on
// another device), summing quantities for shared variants.
export async function mergeGuestCartIntoUser(sessionToken: string, userId: string) {
  const guestCart = await db.query.carts.findFirst({ where: eq(carts.sessionToken, sessionToken) });
  if (!guestCart) return;

  const userCart = await db.query.carts.findFirst({
    where: and(eq(carts.userId, userId), eq(carts.status, "active")),
  });

  if (!userCart || userCart.id === guestCart.id) {
    await db.update(carts).set({ userId, updatedAt: new Date() }).where(eq(carts.id, guestCart.id));
    return;
  }

  const guestItems = await db.query.cartItems.findMany({ where: eq(cartItems.cartId, guestCart.id) });
  for (const item of guestItems) {
    const existing = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.cartId, userCart.id), eq(cartItems.variantId, item.variantId)),
    });
    if (existing) {
      await db.update(cartItems).set({ quantity: existing.quantity + item.quantity }).where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({ cartId: userCart.id, variantId: item.variantId, quantity: item.quantity });
    }
  }
  await db.delete(carts).where(eq(carts.id, guestCart.id));
}

export async function getCartDetail(sessionToken: string, userId: string | null) {
  const cart = await getOrCreateCart(sessionToken, userId);
  const items = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      variantId: productVariants.id,
      variantName: productVariants.name,
      sku: productVariants.sku,
      price: productVariants.price,
      comparePrice: productVariants.comparePrice,
      attributes: productVariants.attributes,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      qtyAvailable: inventory.qtyAvailable,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cart.id));

  const itemsWithImages = await Promise.all(
    items.map(async (item) => {
      const image = await db.query.productImages.findFirst({
        where: eq(productImages.productId, item.productId),
        orderBy: (img, { asc }) => [asc(img.sortOrder)],
      });
      return { ...item, image: image?.url ?? null };
    })
  );

  const subtotal = itemsWithImages.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  let discount = 0;
  let coupon: { code: string; type: string; value: string } | null = null;
  if (cart.couponCode) {
    const c = await db.query.coupons.findFirst({ where: eq(coupons.code, cart.couponCode) });
    if (c) {
      coupon = { code: c.code, type: c.type, value: c.value };
      discount = c.type === "percent" ? (subtotal * Number(c.value)) / 100 : Number(c.value);
      discount = Math.min(discount, subtotal);
    }
  }

  const taxRate = 0.18; // GST 18%, matches blueprint example
  const tax = Math.round((subtotal - discount) * taxRate * 100) / 100;
  const shipping = subtotal - discount >= 999 || subtotal === 0 ? 0 : 79;
  const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

  return {
    id: cart.id,
    items: itemsWithImages,
    coupon,
    summary: {
      subtotal: round2(subtotal),
      discount: round2(discount),
      tax,
      shipping,
      total,
      currency: "INR",
    },
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function addItem(sessionToken: string, userId: string | null, variantId: string, quantity: number) {
  const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.id, variantId) });
  if (!variant) throw ApiError.notFound("Product variant not found");

  const cart = await getOrCreateCart(sessionToken, userId);
  const existing = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)),
  });

  if (existing) {
    await db.update(cartItems).set({ quantity: existing.quantity + quantity }).where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId: cart.id, variantId, quantity });
  }
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
  return getCartDetail(sessionToken, userId);
}

export async function updateItemQuantity(sessionToken: string, userId: string | null, itemId: string, quantity: number) {
  const cart = await getOrCreateCart(sessionToken, userId);
  const item = await db.query.cartItems.findFirst({ where: and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)) });
  if (!item) throw ApiError.notFound("Cart item not found");

  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
  }
  return getCartDetail(sessionToken, userId);
}

export async function removeItem(sessionToken: string, userId: string | null, itemId: string) {
  const cart = await getOrCreateCart(sessionToken, userId);
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  return getCartDetail(sessionToken, userId);
}

export async function applyCoupon(sessionToken: string, userId: string | null, code: string) {
  const cart = await getOrCreateCart(sessionToken, userId);
  const coupon = await db.query.coupons.findFirst({ where: eq(coupons.code, code.toUpperCase()) });
  if (!coupon || !coupon.isActive) throw ApiError.badRequest("Invalid coupon code", "invalid_coupon");
  if (coupon.endsAt && coupon.endsAt < new Date()) throw ApiError.badRequest("This coupon has expired", "coupon_expired");

  await db.update(carts).set({ couponCode: coupon.code, updatedAt: new Date() }).where(eq(carts.id, cart.id));
  return getCartDetail(sessionToken, userId);
}

export async function removeCoupon(sessionToken: string, userId: string | null) {
  const cart = await getOrCreateCart(sessionToken, userId);
  await db.update(carts).set({ couponCode: null, updatedAt: new Date() }).where(eq(carts.id, cart.id));
  return getCartDetail(sessionToken, userId);
}

export { getOrCreateCart };
