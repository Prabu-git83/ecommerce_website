"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "./Field";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().optional(),
  message: z.string().min(10, "Tell us a bit more (10+ characters)"),
});
type FormValues = z.infer<typeof schema>;

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch(`${API_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setServerError(json.error?.message ?? "Could not send your message");
      return;
    }
    setSent(true);
    reset();
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent/10 px-5 py-4 text-[13.5px] text-accent">
        Thanks — we received your message and will reply within 1-2 business days.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} className="w-full" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className="w-full" />
        </Field>
      </div>
      <Field label="Subject (optional)">
        <input {...register("subject")} className="w-full" />
      </Field>
      <Field label="Message" error={errors.message?.message}>
        <textarea rows={5} {...register("message")} className="w-full resize-none" />
      </Field>
      {serverError ? <p className="text-[13px] text-warn">{serverError}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-pill mt-1 flex h-12 w-fit items-center justify-center btn-primary px-7 font-body text-[13.5px] font-medium  disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
