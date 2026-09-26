"use client";

import { Suspense } from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthShell from "@/components/AuthShell";
import Field from "@/components/Field";
import OtpLoginForm from "@/components/OtpLoginForm";
import { login } from "@/lib/auth";
import { ApiClientError } from "@/lib/client-api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

type Mode = "password" | "otp";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("password");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function goToNext() {
    router.push(searchParams.get("next") ?? "/account");
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      goToNext();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to Arca.">
      <div className="mb-6 flex gap-5 font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
        <button
          onClick={() => setMode("password")}
          className={mode === "password" ? "border-b-[1.5px] border-accent pb-0.5 text-accent" : "text-ink"}
        >
          Password
        </button>
        <button
          onClick={() => setMode("otp")}
          className={mode === "otp" ? "border-b-[1.5px] border-accent pb-0.5 text-accent" : "text-ink"}
        >
          Email code
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Email" error={errors.email?.message}>
            <input type="email" {...formRegister("email")} className="w-full" />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input type="password" {...formRegister("password")} className="w-full" />
          </Field>
          {serverError ? <p className="text-[13px] text-warn">{serverError}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill btn-primary mt-2 flex h-11 items-center justify-center font-body text-[13px] font-semibold disabled:opacity-50 disabled:shadow-none"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <OtpLoginForm onSuccess={goToNext} />
      )}

      <div className="mt-5 flex justify-between text-[13px] text-muted">
        <Link href="/forgot-password" className="hover:text-ink">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-ink">
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
