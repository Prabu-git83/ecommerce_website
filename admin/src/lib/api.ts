import { useAuthStore } from "./auth-store";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";

export class ApiClientError extends Error {
  code: string;
  fields: Record<string, string> | null;
  constructor(message: string, code: string, fields: Record<string, string> | null) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

type Envelope<T> = { data: T; meta: Record<string, unknown> | null; error: { code: string; message: string; fields: Record<string, string> | null } | null };

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken, clear } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clear();
  }

  const json = (await res.json()) as Envelope<T>;
  if (!res.ok || json.error) {
    throw new ApiClientError(json.error?.message ?? "Something went wrong", json.error?.code ?? "unknown", json.error?.fields ?? null);
  }
  return json.data;
}

export async function apiRequestWithMeta<T>(path: string, options: RequestInit = {}): Promise<{ data: T; meta: Record<string, unknown> | null }> {
  const { accessToken, clear } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) clear();

  const json = (await res.json()) as Envelope<T>;
  if (!res.ok || json.error) {
    throw new ApiClientError(json.error?.message ?? "Something went wrong", json.error?.code ?? "unknown", json.error?.fields ?? null);
  }
  return { data: json.data, meta: json.meta };
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const { accessToken, clear } = useAuthStore.getState();
  const headers = new Headers();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { method: "POST", body: formData, headers });
  if (res.status === 401) clear();

  const json = (await res.json()) as Envelope<T>;
  if (!res.ok || json.error) {
    throw new ApiClientError(json.error?.message ?? "Something went wrong", json.error?.code ?? "unknown", json.error?.fields ?? null);
  }
  return json.data;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPut = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string) => apiRequest<T>(path, { method: "DELETE" });
