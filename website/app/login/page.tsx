"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthShell from "@/components/AuthShell";
import Field from "@/components/Field";
import { login } from "@/lib/auth";
import { ApiClientError } from "@/lib/client-api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.push(searchParams.get("next") ?? "/account");
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to Arca.">
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
          className="btn-pill mt-2 flex h-12 items-center justify-center bg-ink font-body text-[13.5px] font-medium text-paper disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
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
