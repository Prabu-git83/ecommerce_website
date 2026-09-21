import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import Field from "@/components/Field";
import { apiGet, apiPost, apiPut, ApiClientError } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderDetail as OrderDetailType } from "@/lib/types";

const NEXT_STATUS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["return_requested"],
  return_requested: ["returned"],
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);
  const [savingRefund, setSavingRefund] = useState(false);

  async function load() {
    if (!id) return;
    const o = await apiGet<OrderDetailType>(`/admin/orders/${id}`);
    setOrder(o);
    setRefundAmount(o.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!order) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  const options = NEXT_STATUS[order.status] ?? [];
  const address = order.shippingAddressSnapshot;
  const capturedPayment = order.payments.find((p) => p.status === "captured");

  async function submitStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!nextStatus) return;
    setSavingStatus(true);
    setStatusError(null);
    try {
      await apiPut(`/admin/orders/${id}/status`, { status: nextStatus, note: note || undefined });
      setNote("");
      setNextStatus("");
      await load();
    } catch (err) {
      setStatusError(err instanceof ApiClientError ? err.message : "Could not update status");
    } finally {
      setSavingStatus(false);
    }
  }

  async function submitRefund(e: React.FormEvent) {
    e.preventDefault();
    setSavingRefund(true);
    setRefundError(null);
    try {
      await apiPost(`/admin/orders/${id}/refund`, { amount: Number(refundAmount), reason: refundReason });
      setRefundReason("");
      await load();
    } catch (err) {
      setRefundError(err instanceof ApiClientError ? err.message : "Could not process refund");
    } finally {
      setSavingRefund(false);
    }
  }

  return (
    <div>
      <PageHeader title={order.orderNumber} sub={formatDate(order.createdAt)} actions={<Link to="/orders">← Back to orders</Link>} />

      <div className="flex flex-col gap-10 px-8 py-6 lg:flex-row">
        <div className="flex-[1.6]">
          <div className="flex items-center gap-4">
            <StatusText status={order.status} />
            <span className={`text-[12px] font-semibold ${order.paymentStatus === "paid" ? "text-success" : "text-warn"}`}>
              {order.paymentStatus} {order.paymentMethod ? `· ${order.paymentMethod}` : ""}
            </span>
          </div>

          <div className="mt-5">
            {order.items.map((item) => (
              <div key={item.id} className="rule flex items-center justify-between py-3 text-[13px] text-ink">
                <div>
                  <div className="font-semibold">{item.productSnapshot.name}</div>
                  <div className="text-[12px] text-muted">
                    {item.productSnapshot.variantName ? `${item.productSnapshot.variantName} · ` : ""}
                    Qty {item.quantity}
                  </div>
                </div>
                <span className="font-semibold">{formatMoney(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 max-w-[280px] text-[13px] text-muted">
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

          {order.history.length > 0 ? (
            <div className="mt-8">
              <div className="eyebrow mb-3">Tracking</div>
              {order.history.map((h) => (
                <div key={h.id} className="flex justify-between py-1.5 text-[12.5px] text-muted">
                  <span className="capitalize text-ink">{h.status.replace(/_/g, " ")}</span>
                  <span>{h.note}</span>
                  <span className="font-mono text-[11px]">{formatDate(h.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {options.length > 0 ? (
            <form onSubmit={submitStatus} className="mt-8 flex flex-wrap items-end gap-3 card p-4">
              <Field label="Update status">
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="!w-44">
                  <option value="">Select…</option>
                  {options.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Note (optional)">
                <input value={note} onChange={(e) => setNote(e.target.value)} className="!w-56" />
              </Field>
              <button
                type="submit"
                disabled={!nextStatus || savingStatus}
                className="btn-pill flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
              >
                {savingStatus ? "Updating…" : "Update"}
              </button>
              {statusError ? <p className="w-full text-[12px] text-warn">{statusError}</p> : null}
            </form>
          ) : null}

          {order.paymentStatus === "paid" && capturedPayment ? (
            <form onSubmit={submitRefund} className="mt-4 flex flex-wrap items-end gap-3 card p-4">
              <Field label="Refund amount (₹)">
                <input type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="!w-32" />
              </Field>
              <Field label="Reason">
                <input required value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="!w-56" />
              </Field>
              <button
                type="submit"
                disabled={savingRefund}
                className="btn-pill flex h-9 items-center justify-center border border-warn px-5 text-[12.5px] font-medium text-warn disabled:opacity-50"
              >
                {savingRefund ? "Processing…" : "Process refund"}
              </button>
              {refundError ? <p className="w-full text-[12px] text-warn">{refundError}</p> : null}
            </form>
          ) : null}

          {order.refunds.length > 0 ? (
            <div className="mt-4">
              <div className="eyebrow mb-2">Refunds</div>
              {order.refunds.map((r) => (
                <div key={r.id} className="flex justify-between py-1 text-[12.5px] text-muted">
                  <span>{r.reason}</span>
                  <span className="font-semibold text-ink">{formatMoney(r.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="w-full lg:w-[280px]">
          <div className="eyebrow mb-2">Customer</div>
          {order.customer ? (
            <Link to={`/customers/${order.customer.id}`} className="text-[13.5px] text-accent hover:underline">
              {order.customer.firstName} {order.customer.lastName}
            </Link>
          ) : (
            <span className="text-[13.5px] text-muted">Guest</span>
          )}
          <div className="text-[12.5px] text-muted">{order.customer?.email}</div>

          {address?.fullName ? (
            <div className="mt-5">
              <div className="eyebrow mb-2">Delivery address</div>
              <div className="text-[13px] leading-relaxed text-ink">
                {address.fullName}
                <br />
                {address.line1}, {address.city}, {address.state} {address.postcode}
              </div>
            </div>
          ) : null}
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
