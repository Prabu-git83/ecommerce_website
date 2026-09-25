import type { ApiEnvelope } from "./types";

// Server-side calls use the absolute API_URL; the browser bundle uses NEXT_PUBLIC_API_URL,
// which in production is the same-origin path "/v1" proxied by next.config.mjs rewrites
// (keeps the guest-cart cookie first-party).
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

// Server Component helper for public, unauthenticated catalogue data (SSR/SEO pages).
export async function apiGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Request to ${path} failed`);
  }
  return json.data;
}

export async function apiGetWithMeta<T>(path: string, revalidate = 60): Promise<{ data: T; meta: Record<string, unknown> | null }> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Request to ${path} failed`);
  }
  return { data: json.data, meta: json.meta };
}

export { API_URL };
