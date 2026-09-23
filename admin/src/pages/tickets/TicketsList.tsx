import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import { apiRequestWithMeta } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { TicketListItem } from "@/lib/types";

const TABS = [
  { key: undefined, label: "All" },
  { key: "new", label: "New" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
] as const;

export default function TicketsList() {
  const [tickets, setTickets] = useState<TicketListItem[] | null>(null);
  const [counts, setCounts] = useState<{ total: number; byStatus: Record<string, number> }>({ total: 0, byStatus: {} });
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    apiRequestWithMeta<TicketListItem[]>(`/admin/tickets?${params.toString()}`).then(({ data, meta }) => {
      setTickets(data);
      if (meta?.counts) setCounts(meta.counts as any);
    });
  }, [status, q]);

  return (
    <div>
      <PageHeader
        title="Tickets"
        sub={String(counts.total)}
        actions={<input placeholder="Search name, email, subject…" value={q} onChange={(e) => setQ(e.target.value)} className="!w-64 !py-1.5" />}
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
          <div className="table-head grid grid-cols-[1fr_170px_100px_100px_50px] gap-3 px-4 py-2.5">
            <span>From</span>
            <span>Subject</span>
            <span>Status</span>
            <span>Received</span>
            <span></span>
          </div>
          {tickets === null ? (
            <p className="px-4 py-4 text-[13px] text-muted">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">No tickets match.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[1fr_170px_100px_100px_50px] items-center gap-3 border-b border-chrome px-4 py-2.5 text-[13px] text-slate last:border-b-0"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{t.name}</span>
                  <span className="block truncate font-mono text-[11px] text-muted">{t.email}</span>
                </span>
                <span className="truncate">{t.subject || "—"}</span>
                <StatusText status={t.status} />
                <span className="font-mono text-[11.5px] text-faint">{formatDate(t.createdAt)}</span>
                <Link to={`/tickets/${t.id}`} className="font-medium text-[12px] text-accent hover:underline">
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
