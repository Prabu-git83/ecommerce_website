export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[420px] px-5 py-12 sm:py-16">
      <div className="eyebrow">Arca</div>
      <h1 className="mt-2 font-display text-[24px] font-semibold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-[13px] text-muted">{subtitle}</p> : null}
      <div className="card mt-6 p-6">{children}</div>
    </div>
  );
}
