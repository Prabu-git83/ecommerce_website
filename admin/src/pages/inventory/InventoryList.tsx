import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { apiGet, apiPost, apiPut, ApiClientError } from "@/lib/api";
import type { InventoryRow } from "@/lib/types";

export default function InventoryList() {
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [q, setQ] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (lowStockOnly) params.set("lowStockOnly", "true");
    if (q) params.set("q", q);
    const items = await apiGet<InventoryRow[]>(`/admin/inventory?${params.toString()}`);
    setRows(items);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly, q]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        sub={rows ? `${rows.length} SKUs` : undefined}
        actions={
          <>
            <input placeholder="Search SKU or product…" value={q} onChange={(e) => setQ(e.target.value)} className="!w-56 !py-1.5" />
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="!w-auto" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
              Low stock only
            </label>
          </>
        }
      />

      <div className="px-8 py-6">
        <div className="table-card">
          <div className="table-head grid grid-cols-[minmax(0,1fr)_110px_90px_90px_90px_100px_130px] gap-3 px-4 py-2.5">
            <span>Product</span>
            <span>SKU</span>
            <span>On hand</span>
            <span>Reserved</span>
            <span>Available</span>
            <span>Threshold</span>
            <span></span>
          </div>

          {rows === null ? (
            <p className="px-4 py-4 text-[13px] text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">No inventory rows match.</p>
          ) : (
            rows.map((r) => (
              <div key={r.inventoryId} className="border-b border-chrome last:border-b-0">
                <div className="grid grid-cols-[minmax(0,1fr)_110px_90px_90px_90px_100px_130px] items-center gap-3 px-4 py-2.5 text-[13px] text-ink">
                  <span className="truncate">
                    {r.productName}
                    {r.variantName ? <span className="text-muted"> · {r.variantName}</span> : null}
                  </span>
                  <span className="font-mono text-[11px] text-muted">{r.sku}</span>
                  <span className="font-mono">{r.qtyOnHand}</span>
                  <span className="font-mono text-muted">{r.qtyReserved}</span>
                  <span className={`font-mono ${r.qtyAvailable <= r.lowStockThreshold ? "font-semibold text-warning" : "text-success"}`}>
                    {r.qtyAvailable}
                  </span>
                  <span className="font-mono text-muted">{r.lowStockThreshold}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAdjustingId(adjustingId === r.variantId ? null : r.variantId)} className="text-[12px] font-medium text-accent hover:underline">
                      Adjust
                    </button>
                    <Link to={`/inventory/${r.variantId}/history`} className="text-[12px] text-muted hover:text-ink">
                      History
                    </Link>
                  </div>
                </div>
                {adjustingId === r.variantId ? (
                  <div className="px-4 pb-3">
                    <AdjustPanel row={r} onDone={() => { setAdjustingId(null); load(); }} />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdjustPanel({ row, onDone }: { row: InventoryRow; onDone: () => void }) {
  const [type, setType] = useState<"in" | "out" | "adjustment">("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState(String(row.lowStockThreshold));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/admin/inventory/${row.variantId}/adjust`, { type, quantity: Number(quantity), reason: reason || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not adjust stock");
    } finally {
      setSaving(false);
    }
  }

  async function submitThreshold() {
    await apiPut(`/admin/inventory/${row.variantId}/threshold`, { lowStockThreshold: Number(threshold) });
    onDone();
  }

  return (
    <div className="mb-3 grid grid-cols-[repeat(4,auto)_1fr] items-end gap-3 card p-4">
      <form onSubmit={submitAdjust} className="col-span-5 grid grid-cols-[140px_120px_1fr_auto] items-end gap-3">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="!w-full">
            <option value="in">Stock in</option>
            <option value="out">Stock out</option>
            <option value="adjustment">Adjustment (recount)</option>
          </select>
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">{type === "adjustment" ? "New qty on hand" : "Quantity"}</span>
          <input type="number" min={0} required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Reason</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. new shipment, damaged, recount" />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="btn-pill flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
        >
          {saving ? "Applying…" : "Apply"}
        </button>
      </form>

      <div className="col-span-5 flex items-end gap-3 border-t border-border pt-3">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Low-stock threshold</span>
          <input type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} className="!w-28" />
        </label>
        <button onClick={submitThreshold} className="btn-pill border border-border-strong px-4 py-2 text-[12.5px] text-ink hover:border-ink">
          Save threshold
        </button>
        {error ? <p className="text-[12px] text-warn">{error}</p> : null}
      </div>
    </div>
  );
}
