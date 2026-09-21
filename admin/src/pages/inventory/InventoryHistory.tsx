import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { apiGet } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { StockMovement } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = { in: "Stock in", out: "Stock out", adjustment: "Adjustment" };

export default function InventoryHistory() {
  const { variantId } = useParams<{ variantId: string }>();
  const [history, setHistory] = useState<StockMovement[] | null>(null);

  useEffect(() => {
    if (!variantId) return;
    apiGet<StockMovement[]>(`/admin/inventory/${variantId}/history`).then(setHistory);
  }, [variantId]);

  return (
    <div>
      <PageHeader title="Inventory history" actions={<Link to="/inventory">← Back to inventory</Link>} />

      <div className="max-w-[700px] px-8 py-6">
        <div className="table-card">
          <div className="table-head grid grid-cols-[120px_80px_90px_90px_1fr] gap-3 px-4 py-2.5">
            <span>Date</span>
            <span>Type</span>
            <span>Change</span>
            <span>Result</span>
            <span>Reason</span>
          </div>
          {history === null ? (
            <p className="px-4 py-4 text-[13px] text-muted">Loading…</p>
          ) : history.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">No stock movements recorded for this variant yet.</p>
          ) : (
            history.map((m) => (
              <div key={m.id} className="grid grid-cols-[120px_80px_90px_90px_1fr] gap-3 border-b border-chrome px-4 py-2.5 text-[13px] text-ink last:border-b-0">
                <span className="font-mono text-[11.5px] text-muted">{formatDateTime(m.createdAt)}</span>
                <span>{TYPE_LABEL[m.type] ?? m.type}</span>
                <span className={`font-mono ${m.quantity >= 0 ? "text-success" : "text-warn"}`}>
                  {m.quantity >= 0 ? "+" : ""}
                  {m.quantity}
                </span>
                <span className="font-mono text-muted">
                  {m.qtyBefore} → {m.qtyAfter}
                </span>
                <span className="text-muted">{m.reason ?? "—"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
