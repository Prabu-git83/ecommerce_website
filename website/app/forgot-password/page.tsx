"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import Field from "@/components/Field";
import { apiPost } from "@/lib/client-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/auth/forgot-password", { email });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to set a new password.">
      {sent ? (
        <p className="text-[13.5px] text-ink">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. Check Mailpit at{" "}
          <a href="http://localhost:8025" className="text-accent hover:underline">
            localhost:8025
          </a>{" "}
          in local dev.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="btn-pill mt-2 flex h-12 items-center justify-center bg-ink font-body text-[13.5px] font-medium text-paper disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
