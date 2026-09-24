const STYLES: Record<string, string> = {
  new: "bg-warning-soft text-warning-text",
  open: "bg-accent-soft text-accent-ink",
  resolved: "bg-success-soft text-success-text",
  closed: "bg-chrome text-slate",
};

export default function TicketStatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${STYLES[status] ?? "bg-chrome text-slate"}`}>{status}</span>;
}
