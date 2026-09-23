import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import Field from "@/components/Field";
import { apiGet, apiPost, apiPut, ApiClientError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { TicketDetail as TicketDetailType } from "@/lib/types";

const STATUS_OPTIONS = ["new", "open", "resolved", "closed"];

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [note, setNote] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  async function load() {
    if (!id) return;
    const t = await apiGet<TicketDetailType>(`/admin/tickets/${id}`);
    setTicket(t);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!ticket) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  async function changeStatus(status: string) {
    if (!id) return;
    setSavingStatus(true);
    try {
      await apiPut(`/admin/tickets/${id}/status`, { status });
      await load();
    } finally {
      setSavingStatus(false);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) return;
    setSavingReply(true);
    setReplyError(null);
    try {
      await apiPost(`/admin/tickets/${id}/replies`, { note: note.trim() });
      setNote("");
      await load();
    } catch (err) {
      setReplyError(err instanceof ApiClientError ? err.message : "Could not save reply");
    } finally {
      setSavingReply(false);
    }
  }

  return (
    <div>
      <PageHeader title={ticket.subject || "Ticket"} sub={ticket.email} actions={<Link to="/tickets">← Back to tickets</Link>} />

      <div className="flex flex-col gap-10 px-8 py-6 lg:flex-row">
        <div className="flex-[1.6]">
          <div className="flex items-center gap-3">
            <StatusText status={ticket.status} />
            <span className="font-mono text-[11px] text-faint">Received {formatDateTime(ticket.createdAt)}</span>
          </div>

          <div className="card mt-4 p-4">
            <div className="font-body text-[13px] font-semibold text-ink">{ticket.name}</div>
            <div className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate">{ticket.message}</div>
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-2">Update status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={savingStatus || s === ticket.status}
                  onClick={() => changeStatus(s)}
                  className={`btn-pill border px-3.5 py-1.5 text-[12px] font-medium capitalize disabled:opacity-40 ${
                    s === ticket.status ? "border-accent bg-accent-soft text-accent-dark" : "border-border text-muted hover:border-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="eyebrow mb-3">Replies</div>
            <p className="mb-3 text-[11.5px] text-faint">Visible to the customer on their account&apos;s ticket page.</p>
            {ticket.replies.length === 0 ? (
              <p className="text-[13px] text-muted">No replies yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {ticket.replies.map((r) => (
                  <div key={r.id} className="rule pb-3 text-[13px] text-ink">
                    <div className="whitespace-pre-wrap">{r.note}</div>
                    <div className="mt-1 font-mono text-[10.5px] text-faint">{formatDateTime(r.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={submitReply} className="mt-4">
              <Field label="Reply to the customer">
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="This will be visible to the customer…" />
              </Field>
              {replyError ? <p className="mt-1.5 text-[12px] text-warn">{replyError}</p> : null}
              <button
                type="submit"
                disabled={savingReply || !note.trim()}
                className="btn-pill mt-2 flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
              >
                {savingReply ? "Saving…" : "Send reply"}
              </button>
            </form>
          </div>
        </div>

        <div className="w-full lg:w-[260px]">
          <div className="eyebrow mb-2">Contact</div>
          <div className="text-[13px] text-ink">{ticket.name}</div>
          <div className="text-[12.5px] text-muted">{ticket.email}</div>
        </div>
      </div>
    </div>
  );
}
