"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlaceholderImage from "@/components/PlaceholderImage";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatMoney } from "@/lib/format";
import { apiPost } from "@/lib/client-api";
import { ApiClientError } from "@/lib/client-api";

export default function CartPage() {
  const { cart, loading, fetchCart, updateItem, removeItem, applyCoupon, removeCoupon } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [startingCheckout, setStartingCheckout] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput("");
    } catch (err) {
      setCouponError(err instanceof ApiClientError ? err.message : "Could not apply coupon");
    }
  }

  async function handleCheckout() {
    if (!user) {
      router.push("/login?next=/checkout");
      return;
    }
    setStartingCheckout(true);
    try {
      const order = await apiPost<{ orderId: string }>("/checkout/initiate");
      router.push(`/checkout?orderId=${order.orderId}`);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Could not start checkout");
    } finally {
      setStartingCheckout(false);
    }
  }

  if (loading && !cart) {
    return <div className="mx-auto max-w-content px-5 py-16 sm:px-10">Loading your cart…</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-content px-5 py-20 text-center sm:px-10">
        <h1 className="font-display text-xl font-semibold text-ink">Your cart is empty</h1>
        <Link href="/products" className="btn-pill btn-primary mt-6 inline-flex px-6 py-2.5 text-[13px] font-semibold">
          Continue shopping
        </Link>
      </div>
    );
  }

  const { summary } = cart;

  return (
    <div className="mx-auto max-w-content px-5 py-6 sm:px-10 sm:py-8">
      <h1 className="font-display text-[20px] font-semibold text-ink">
        Your cart <span className="font-mono text-[13px] font-normal text-muted">{cart.items.length} items</span>
      </h1>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div className="card flex-[1.8] divide-y divide-border">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-3.5 p-3.5">
              <Link href={`/products/${item.productSlug}`}>
                <PlaceholderImage src={item.image} alt={item.productName} className="h-[68px] w-[68px] flex-none rounded-md" />
              </Link>
              <div className="flex-1">
                <Link href={`/products/${item.productSlug}`} className="font-body text-[13px] font-medium text-ink hover:text-accent">
                  {item.productName}
                </Link>
                <div className="mt-0.5 font-mono text-[11px] text-faint">
                  {item.sku}
                  {item.variantName ? ` · ${item.variantName}` : ""}
                </div>
                <div className="mt-1 text-[11px] font-medium text-success">
                  {(item.qtyAvailable ?? 0) > 0 ? "In stock" : "Out of stock"}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="font-body text-[14px] font-semibold text-ink">{formatMoney(Number(item.price) * item.quantity)}</span>
                <div className="flex items-center gap-3 text-[12px] text-muted">
                  <div className="flex items-center overflow-hidden rounded-md border border-border">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} className="px-2.5 py-1 text-muted hover:text-ink" aria-label="Decrease quantity">
                      −
                    </button>
                    <span className="border-x border-border px-2.5 py-1 font-medium text-ink">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="px-2.5 py-1 text-muted hover:text-ink" aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="hover:text-warn hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-[300px]">
          <div className="card p-4">
            <div className="font-body text-[14px] font-semibold text-ink">Order summary</div>

            <form onSubmit={handleApplyCoupon} className="mt-3 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                className="!py-2 flex-1 !text-[12px] uppercase"
              />
              <button type="submit" className="btn-pill bg-inverse px-3.5 text-[12px] font-medium text-white">
                Apply
              </button>
            </form>
            {couponError ? <p className="mt-1.5 text-[11.5px] text-warn">{couponError}</p> : null}

            <div className="mt-4">
              <SummaryRow label="Subtotal" value={formatMoney(summary.subtotal)} />
              {cart.coupon ? (
                <div className="mb-1.5 flex justify-between text-[12.5px] text-muted">
                  <span>{cart.coupon.code}</span>
                  <span className="font-mono text-success">
                    −{formatMoney(summary.discount)}{" "}
                    <button onClick={() => removeCoupon()} className="ml-1 text-faint hover:text-ink">
                      ×
                    </button>
                  </span>
                </div>
              ) : null}
              <SummaryRow label="Tax (GST 18%)" value={formatMoney(summary.tax)} />
              <SummaryRow label="Shipping" value={summary.shipping === 0 ? "Free" : formatMoney(summary.shipping)} accent={summary.shipping === 0} last />
            </div>

            <div className="flex items-baseline justify-between py-3.5">
              <span className="font-body text-[14px] font-semibold text-ink">Total</span>
              <span className="font-mono text-[18px] font-semibold text-ink">{formatMoney(summary.total)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={startingCheckout}
              className="btn-pill btn-primary flex h-11 w-full items-center justify-center font-body text-[13.5px] font-semibold disabled:opacity-50 disabled:shadow-none"
            >
              {startingCheckout ? "Starting checkout…" : "Proceed to checkout"}
            </button>
            <div className="mt-2.5 text-center font-mono text-[10.5px] uppercase tracking-[0.06em] text-faint">Card · UPI · Wallet · COD</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent, last }: { label: string; value: string; accent?: boolean; last?: boolean }) {
  return (
    <div className={`flex justify-between text-[12.5px] text-muted ${last ? "border-b border-border pb-3" : "mb-1.5"}`}>
      <span>{label}</span>
      <span className={accent ? "font-mono text-success" : "font-mono"}>{value}</span>
    </div>
  );
}
