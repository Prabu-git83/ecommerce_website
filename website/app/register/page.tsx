"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthShell from "@/components/AuthShell";
import Field from "@/components/Field";
import { register as registerUser } from "@/lib/auth";
import { ApiClientError } from "@/lib/client-api";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values);
      router.push("/account");
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthShell title="Create an account" subtitle="Faster checkout, order tracking, saved addresses.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName?.message}>
            <input {...formRegister("firstName")} className="w-full" />
          </Field>
          <Field label="Last name">
            <input {...formRegister("lastName")} className="w-full" />
          </Field>
        </div>
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <div className="mt-5 text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink hover:underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
