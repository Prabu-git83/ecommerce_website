"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiPut, ApiClientError } from "@/lib/client-api";
import Field from "@/components/Field";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName ?? "", lastName: user.lastName ?? "", phone: user.phone ?? "" });
    }
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiPut<{ firstName: string; lastName: string | null }>("/customers/me", form);
      setUser({ ...(user as User), firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-[440px]">
      <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Your profile</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full" />
          </Field>
          <Field label="Last name">
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full" />
          </Field>
        </div>
        <Field label="Email">
          <input value={user.email} disabled className="w-full opacity-60" />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full" />
        </Field>
        {error ? <p className="text-[13px] text-warn">{error}</p> : null}
        {saved ? <p className="text-[13px] text-accent">Saved.</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-pill btn-primary mt-2 flex h-11 w-fit items-center justify-center px-6 font-body text-[13px] font-semibold disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
