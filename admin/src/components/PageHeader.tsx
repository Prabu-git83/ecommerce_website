export default function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-8 py-3.5">
      <span className="font-display text-[16px] font-semibold text-ink">
        {title} {sub ? <span className="ml-1.5 font-mono text-[12px] font-normal text-faint">{sub}</span> : null}
      </span>
      {actions ? <div className="flex items-center gap-3 font-body text-[12.5px] text-muted">{actions}</div> : null}
    </div>
  );
}
