"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetJson } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import TicketStatusPill from "@/components/TicketStatusPill";
import type { TicketSummary } from "@/lib/types";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);

  useEffect(() => {
    apiGetJson<TicketSummary[]>("/tickets").then(setTickets);
  }, []);

  if (!tickets) return <p className="text-[13.5px] text-muted">Loading tickets…</p>;

  if (tickets.length === 0) {
    return (
      <div>
        <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Tickets</h1>
        <p className="mt-3 text-[13.5px] text-muted">
          You haven&apos;t contacted support yet. Messages sent from the{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Contact us
          </Link>{" "}
          page while signed in will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Tickets</h1>
      <div className="mt-6 flex flex-col">
        {tickets.map((t) => (
          <Link
            key={t.id}
            href={`/account/tickets/${t.id}`}
            className="rule flex items-center justify-between gap-4 py-4 hover:bg-chrome/40"
          >
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold text-ink">{t.subject || "Support request"}</div>
              <div className="mt-0.5 font-mono text-[11.5px] text-faint">{formatDate(t.createdAt)}</div>
            </div>
            <TicketStatusPill status={t.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
