import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import { apiGet } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { CustomerListItem } from "@/lib/types";

export default function CustomersList() {
  const [customers, setCustomers] = useState<CustomerListItem[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    apiGet<CustomerListItem[]>(`/admin/customers?${params.toString()}`).then(setCustomers);
  }, [q]);

  return (
    <div>
      <PageHeader
        title="Customers"
        sub={customers ? `${customers.length} shown` : undefined}
        actions={<input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="!w-64 !py-1.5" />}
      />

      <div className="px-8 py-6">
        <div className="table-card">
          <div className="table-head grid grid-cols-[1fr_110px_90px_120px_100px_60px] gap-3 px-4 py-2.5">
            <span>Customer</span>
            <span>Orders</span>
            <span>Spend</span>
            <span>Joined</span>
            <span>Status</span>
            <span></span>
          </div>
          {customers === null ? (
            <p className="px-4 py-4 text-[13px] text-muted">Loading…</p>
          ) : customers.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">No customers match.</p>
          ) : (
            customers.map((c) => (
              <div key={c.id} className="grid grid-cols-[1fr_110px_90px_120px_100px_60px] items-center gap-3 border-b border-chrome px-4 py-2.5 text-[13px] text-ink last:border-b-0">
                <span>
                  <span className="block font-semibold">
                    {c.firstName} {c.lastName}
                  </span>
                  <span className="block font-mono text-[11px] text-muted">{c.email}</span>
                </span>
                <span className="font-mono">{c.orderCount}</span>
                <span className="font-semibold">{formatMoney(c.totalSpend)}</span>
                <span className="font-mono text-[11.5px] text-faint">{formatDate(c.createdAt)}</span>
                <StatusText status={c.status} />
                <Link to={`/customers/${c.id}`} className="font-medium text-[12px] text-accent hover:underline">
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
