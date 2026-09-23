import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Field from "@/components/Field";
import { apiGet, apiPut, ApiClientError } from "@/lib/api";
import type { PlatformSettings } from "@/lib/types";

const FIELDS: { key: keyof PlatformSettings; label: string; hint?: string; type?: string }[] = [
  { key: "default_tax_rate", label: "Default tax rate %", hint: "applied when a variant has no tax rate of its own", type: "number" },
  { key: "low_stock_threshold", label: "Default low-stock threshold", hint: "used when a new variant doesn't set its own", type: "number" },
  { key: "free_shipping_threshold", label: "Free shipping threshold (₹)", type: "number" },
  { key: "currency", label: "Currency code" },
  { key: "support_email", label: "Support email" },
  { key: "support_hours", label: "Support hours" },
];

export default function Configuration() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<PlatformSettings>("/admin/settings").then(setSettings);
  }, []);

  if (!settings) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await apiPut<PlatformSettings>("/admin/settings", settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Configuration" sub="Platform-wide settings" />

      <div className="max-w-[560px] px-8 py-6">
        <form onSubmit={save} className="card grid grid-cols-2 gap-4 p-5">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === "support_hours" || f.key === "support_email" ? "col-span-2" : ""}>
              <Field label={f.label} hint={f.hint}>
                <input
                  type={f.type ?? "text"}
                  value={settings[f.key]}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                />
              </Field>
            </div>
          ))}

          <div className="col-span-2 flex items-center gap-3 pt-1">
            {error ? <p className="text-[12px] text-warn">{error}</p> : null}
            {saved ? <p className="text-[12px] font-medium text-success">Saved</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="btn-pill flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
