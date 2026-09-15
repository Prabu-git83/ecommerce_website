import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import {
  carts,
  cartItems,
  productVariants,
  products,
  inventory,
  coupons,
  orders,
  orderItems,
  orderStatusHistory,
  payments,
  addresses,
} from "../../db/schema/index";
import { ApiError } from "../../lib/errors";
import { generateOrderNumber } from "../../lib/orderNumber";
import { paymentProvider } from "../payments/registry";
import type { PaymentMethod } from "../payments/provider";
import { sendMail, emailTemplates } from "../../lib/mailer";

const TAX_RATE = 0.18;
const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 79;
const EXPRESS_SHIPPING_FEE = 149;

export function getShippingRates(subtotalAfterDiscount: number) {
  return [
    {
      code: "standard",
      label: "Standard",
      etaDays: "3-5 days",
      amount: subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE,
    },
    { code: "express", label: "Express", etaDays: "1-2 days", amount: EXPRESS_SHIPPING_FEE },
  ];
}

async function loadCartWithTotals(sessionToken: string, userId: string | null) {
  const cart = userId
    ? await db.query.carts.findFirst({ where: and(eq(carts.userId, userId), eq(carts.status, "active")) })
    : await db.query.carts.findFirst({ where: eq(carts.sessionToken, sessionToken) });

  if (!cart) throw ApiError.badRequest("Your bag is empty", "empty_cart");

  const items = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      variantId: productVariants.id,
      sku: productVariants.sku,
      price: productVariants.price,
      variantName: productVariants.name,
      productId: products.id,
      productName: products.name,
      qtyAvailable: inventory.qtyAvailable,
      inventoryId: inventory.id,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cart.id));

  if (items.length === 0) throw ApiError.badRequest("Your bag is empty", "empty_cart");

  for (const item of items) {
    if ((item.qtyAvailable ?? 0) < item.quantity) {
      throw ApiError.conflict(`${item.productName} only has ${item.qtyAvailable ?? 0} left in stock`, "insufficient_stock");
    }
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  let discount = 0;
  if (cart.couponCode) {
    const coupon = await db.query.coupons.findFirst({ where: eq(coupons.code, cart.couponCode) });
    if (coupon && coupon.isActive) {
      discount = coupon.type === "percent" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);
      discount = Math.min(discount, subtotal);
    }
  }

  return { cart, items, subtotal: round2(subtotal), discount: round2(discount) };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function initiateCheckout(sessionToken: string, userId: string | null) {
  if (!userId) throw ApiError.unauthorized("Please sign in to check out", "auth_required");

  const { cart, items, subtotal, discount } = await loadCartWithTotals(sessionToken, userId);

  const tax = round2((subtotal - discount) * TAX_RATE);
  const shipping = getShippingRates(subtotal - discount)[0].amount;
  const total = round2(subtotal - discount + tax + shipping);

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: generateOrderNumber(),
      customerId: userId,
      status: "pending",
      paymentStatus: "unpaid",
      subtotal: String(subtotal),
      discountAmount: String(discount),
      taxAmount: String(tax),
      shippingAmount: String(shipping),
      total: String(total),
      couponCode: cart.couponCode,
      shippingAddressSnapshot: {},
      shippingMethod: "standard",
    })
    .returning();

  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      variantId: item.variantId,
      productSnapshot: { name: item.productName, sku: item.sku, variantName: item.variantName },
      quantity: item.quantity,
      unitPrice: String(item.price),
      totalPrice: String(round2(Number(item.price) * item.quantity)),
    });
    if (item.inventoryId) {
      // Increment in-place (not read-then-write) to avoid lost updates under concurrent checkouts.
      await db
        .update(inventory)
        .set({ qtyReserved: sql`${inventory.qtyReserved} + ${item.quantity}` })
        .where(eq(inventory.id, item.inventoryId));
    }
  }

  await db.insert(orderStatusHistory).values({ orderId: order.id, status: "pending", note: "Order created, stock reserved" });

  return { orderId: order.id, orderNumber: order.orderNumber, total };
}

export async function confirmCheckout(orderId: string, userId: string, input: { addressId: string; shippingMethod: "standard" | "express" }) {
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.customerId, userId)) });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status !== "pending") throw ApiError.conflict("This order can no longer be modified");

  const address = await db.query.addresses.findFirst({ where: and(eq(addresses.id, input.addressId), eq(addresses.userId, userId)) });
  if (!address) throw ApiError.notFound("Address not found");

  const rate = getShippingRates(Number(order.subtotal) - Number(order.discountAmount)).find((r) => r.code === input.shippingMethod);
  if (!rate) throw ApiError.badRequest("Invalid shipping method");

  const total = round2(Number(order.subtotal) - Number(order.discountAmount) + Number(order.taxAmount) + rate.amount);

  const [updated] = await db
    .update(orders)
    .set({
      shippingAddressSnapshot: address,
      shippingMethod: input.shippingMethod,
      shippingAmount: String(rate.amount),
      total: String(total),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return updated;
}

export async function payForOrder(orderId: string, userId: string, method: PaymentMethod) {
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.customerId, userId)) });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status !== "pending") throw ApiError.conflict("This order was already processed");

  const result = await paymentProvider.charge({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.total),
    currency: order.currency,
    method,
  });

  await db.insert(payments).values({
    orderId: order.id,
    provider: paymentProvider.name,
    providerRef: result.providerRef,
    method,
    amount: order.total,
    currency: order.currency,
    status: result.status,
    capturedAt: result.status === "captured" ? new Date() : null,
  });

  if (result.status === "failed") {
    throw ApiError.badRequest("Payment failed. Please try another method.", "payment_failed");
  }

  const paymentStatus = result.status === "captured" ? "paid" : "unpaid";
  const orderStatus = "confirmed";

  const [updated] = await db
    .update(orders)
    .set({ paymentStatus, status: orderStatus, paymentMethod: method, updatedAt: new Date() })
    .where(eq(orders.id, order.id))
    .returning();

  await db.insert(orderStatusHistory).values({ orderId: order.id, status: orderStatus, note: `Payment ${result.status} via ${method}` });

  // Convert reserved stock into a hard deduction now that payment succeeded / COD confirmed.
  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) });
  for (const item of items) {
    await db
      .update(inventory)
      .set({
        qtyOnHand: sql`${inventory.qtyOnHand} - ${item.quantity}`,
        qtyReserved: sql`${inventory.qtyReserved} - ${item.quantity}`,
      })
      .where(eq(inventory.variantId, item.variantId));
  }

  // Mark the cart converted so a fresh one starts next visit.
  const cart = userId
    ? await db.query.carts.findFirst({ where: and(eq(carts.userId, userId), eq(carts.status, "active")) })
    : null;
  if (cart) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await db.update(carts).set({ status: "converted", couponCode: null }).where(eq(carts.id, cart.id));
  }

  if (order.couponCode) {
    await db
      .update(coupons)
      .set({ timesUsed: (await db.query.coupons.findFirst({ where: eq(coupons.code, order.couponCode) }))!.timesUsed + 1 })
      .where(eq(coupons.code, order.couponCode));
  }

  const customer = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
  if (customer) {
    sendMail(customer.email, `Order ${order.orderNumber} confirmed`, emailTemplates.orderConfirmation(order.orderNumber, updated.total, updated.currency)).catch(
      () => {}
    );
  }

  return updated;
}
