import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { apiGet } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DashboardSummary } from "@/lib/types";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    apiGet<DashboardSummary>("/admin/dashboard").then(setSummary);
  }, []);

  if (!summary) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  const maxRevenue = Math.max(1, ...summary.revenueByDay.map((d) => d.total));
  const attention = [
    { label: "Awaiting fulfilment", value: summary.needsAttention.awaitingFulfilment },
    { label: "Payment failed", value: summary.needsAttention.paymentFailed },
    { label: "Low stock SKUs", value: summary.needsAttention.lowStockSkus },
    { label: "Out of stock SKUs", value: summary.outOfStockCount },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          <span className="rounded-md border border-border px-3 py-1.5 font-body text-[11.5px] font-medium text-muted">Last 30 days</span>
        }
      />

      <div className="px-8 py-6">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="GMV (paid)" value={formatMoney(summary.gmv)} />
          <Tile label="Orders (paid)" value={String(summary.orderCount)} />
          <Tile label="AOV" value={formatMoney(Math.round(summary.aov))} />
          <Tile
            label="Low stock SKUs"
            value={String(summary.lowStockCount)}
            valueClass={summary.lowStockCount > 0 ? "text-warn" : undefined}
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="card flex-[1.6] p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-[13px] font-semibold text-ink">Revenue by day</span>
              <span className="font-mono text-[10.5px] text-faint">INR · 30D</span>
            </div>
            {summary.revenueByDay.length === 0 ? (
              <p className="mt-4 text-[13px] text-muted">No paid orders in the last 30 days yet.</p>
            ) : (
              <div className="mt-4 flex h-[160px] gap-1.5">
                {summary.revenueByDay.map((d) => (
                  <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-accent/35 transition-colors group-hover:bg-accent"
                      style={{ height: `${Math.max(4, (d.total / maxRevenue) * 100)}%` }}
                      title={`${d.date}: ${formatMoney(d.total)}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card flex-1 p-4">
            <div className="font-display text-[13px] font-semibold text-ink">Needs attention</div>
            {attention.map((a) => (
              <div key={a.label} className="rule flex justify-between py-2 font-body text-[12px] text-slate">
                <span>{a.label}</span>
                <span className={`font-mono font-semibold ${a.value > 0 ? "text-warning" : "text-ink"}`}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="card p-3.5">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1.5 font-display text-[22px] font-bold text-ink ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}
