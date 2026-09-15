export default function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[12px] text-warn">{error}</span> : null}
    </label>
  );
}
