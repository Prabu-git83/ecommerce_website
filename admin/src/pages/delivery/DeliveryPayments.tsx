import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Field from "@/components/Field";
import { apiGet, apiPut, ApiClientError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { hasPermission } from "@/lib/permissions";
import type { DeliveryPaymentSettings } from "@/lib/types";

const PAYMENT_MODES: { key: keyof DeliveryPaymentSettings; label: string }[] = [
  { key: "payment_cod_enabled", label: "Cash on delivery (COD)" },
  { key: "payment_card_enabled", label: "Card" },
  { key: "payment_upi_enabled", label: "UPI" },
  { key: "payment_wallet_enabled", label: "Wallet" },
];

export default function DeliveryPayments() {
  const admin = useAuthStore((s) => s.admin);
  const canDelivery = hasPermission(admin, "delivery");
  const canPayments = hasPermission(admin, "payments");

  const [settings, setSettings] = useState<DeliveryPaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DeliveryPaymentSettings>("/admin/delivery-payments")
      .then(setSettings)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load settings"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await apiPut<DeliveryPaymentSettings>("/admin/delivery-payments", settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) {
    return (
      <div>
        <PageHeader title="Delivery & Payments" />
        <p className="px-8 py-6 text-[13px] text-warn">{error}</p>
      </div>
    );
  }

  if (!settings) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  return (
    <div>
      <PageHeader title="Delivery & Payments" />

      <form onSubmit={save} className="flex max-w-[560px] flex-col gap-4 px-8 py-6">
        {canDelivery ? (
          <div className="card grid grid-cols-2 gap-4 p-5">
            <div className="col-span-2 font-display text-[14px] font-semibold text-ink">Delivery</div>
            <Field label="Free shipping threshold (₹)">
              <input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
              />
            </Field>
            <Field label="Delivery estimate" hint="e.g. 3-5 (days)">
              <input
                value={settings.delivery_days_estimate}
                onChange={(e) => setSettings({ ...settings, delivery_days_estimate: e.target.value })}
              />
            </Field>
          </div>
        ) : null}

        {canPayments ? (
          <div className="card p-5">
            <div className="font-display text-[14px] font-semibold text-ink">Payment modes</div>
            <div className="mt-3 flex flex-col gap-2.5">
              {PAYMENT_MODES.map((m) => (
                <label key={m.key} className="flex items-center gap-2.5 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    className="!w-auto"
                    checked={settings[m.key] === "true"}
                    onChange={(e) => setSettings({ ...settings, [m.key]: e.target.checked ? "true" : "false" })}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
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
  );
}
