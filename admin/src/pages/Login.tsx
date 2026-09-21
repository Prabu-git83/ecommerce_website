import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiPost, ApiClientError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import Field from "@/components/Field";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (accessToken) {
    const next = (location.state as { next?: string })?.next ?? "/";
    return <Navigate to={next} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<{ admin: { id: string; email: string; name: string; role: string }; accessToken: string }>(
        "/admin/auth/login",
        { email, password }
      );
      setSession(res);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="block h-[26px] w-[26px] rounded-[6px] bg-accent" />
          <span className="font-display text-[16px] font-bold text-ink">ARCA Admin</span>
        </div>

        <div className="card p-7">
          <h1 className="font-display text-[20px] font-semibold text-ink">Operations console</h1>
          <p className="mt-1.5 text-[13px] text-muted">Sign in with your admin account.</p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <Field label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </Field>
            <Field label="Password">
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error ? <p className="text-[12.5px] text-warn">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="btn-pill mt-1 flex h-11 items-center justify-center btn-primary font-body text-[13px] font-medium disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center font-mono text-[11px] text-faint">Demo credentials — admin@arca.local / admin123</p>
      </div>
    </div>
  );
}
