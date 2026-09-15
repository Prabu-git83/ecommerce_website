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
    return <div className="mx-auto max-w-content px-5 py-16 sm:px-10">Loading your bag…</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-content px-5 py-20 text-center sm:px-10">
        <h1 className="font-display text-2xl font-extrabold text-ink">Your bag is empty</h1>
        <Link href="/products" className="btn-pill mt-6 inline-flex bg-ink px-6 py-3 text-[13px] text-paper">
          Continue shopping
        </Link>
      </div>
    );
  }

  const { summary } = cart;

  return (
    <div className="mx-auto max-w-content px-5 py-8 sm:px-10 sm:py-12">
      <div className="flex flex-col gap-11 lg:flex-row">
        <div className="flex-1">
          <div className="rule-strong flex items-baseline gap-2 pb-4">
            <h1 className="font-display text-[28px] font-extrabold tracking-tight text-ink">Your bag</h1>
            <span className="font-mono text-[13px] text-faint">{cart.items.length} items</span>
          </div>

          {cart.items.map((item) => (
            <div key={item.id} className="rule flex gap-4 py-5">
              <Link href={`/products/${item.productSlug}`}>
                <PlaceholderImage src={item.image} alt={item.productName} className="h-[100px] w-[88px] flex-none" />
              </Link>
              <div className="flex-1">
                <Link href={`/products/${item.productSlug}`} className="font-display text-[15px] font-semibold text-ink hover:underline">
                  {item.productName}
                </Link>
                <div className="mt-1 text-[12.5px] text-muted">
                  {item.variantName ? `${item.variantName} · ` : ""}
                  {item.sku}
                </div>
                <div className="mt-1.5 text-[12px] text-accent">
                  {(item.qtyAvailable ?? 0) > 0 ? "In stock" : "Out of stock"}
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-[12.5px] text-muted">
                  <div className="flex items-center gap-2 rounded-pill border border-border-faint px-2 py-1">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} className="px-1 text-ink" aria-label="Decrease quantity">
                      −
                    </button>
                    <span className="w-4 text-center text-ink">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="px-1 text-ink" aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="hover:text-ink hover:underline">
                    Remove
                  </button>
                </div>
              </div>
              <div className="font-body text-[15px] font-semibold text-ink">{formatMoney(Number(item.price) * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-[300px]">
          <div className="rule-strong eyebrow pb-3.5">Summary</div>
          <div className="pt-3.5">
            <SummaryRow label="Subtotal" value={formatMoney(summary.subtotal)} />
            {cart.coupon ? (
              <div className="mb-2 flex justify-between text-[13px] text-muted">
                <span>
                  {cart.coupon.code}{" "}
                  <button onClick={() => removeCoupon()} className="ml-1 text-faint hover:text-ink">
                    ×
                  </button>
                </span>
                <span className="text-accent">−{formatMoney(summary.discount)}</span>
              </div>
            ) : null}
            <SummaryRow label="Tax (GST 18%)" value={formatMoney(summary.tax)} />
            <SummaryRow label="Shipping" value={summary.shipping === 0 ? "Free" : formatMoney(summary.shipping)} accent={summary.shipping === 0} last />

            {!cart.coupon ? (
              <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="!py-2 flex-1 !text-[12.5px] uppercase"
                />
                <button type="submit" className="btn-pill border border-border-faint px-4 text-[12.5px] text-ink hover:border-ink">
                  Apply
                </button>
              </form>
            ) : null}
            {couponError ? <p className="mt-1.5 text-[12px] text-warn">{couponError}</p> : null}

            <div className="flex items-baseline justify-between py-5">
              <span className="font-body text-[14px] font-semibold text-ink">Total</span>
              <span className="font-display text-[26px] font-extrabold tracking-tight text-ink">{formatMoney(summary.total)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={startingCheckout}
              className="btn-pill flex h-12 w-full items-center justify-center bg-ink font-body text-[13.5px] font-medium text-paper disabled:opacity-50"
            >
              {startingCheckout ? "Starting checkout…" : "Checkout"}
            </button>
            <div className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-faint">Card · UPI · Wallet · COD</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent, last }: { label: string; value: string; accent?: boolean; last?: boolean }) {
  return (
    <div className={`flex justify-between text-[13px] text-muted ${last ? "rule pb-3.5" : "mb-2.5"}`}>
      <span>{label}</span>
      <span className={accent ? "text-accent" : ""}>{value}</span>
    </div>
  );
}
