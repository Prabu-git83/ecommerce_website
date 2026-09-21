const STYLES: Record<string, string> = {
  // order status
  pending: "bg-warning-soft text-warning-text",
  confirmed: "bg-accent-soft text-accent-dark",
  processing: "bg-chrome text-slate",
  shipped: "bg-accent-soft text-accent-dark",
  delivered: "bg-success-soft text-success-text",
  cancelled: "bg-warn-soft text-warn-text",
  return_requested: "bg-warning-soft text-warning-text",
  returned: "bg-chrome text-slate",
  // payment status
  paid: "bg-success-soft text-success-text",
  unpaid: "bg-warning-soft text-warning-text",
  refunded: "bg-chrome text-slate",
  partially_refunded: "bg-warning-soft text-warning-text",
  // product / customer status
  active: "bg-success-soft text-success-text",
  draft: "bg-chrome text-slate",
  archived: "bg-chrome text-slate",
  suspended: "bg-warn-soft text-warn-text",
  // stock status
  low_stock: "bg-warning-soft text-warning-text",
  out_of_stock: "bg-warn-soft text-warn-text",
  in_stock: "bg-success-soft text-success-text",
};

export default function StatusText({ status, label }: { status: string; label?: string }) {
  const style = STYLES[status] ?? "bg-chrome text-slate";
  return <span className={`status-pill ${style}`}>{(label ?? status).replace(/_/g, " ")}</span>;
}
