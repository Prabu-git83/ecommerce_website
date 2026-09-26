"use client";

import { Suspense } from "react";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiGetJson, apiPost } from "@/lib/client-api";
import { ApiClientError } from "@/lib/client-api";
import { formatMoney } from "@/lib/format";
import type { Address, OrderDetail } from "@/lib/types";
import Field from "@/components/Field";
import { useCartStore } from "@/lib/stores/cart-store";

type ShippingRate = { code: string; label: string; etaDays: string; amount: number };
type Step = "address" | "shipping" | "payment";

const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "2 ADDRESS" },
  { key: "shipping", label: "3 SHIPPING" },
  { key: "payment", label: "4 PAYMENT" },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const fetchCart = useCartStore((s) => s.fetchCart);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [step, setStep] = useState<Step>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "wallet" | "cod">("upi");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const [o, addr] = await Promise.all([
          apiGetJson<OrderDetail>(`/orders/${orderId}`),
          apiGetJson<Address[]>("/customers/me/addresses"),
        ]);
        setOrder(o);
        setAddresses(addr);
        setSelectedAddressId(addr.find((a) => a.isDefault)?.id ?? addr[0]?.id ?? null);
        setShowAddressForm(addr.length === 0);
        const r = await apiGetJson<ShippingRate[]>(`/checkout/shipping-rates?subtotal=${Number(o.subtotal) - Number(o.discountAmount)}`);
        setRates(r);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Could not load checkout");
      }
    })();
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="mx-auto max-w-content px-5 py-20 text-center sm:px-10">
        <p className="text-ink">Start checkout from your cart.</p>
        <Link href="/cart" className="btn-pill btn-primary mt-6 inline-flex px-6 py-2.5 text-[13px] font-semibold">
          Go to cart
        </Link>
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-content px-5 py-20 text-center text-warn sm:px-10">{error}</div>;
  }

  if (!order) {
    return <div className="mx-auto max-w-content px-5 py-20 sm:px-10">Loading checkout…</div>;
  }

  async function goToShipping() {
    if (!selectedAddressId) {
      setError("Select or add a delivery address");
      return;
    }
    setError(null);
    setStep("shipping");
  }

  async function confirmShippingAndProceed() {
    setBusy(true);
    setError(null);
    try {
      const updated = await apiPost<OrderDetail>("/checkout/confirm", {
        orderId,
        addressId: selectedAddressId,
        shippingMethod: selectedShipping,
      });
      setOrder(updated);
      setStep("payment");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not confirm shipping");
    } finally {
      setBusy(false);
    }
  }

  async function payNow() {
    setBusy(true);
    setError(null);
    try {
      const paid = await apiPost<OrderDetail>("/checkout/payment-callback", { orderId, method: paymentMethod });
      await fetchCart();
      router.push(`/account/orders/${paid.id}?confirmed=true`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const total = order.total;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-content px-5 py-6 sm:px-10 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
        <span className="font-display text-[19px] font-semibold text-ink">Checkout</span>
        <div className="flex items-center gap-2.5 font-mono text-[10.5px] font-medium tracking-[0.06em]">
          <span className="text-accent">1 CART</span>
          {STEPS.map((s, i) => (
            <span key={s.key} className="flex items-center gap-2.5">
              <span className={`h-[1.5px] w-5 ${i <= stepIndex ? "bg-accent" : "bg-border-faint"}`} />
              <span className={i <= stepIndex ? "text-accent" : "text-faint"}>{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8 pt-6 lg:flex-row">
        <div className="flex-1">
          {step === "address" ? (
            <div>
              <h2 className="font-display text-[17px] font-semibold text-ink">Delivery address</h2>
              <div className="mt-4 flex flex-col gap-2.5">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3.5 ${
                      selectedAddressId === addr.id ? "border-accent bg-accent-soft/40" : "border-border"
                    }`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-accent"
                      />
                      <div className="text-[13px] leading-relaxed text-ink">
                        <div className="font-semibold">{addr.fullName}</div>
                        <div className="text-muted">
                          {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}
                          {addr.city}, {addr.state} {addr.postcode}
                        </div>
                        {addr.phone ? <div className="text-muted">{addr.phone}</div> : null}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {showAddressForm ? (
                <NewAddressForm
                  onCreated={(addr) => {
                    setAddresses((prev) => [addr, ...prev]);
                    setSelectedAddressId(addr.id);
                    setShowAddressForm(false);
                  }}
                />
              ) : (
                <button onClick={() => setShowAddressForm(true)} className="mt-3.5 text-[13px] font-medium text-accent hover:underline">
                  + Add a new address
                </button>
              )}

              {error ? <p className="mt-3 text-[13px] text-warn">{error}</p> : null}
              <button
                onClick={goToShipping}
                className="btn-pill btn-primary mt-5 flex h-11 items-center justify-center px-7 font-body text-[13px] font-semibold"
              >
                Continue to shipping
              </button>
            </div>
          ) : null}

          {step === "shipping" ? (
            <div>
              <h2 className="font-display text-[17px] font-semibold text-ink">Shipping method</h2>
              {selectedAddress ? (
                <p className="mt-1.5 text-[12.5px] text-muted">
                  Delivering to {selectedAddress.fullName} · {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postcode}{" "}
                  <button onClick={() => setStep("address")} className="font-medium text-accent hover:underline">
                    Change
                  </button>
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2.5">
                {rates.map((rate) => (
                  <label
                    key={rate.code}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 ${
                      selectedShipping === rate.code ? "border-accent bg-accent-soft/40" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={selectedShipping === rate.code}
                        onChange={() => setSelectedShipping(rate.code as "standard" | "express")}
                        className="accent-accent"
                      />
                      <div className="text-[13px] text-ink">
                        <div className="font-semibold">{rate.label}</div>
                        <div className="text-muted">{rate.etaDays}</div>
                      </div>
                    </div>
                    <div className="text-[13px] font-semibold text-ink">{rate.amount === 0 ? "Free" : formatMoney(rate.amount)}</div>
                  </label>
                ))}
              </div>
              {error ? <p className="mt-3 text-[13px] text-warn">{error}</p> : null}
              <button
                onClick={confirmShippingAndProceed}
                disabled={busy}
                className="btn-pill btn-primary mt-5 flex h-11 items-center justify-center px-7 font-body text-[13px] font-semibold disabled:opacity-50 disabled:shadow-none"
              >
                {busy ? "Saving…" : "Continue to payment"}
              </button>
            </div>
          ) : null}

          {step === "payment" ? (
            <div>
              <h2 className="font-display text-[17px] font-semibold text-ink">Payment method</h2>
              <p className="mt-1.5 text-[12.5px] text-muted">
                Payments run on a local mock gateway for now — card, UPI and wallet capture instantly; COD stays pending until delivery.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {(
                  [
                    { key: "upi", label: "UPI" },
                    { key: "card", label: "Card" },
                    { key: "wallet", label: "Wallet" },
                    { key: "cod", label: "Cash on delivery" },
                  ] as const
                ).map((m) => (
                  <label
                    key={m.key}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 ${
                      paymentMethod === m.key ? "border-accent bg-accent-soft/40" : "border-border"
                    }`}
                  >
                    <input type="radio" checked={paymentMethod === m.key} onChange={() => setPaymentMethod(m.key)} className="accent-accent" />
                    <span className="text-[12.5px] font-medium text-ink">{m.label}</span>
                  </label>
                ))}
              </div>
              {error ? <p className="mt-3 text-[13px] text-warn">{error}</p> : null}
              <button
                onClick={payNow}
                disabled={busy}
                className="btn-pill btn-primary mt-5 flex h-11 items-center justify-center px-7 font-body text-[13px] font-semibold disabled:opacity-50 disabled:shadow-none"
              >
                {busy ? "Processing…" : `Pay ${formatMoney(total)}`}
              </button>
            </div>
          ) : null}
        </div>

        <div className="w-full lg:w-[280px]">
          <div className="card p-4">
            <div className="font-body text-[13px] font-semibold text-ink">Order summary</div>
            <div className="mt-3 text-[12.5px] text-muted">
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              {Number(order.discountAmount) > 0 ? <Row label="Discount" value={`−${formatMoney(order.discountAmount)}`} accent /> : null}
              <Row label="Tax" value={formatMoney(order.taxAmount)} />
              <Row label="Shipping" value={Number(order.shippingAmount) === 0 ? "Free" : formatMoney(order.shippingAmount)} />
              <div className="mb-3 mt-1 border-b border-border pb-3" />
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-mono text-[18px] font-semibold text-ink">{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="mb-1.5 flex justify-between">
      <span>{label}</span>
      <span className={accent ? "font-mono text-success" : "font-mono"}>{value}</span>
    </div>
  );
}

function NewAddressForm({ onCreated }: { onCreated: (addr: Address) => void }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postcode: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const addr = await apiPost<Address>("/customers/me/addresses", { ...form, isDefault: true });
      onCreated(addr);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3.5 grid grid-cols-2 gap-3 rounded-lg border border-border p-3.5">
      <Field label="Full name">
        <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full" />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full" />
      </Field>
      <div className="col-span-2">
        <Field label="Address line 1">
          <input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="w-full" />
        </Field>
      </div>
      <div className="col-span-2">
        <Field label="Address line 2 (optional)">
          <input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="w-full" />
        </Field>
      </div>
      <Field label="City">
        <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full" />
      </Field>
      <Field label="State">
        <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full" />
      </Field>
      <Field label="Postcode">
        <input required value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="w-full" />
      </Field>
      <div className="col-span-2">
        {error ? <p className="mb-2 text-[12px] text-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-pill flex h-10 items-center justify-center bg-inverse px-6 text-[12.5px] font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save address"}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
