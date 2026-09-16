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
      <PageHeader title="Dashboard" actions={<span>Last 30 days</span>} />

      <div className="px-8 py-6">
        <div className="grid grid-cols-2 gap-0 rule pb-4 mb-5 sm:grid-cols-4">
          <Tile label="GMV (paid)" value={formatMoney(summary.gmv)} />
          <Tile label="Orders (paid)" value={String(summary.orderCount)} border />
          <Tile label="AOV" value={formatMoney(Math.round(summary.aov))} border />
          <Tile
            label="Low stock SKUs"
            value={String(summary.lowStockCount)}
            border
            valueClass={summary.lowStockCount > 0 ? "text-warn" : undefined}
          />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-[1.6]">
            <div className="rule flex items-baseline justify-between pb-3">
              <span className="font-display text-[16px] font-extrabold tracking-tight text-ink">Revenue by day</span>
              <span className="font-mono text-[10.5px] text-faint">INR · 30D</span>
            </div>
            {summary.revenueByDay.length === 0 ? (
              <p className="mt-4 text-[13px] text-muted">No paid orders in the last 30 days yet.</p>
            ) : (
              <div className="mt-4 flex h-[160px] items-end gap-1.5">
                {summary.revenueByDay.map((d) => (
                  <div key={d.date} className="group relative flex-1">
                    <div
                      className="w-full bg-accent/70 transition-colors group-hover:bg-accent"
                      style={{ height: `${Math.max(4, (d.total / maxRevenue) * 100)}%` }}
                      title={`${d.date}: ${formatMoney(d.total)}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="rule pb-3 font-display text-[16px] font-extrabold tracking-tight text-ink">Needs attention</div>
            {attention.map((a) => (
              <div key={a.label} className="rule flex justify-between py-2.5 font-body text-[13px] text-ink">
                <span>{a.label}</span>
                <span className={`font-mono ${a.value > 0 ? "text-warn" : "text-faint"}`}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, border, valueClass }: { label: string; value: string; border?: boolean; valueClass?: string }) {
  return (
    <div className={border ? "border-l border-border px-5" : "pr-5"}>
      <div className="eyebrow">{label}</div>
      <div className={`mt-2 font-display text-[28px] font-extrabold tracking-tight text-ink ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}
