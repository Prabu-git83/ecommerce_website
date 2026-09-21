"use client";

import { useRef, useState } from "react";
import Field from "./Field";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/auth";
import { ApiClientError } from "@/lib/client-api";

const RESEND_COOLDOWN_SECONDS = 45;

export default function OtpLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && cooldownTimer.current) clearInterval(cooldownTimer.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await requestLoginOtp(email);
      setStep("code");
      startCooldown();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not send code");
    } finally {
      setSending(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await verifyLoginOtp(email, code);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not verify code");
    } finally {
      setVerifying(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="flex flex-col gap-4">
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
        </Field>
        {error ? <p className="text-[13px] text-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={sending}
          className="btn-pill btn-primary mt-2 flex h-11 items-center justify-center font-body text-[13px] font-semibold disabled:opacity-50 disabled:shadow-none"
        >
          {sending ? "Sending code…" : "Send sign-in code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-4">
      <p className="text-[13px] text-muted">
        We sent a 6-digit code to <strong className="text-ink">{email}</strong>. In local dev, check{" "}
        <a href="http://localhost:8025" className="text-accent hover:underline">
          Mailpit
        </a>
        .
      </p>
      <Field label="6-digit code">
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full !tracking-[0.3em]"
        />
      </Field>
      {error ? <p className="text-[13px] text-warn">{error}</p> : null}
      <button
        type="submit"
        disabled={verifying || code.length !== 6}
        className="btn-pill btn-primary mt-2 flex h-11 items-center justify-center font-body text-[13px] font-semibold disabled:opacity-50 disabled:shadow-none"
      >
        {verifying ? "Verifying…" : "Verify & sign in"}
      </button>
      <div className="flex justify-between text-[13px] text-muted">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="hover:text-ink"
        >
          Use a different email
        </button>
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={async () => {
            setError(null);
            try {
              await requestLoginOtp(email);
              startCooldown();
            } catch (err) {
              setError(err instanceof ApiClientError ? err.message : "Could not resend code");
            }
          }}
          className="hover:text-ink disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
