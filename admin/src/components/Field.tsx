export default function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-[11.5px] text-warn">{error}</span> : null}
    </label>
  );
}
