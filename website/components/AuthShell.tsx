export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[440px] px-5 py-16 sm:py-24">
      <div className="eyebrow">Arca</div>
      <h1 className="mt-2 font-display text-[30px] font-extrabold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-2 text-[13.5px] text-muted">{subtitle}</p> : null}
      <div className="rule-strong mt-6 pt-6">{children}</div>
    </div>
  );
}
