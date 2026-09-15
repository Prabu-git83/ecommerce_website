"use client";

import { useAuthStore } from "./stores/auth-store";
import type { ApiEnvelope } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export class ApiClientError extends Error {
  code: string;
  fields: Record<string, string> | null;
  constructor(message: string, code: string, fields: Record<string, string> | null) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

async function doFetch(path: string, options: RequestInit, accessToken: string | null) {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
}

async function tryRefresh(): Promise<string | null> {
  const { refreshToken, user, setSession, clear } = useAuthStore.getState();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clear();
    return null;
  }

  const json = (await res.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>;
  if (json.error) {
    clear();
    return null;
  }

  setSession({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken, user: user! });
  return json.data.accessToken;
}

// Client-side request helper: attaches the bearer token, sends the guest-cart
// cookie automatically (credentials: include), and retries once after a
// silent refresh if the access token had expired.
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let { accessToken } = useAuthStore.getState();
  let res = await doFetch(path, options, accessToken);

  if (res.status === 401 && accessToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await doFetch(path, options, refreshed);
    }
  }

  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || json.error) {
    throw new ApiClientError(json.error?.message ?? "Something went wrong", json.error?.code ?? "unknown", json.error?.fields ?? null);
  }
  return json.data;
}

export function apiGetJson<T>(path: string) {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export function apiPut<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
}

export function apiDelete<T>(path: string) {
  return apiRequest<T>(path, { method: "DELETE" });
}
