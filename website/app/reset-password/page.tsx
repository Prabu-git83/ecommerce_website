"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import Field from "@/components/Field";
import { apiPost, ApiClientError } from "@/lib/client-api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost("/auth/reset-password", { token, password });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not reset password");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid link">
        <p className="text-[13.5px] text-muted">This reset link is missing its token. Please request a new one.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="New password">
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" />
        </Field>
        {error ? <p className="text-[13px] text-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="btn-pill mt-2 flex h-12 items-center justify-center bg-ink font-body text-[13.5px] font-medium text-paper disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
