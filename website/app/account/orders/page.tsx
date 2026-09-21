"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetJson } from "@/lib/client-api";
import { formatMoney, formatDate } from "@/lib/format";
import OrderStatusPill from "@/components/OrderStatusPill";
import type { OrderSummary } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    apiGetJson<OrderSummary[]>("/orders").then(setOrders);
  }, []);

  if (!orders) return <p className="text-[13.5px] text-muted">Loading orders…</p>;

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Orders</h1>
        <p className="mt-3 text-[13.5px] text-muted">You haven&apos;t placed any orders yet.</p>
        <Link href="/products" className="btn-pill mt-5 inline-flex btn-primary px-6 py-3 text-[13px] ">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Orders</h1>
      <div className="mt-6 flex flex-col">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.id}`}
            className="rule flex items-center justify-between gap-4 py-4 hover:bg-chrome/40"
          >
            <div>
              <div className="font-mono text-[12px] text-faint">{o.orderNumber}</div>
              <div className="mt-0.5 text-[13.5px] text-ink">{formatDate(o.createdAt)}</div>
            </div>
            <OrderStatusPill status={o.status} />
            <div className="font-body text-[14px] font-semibold text-ink">{formatMoney(o.total)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
