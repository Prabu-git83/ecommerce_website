const COLOR_MAP: Record<string, string> = {
  // order status
  pending: "text-warn",
  confirmed: "text-accent",
  processing: "text-muted",
  shipped: "text-info",
  delivered: "text-accent",
  cancelled: "text-warn",
  return_requested: "text-warn",
  returned: "text-muted",
  // payment / stock / product status
  paid: "text-accent",
  unpaid: "text-warn",
  refunded: "text-muted",
  partially_refunded: "text-warn",
  active: "text-accent",
  draft: "text-faint",
  archived: "text-faint",
  suspended: "text-warn",
  low_stock: "text-warn",
  out_of_stock: "text-warn",
  in_stock: "text-accent",
};

export default function StatusText({ status, label }: { status: string; label?: string }) {
  const color = COLOR_MAP[status] ?? "text-muted";
  return <span className={`font-semibold text-[12px] capitalize ${color}`}>{(label ?? status).replace(/_/g, " ")}</span>;
}
