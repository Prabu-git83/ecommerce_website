export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { data, meta: meta ?? null, error: null };
}
