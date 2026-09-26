"use client";

import { Suspense } from "react";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import PlaceholderImage from "@/components/PlaceholderImage";
import OrderStatusPill from "@/components/OrderStatusPill";
import { apiGetJson, apiPost, ApiClientError } from "@/lib/client-api";
import { formatMoney, formatDate } from "@/lib/format";
import type { OrderDetail } from "@/lib/types";

const CANCELLABLE = new Set(["pending", "confirmed", "processing"]);

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const o = await apiGetJson<OrderDetail>(`/orders/${id}`);
    setOrder(o);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cancelOrder() {
    if (!confirm("Cancel this order?")) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/orders/${id}/cancel`, {});
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not cancel order");
    } finally {
      setBusy(false);
    }
  }

  if (!order) return <p className="text-[13.5px] text-muted">Loading order…</p>;

  const address = "fullName" in order.shippingAddressSnapshot ? order.shippingAddressSnapshot : null;

  return (
    <div>
      {searchParams.get("confirmed") ? (
        <div className="mb-6 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-[13.5px] text-success-text">
          Order confirmed — a confirmation email is on its way.
        </div>
      ) : null}

      <div className="rule-strong flex flex-wrap items-baseline justify-between gap-2 pb-4">
        <div>
          <div className="font-mono text-[12px] text-faint">{order.orderNumber}</div>
          <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-ink">{formatDate(order.createdAt)}</h1>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <div className="mt-6 flex flex-col gap-11 lg:flex-row">
        <div className="flex-1">
          {order.items.map((item) => (
            <div key={item.id} className="rule flex gap-4 py-4">
              <PlaceholderImage src={item.image} alt={item.productSnapshot.name} className="h-[76px] w-[68px] flex-none" />
              <div className="flex-1">
                <div className="font-display text-[14.5px] font-semibold text-ink">{item.productSnapshot.name}</div>
                <div className="mt-1 text-[12.5px] text-muted">
                  {item.productSnapshot.variantName ? `${item.productSnapshot.variantName} · ` : ""}
                  Qty {item.quantity}
                </div>
              </div>
              <div className="text-[14px] font-semibold text-ink">{formatMoney(item.totalPrice)}</div>
            </div>
          ))}

          {order.history.length > 0 ? (
            <div className="mt-8">
              <div className="eyebrow mb-3">Tracking</div>
              <div className="flex flex-col gap-2">
                {order.history.map((h) => (
                  <div key={h.id} className="flex justify-between text-[13px] text-muted">
                    <span className="capitalize text-ink">{h.status.replace(/_/g, " ")}</span>
                    <span>{formatDate(h.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {CANCELLABLE.has(order.status) ? (
            <button onClick={cancelOrder} disabled={busy} className="mt-6 text-[13px] text-warn hover:underline disabled:opacity-50">
              {busy ? "Cancelling…" : "Cancel order"}
            </button>
          ) : null}
          {error ? <p className="mt-2 text-[13px] text-warn">{error}</p> : null}
        </div>

        <div className="w-full lg:w-[280px]">
          {address ? (
            <div className="mb-6">
              <div className="eyebrow mb-2">Delivery address</div>
              <div className="text-[13.5px] leading-relaxed text-ink">
                {address.fullName}
                <br />
                {address.line1}, {address.city}, {address.state} {address.postcode}
              </div>
            </div>
          ) : null}

          <div className="eyebrow mb-2">Summary</div>
          <div className="text-[13px] text-muted">
            <Row label="Subtotal" value={formatMoney(order.subtotal)} />
            {Number(order.discountAmount) > 0 ? <Row label="Discount" value={`−${formatMoney(order.discountAmount)}`} /> : null}
            <Row label="Tax" value={formatMoney(order.taxAmount)} />
            <Row label="Shipping" value={Number(order.shippingAmount) === 0 ? "Free" : formatMoney(order.shippingAmount)} />
            <div className="rule my-2" />
            <div className="flex justify-between text-[14px] font-semibold text-ink">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1.5 flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <OrderDetailContent />
    </Suspense>
  );
}
