import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import { apiGet, apiPost, apiPut, ApiClientError } from "@/lib/api";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type { CustomerDetail as CustomerDetailType } from "@/lib/types";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetailType | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const c = await apiGet<CustomerDetailType>(`/admin/customers/${id}`);
    setCustomer(c);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!customer) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  async function toggleStatus() {
    if (!id || !customer) return;
    const next = customer.status === "active" ? "suspended" : "active";
    if (!confirm(`${next === "suspended" ? "Suspend" : "Reactivate"} this customer's account?`)) return;
    await apiPut(`/admin/customers/${id}/status`, { status: next });
    load();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) return;
    setSavingNote(true);
    setError(null);
    try {
      await apiPost(`/admin/customers/${id}/notes`, { note: note.trim() });
      setNote("");
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save note");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || customer.email}
        sub={customer.email}
        actions={<Link to="/customers">← Back to customers</Link>}
      />

      <div className="flex flex-col gap-10 px-8 py-6 lg:flex-row">
        <div className="flex-[1.6]">
          <div className="flex items-center gap-3">
            <StatusText status={customer.status} />
            <span className="font-mono text-[11px] text-faint">Joined {formatDate(customer.createdAt)}</span>
            <button onClick={toggleStatus} className="ml-2 text-[12px] text-warn hover:underline">
              {customer.status === "active" ? "Suspend account" : "Reactivate account"}
            </button>
          </div>

          <div className="mt-6">
            <div className="rule-strong pb-2 font-display text-[16px] font-extrabold tracking-tight text-ink">Order history</div>
            {customer.orders.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">No orders yet.</p>
            ) : (
              customer.orders.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} className="rule flex items-center justify-between py-2.5 text-[13px] hover:bg-chrome/40">
                  <span className="font-mono text-[11.5px] text-muted">{o.orderNumber}</span>
                  <StatusText status={o.status} />
                  <span className="font-mono text-[11px] text-faint">{formatDate(o.createdAt)}</span>
                  <span className="font-semibold text-ink">{formatMoney(o.total)}</span>
                </Link>
              ))
            )}
          </div>

          <div className="mt-8">
            <div className="rule-strong pb-2 font-display text-[16px] font-extrabold tracking-tight text-ink">Support notes</div>
            <p className="mt-2 text-[12px] text-muted">
              Lightweight log of support interactions — no full ticketing system in this phase.
            </p>
            {customer.notes.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">No notes yet.</p>
            ) : (
              customer.notes.map((n) => (
                <div key={n.id} className="rule py-2.5 text-[13px] text-ink">
                  <div>{n.note}</div>
                  <div className="mt-1 font-mono text-[10.5px] text-faint">{formatDateTime(n.createdAt)}</div>
                </div>
              ))
            )}
            <form onSubmit={addNote} className="mt-3 flex gap-2">
              <input placeholder="Log a support interaction…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button
                type="submit"
                disabled={savingNote}
                className="btn-pill flex-none border border-border-strong px-4 text-[12.5px] text-ink hover:border-ink"
              >
                Add
              </button>
            </form>
            {error ? <p className="mt-1.5 text-[12px] text-warn">{error}</p> : null}
          </div>
        </div>

        <div className="w-full lg:w-[280px]">
          <div className="eyebrow mb-2">Contact</div>
          <div className="text-[13px] text-ink">{customer.email}</div>
          <div className="text-[13px] text-ink">{customer.phone ?? "—"}</div>

          <div className="mt-5 eyebrow mb-2">Addresses</div>
          {customer.addresses.length === 0 ? (
            <p className="text-[13px] text-muted">None saved.</p>
          ) : (
            customer.addresses.map((a) => (
              <div key={a.id} className="mb-3 text-[12.5px] leading-relaxed text-muted">
                <div className="font-semibold text-ink">{a.fullName}</div>
                {a.line1}, {a.city}, {a.state} {a.postcode}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
