"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TicketStatusPill from "@/components/TicketStatusPill";
import { apiGetJson } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import type { TicketDetail } from "@/lib/types";

const STATUS_HELP: Record<string, string> = {
  new: "We've received your message and haven't started on it yet.",
  open: "Our team is looking into this.",
  resolved: "This has been resolved. Reply on Contact us if you need anything further.",
  closed: "This ticket is closed.",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);

  useEffect(() => {
    apiGetJson<TicketDetail>(`/tickets/${id}`).then(setTicket);
  }, [id]);

  if (!ticket) return <p className="text-[13.5px] text-muted">Loading ticket…</p>;

  return (
    <div>
      <div className="rule-strong flex flex-wrap items-baseline justify-between gap-2 pb-4">
        <div>
          <div className="font-mono text-[12px] text-faint">Submitted {formatDate(ticket.createdAt)}</div>
          <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-ink">{ticket.subject || "Support request"}</h1>
        </div>
        <TicketStatusPill status={ticket.status} />
      </div>

      <div className="mt-6 max-w-[560px]">
        <p className="text-[13px] text-muted">{STATUS_HELP[ticket.status] ?? ""}</p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-semibold text-ink">You</span>
              <span className="font-mono text-[10.5px] text-faint">{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{ticket.message}</div>
          </div>

          {ticket.replies.map((r) => (
            <div key={r.id} className="card border-accent/25 bg-accent-soft p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] font-semibold text-accent-dark">Arca Support</span>
                <span className="font-mono text-[10.5px] text-faint">{formatDate(r.createdAt)}</span>
              </div>
              <div className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{r.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
