"use client";

import { useEffect, useState } from "react";
import { apiGetJson, apiPost, apiDelete, ApiClientError } from "@/lib/client-api";
import Field from "@/components/Field";
import type { Address } from "@/lib/types";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const list = await apiGetJson<Address[]>("/customers/me/addresses");
    setAddresses(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await apiDelete(`/customers/me/addresses/${id}`);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="max-w-[560px]">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Addresses</h1>

      {!loading && addresses.length === 0 ? <p className="mt-4 text-[13.5px] text-muted">No saved addresses yet.</p> : null}

      <div className="mt-6 flex flex-col gap-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="rounded-lg border border-border-faint p-4 text-[13.5px] leading-relaxed text-ink">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">
                  {addr.fullName} {addr.isDefault ? <span className="ml-1 text-[11px] text-accent">Default</span> : null}
                </div>
                <div className="text-muted">
                  {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}
                  {addr.city}, {addr.state} {addr.postcode}
                </div>
                {addr.phone ? <div className="text-muted">{addr.phone}</div> : null}
              </div>
              <button onClick={() => remove(addr.id)} className="text-[12px] text-faint hover:text-warn">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <NewAddressForm
          onCreated={(addr) => {
            setAddresses((prev) => [addr, ...prev]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button onClick={() => setShowForm(true)} className="mt-5 text-[13px] text-accent hover:underline">
          + Add a new address
        </button>
      )}
    </div>
  );
}

function NewAddressForm({ onCreated, onCancel }: { onCreated: (addr: Address) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postcode: "", isDefault: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const addr = await apiPost<Address>("/customers/me/addresses", form);
      onCreated(addr);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 grid grid-cols-2 gap-3 rounded-lg border border-border-faint p-4">
      <Field label="Full name">
        <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full" />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full" />
      </Field>
      <div className="col-span-2">
        <Field label="Address line 1">
          <input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="w-full" />
        </Field>
      </div>
      <div className="col-span-2">
        <Field label="Address line 2 (optional)">
          <input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="w-full" />
        </Field>
      </div>
      <Field label="City">
        <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full" />
      </Field>
      <Field label="State">
        <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full" />
      </Field>
      <Field label="Postcode">
        <input required value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="w-full" />
      </Field>
      <label className="col-span-2 flex items-center gap-2 text-[13px] text-ink">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
        Set as default address
      </label>
      <div className="col-span-2 flex items-center gap-3">
        {error ? <p className="text-[12px] text-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-pill flex h-10 items-center justify-center bg-ink px-6 text-[12.5px] font-medium text-paper disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save address"}
        </button>
        <button type="button" onClick={onCancel} className="text-[12.5px] text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
