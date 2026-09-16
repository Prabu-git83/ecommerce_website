export default function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="rule-strong flex flex-wrap items-end justify-between gap-3 px-8 pb-3.5 pt-5">
      <span className="font-display text-[26px] font-extrabold tracking-tight text-ink">
        {title} {sub ? <span className="ml-1 font-mono text-[12.5px] font-normal tracking-normal text-faint">{sub}</span> : null}
      </span>
      {actions ? <div className="flex items-center gap-4 font-body text-[12.5px] text-muted">{actions}</div> : null}
    </div>
  );
}
