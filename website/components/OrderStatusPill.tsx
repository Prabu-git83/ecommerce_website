const STYLES: Record<string, string> = {
  pending: "bg-warning-soft text-warning-text",
  confirmed: "bg-accent-soft text-accent-ink",
  processing: "bg-chrome text-slate",
  shipped: "bg-accent-soft text-accent-ink",
  delivered: "bg-success-soft text-success-text",
  cancelled: "bg-warn-soft text-warn-text",
  return_requested: "bg-warning-soft text-warning-text",
  returned: "bg-chrome text-slate",
};

export default function OrderStatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${STYLES[status] ?? "bg-chrome text-slate"}`}>{status.replace(/_/g, " ")}</span>;
}
