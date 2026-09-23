import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import { apiGet } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Analytics as AnalyticsType } from "@/lib/types";

export default function Analytics() {
  const [data, setData] = useState<AnalyticsType | null>(null);

  useEffect(() => {
    apiGet<AnalyticsType>("/admin/analytics").then(setData);
  }, []);

  if (!data) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  const maxRevenue = Math.max(1, ...data.revenueByDay.map((d) => d.total));
  const maxCategoryRevenue = Math.max(1, ...data.salesByCategory.map((c) => c.revenue));
  const maxWeeklyCustomers = Math.max(1, ...data.customerGrowth.map((c) => c.count));

  return (
    <div>
      <PageHeader
        title="Analytics"
        actions={<span className="rounded-md border border-border px-3 py-1.5 font-body text-[11.5px] font-medium text-muted">All-time · 90D trend</span>}
      />

      <div className="px-8 py-6">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Total revenue (paid)" value={formatMoney(data.totals.totalRevenue)} />
          <Tile label="Total orders (paid)" value={String(data.totals.totalOrders)} />
          <Tile label="Avg order value" value={formatMoney(Math.round(data.totals.avgOrderValue))} />
          <Tile label="Total customers" value={String(data.totals.totalCustomers)} />
        </div>

        <div className="card mb-4 p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[13px] font-semibold text-ink">Revenue by day</span>
            <span className="font-mono text-[10.5px] text-faint">INR · 90D</span>
          </div>
          {data.revenueByDay.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted">No paid orders in the last 90 days yet.</p>
          ) : (
            <div className="mt-4 flex h-[150px] gap-1">
              {data.revenueByDay.map((d) => (
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-4">
            <div className="font-display text-[13px] font-semibold text-ink">Top products</div>
            {data.topProducts.length === 0 ? (
              <p className="mt-3 text-[12px] text-muted">No paid orders yet.</p>
            ) : (
              data.topProducts.map((p) => (
                <div key={p.name} className="rule flex items-center justify-between gap-2 py-2 font-body text-[12px] text-slate">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="flex-none font-mono text-faint">{p.unitsSold} sold</span>
                  <span className="flex-none font-mono font-semibold text-ink">{formatMoney(p.revenue)}</span>
                </div>
              ))
            )}
          </div>

          <div className="card p-4">
            <div className="font-display text-[13px] font-semibold text-ink">Sales by category</div>
            {data.salesByCategory.length === 0 ? (
              <p className="mt-3 text-[12px] text-muted">No paid orders yet.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2.5">
                {data.salesByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between font-body text-[12px] text-slate">
                      <span>{c.category}</span>
                      <span className="font-mono font-semibold text-ink">{formatMoney(c.revenue)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-chrome">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{ width: `${Math.max(4, (c.revenue / maxCategoryRevenue) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="font-display text-[13px] font-semibold text-ink">Orders by status</div>
            <div className="mt-3 flex flex-col gap-2">
              {data.ordersByStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <StatusText status={s.status} />
                  <span className="font-mono text-[12px] font-semibold text-ink">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mt-4 p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[13px] font-semibold text-ink">New customers by week</span>
            <span className="font-mono text-[10.5px] text-faint">all-time</span>
          </div>
          {data.customerGrowth.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted">No customers yet.</p>
          ) : (
            <div className="mt-4 flex h-[110px] gap-1.5">
              {data.customerGrowth.map((c) => (
                <div key={c.week} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div
                    className="w-full rounded-t-sm bg-success/35 transition-colors group-hover:bg-success"
                    style={{ height: `${Math.max(4, (c.count / maxWeeklyCustomers) * 100)}%` }}
                    title={`Week of ${c.week}: ${c.count} new customers`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3.5">
      <div className="eyebrow">{label}</div>
      <div className="mt-1.5 font-display text-[22px] font-bold text-ink">{value}</div>
    </div>
  );
}
