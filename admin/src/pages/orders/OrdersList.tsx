import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import { apiRequestWithMeta } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderListItem } from "@/lib/types";

const TABS = [
  { key: undefined, label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export default function OrdersList() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [counts, setCounts] = useState<{ total: number; byStatus: Record<string, number> }>({ total: 0, byStatus: {} });
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    apiRequestWithMeta<OrderListItem[]>(`/admin/orders?${params.toString()}`).then(({ data, meta }) => {
      setOrders(data);
      if (meta?.counts) setCounts(meta.counts as any);
    });
  }, [status, q]);

  return (
    <div>
      <PageHeader
        title="Orders"
        sub={String(counts.total)}
        actions={<input placeholder="Search order # or customer…" value={q} onChange={(e) => setQ(e.target.value)} className="!w-64 !py-1.5" />}
      />

      <div className="flex gap-5 border-b border-border bg-surface px-8 pt-3.5 font-body text-[12px] font-medium text-muted">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setStatus(t.key)}
            className={`border-b-2 pb-2.5 ${status === t.key ? "border-accent text-accent" : "border-transparent"}`}
          >
            {t.label} {t.key ? (counts.byStatus[t.key] ?? 0) : counts.total}
          </button>
        ))}
      </div>

      <div className="px-8 py-5">
        <div className="table-card">
          <div className="table-head grid grid-cols-[130px_1fr_100px_110px_120px_90px_50px] gap-3 px-4 py-2.5">
            <span>Order</span>
            <span>Customer</span>
            <span>Total</span>
            <span>Status</span>
            <span>Payment</span>
            <span>Placed</span>
            <span></span>
          </div>
          {orders === null ? (
            <p className="px-4 py-4 text-[13px] text-muted">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">No orders match.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-[130px_1fr_100px_110px_120px_90px_50px] items-center gap-3 border-b border-chrome px-4 py-2.5 text-[13px] text-slate last:border-b-0"
              >
                <span className="font-mono text-[11.5px] text-ink">…{o.orderNumber.slice(-9)}</span>
                <span className="truncate">{o.customerName}</span>
                <span className="font-semibold text-ink">{formatMoney(o.total)}</span>
                <StatusText status={o.status} />
                <span className={`text-[11.5px] ${o.paymentStatus === "paid" ? "text-success" : "text-warn"}`}>
                  {o.paymentMethod ? `${o.paymentMethod} · ` : ""}
                  {o.paymentStatus}
                </span>
                <span className="font-mono text-[11.5px] text-faint">{formatDate(o.createdAt)}</span>
                <Link to={`/orders/${o.id}`} className="font-medium text-[12px] text-accent hover:underline">
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
