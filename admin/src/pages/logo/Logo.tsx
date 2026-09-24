import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { apiGet, apiUpload, apiDelete, ApiClientError } from "@/lib/api";
import type { LogoSettings } from "@/lib/types";

export default function Logo() {
  const [logo, setLogo] = useState<LogoSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet<LogoSettings>("/admin/logo")
      .then(setLogo)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load logo"));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      setLogo(await apiUpload<LogoSettings>("/admin/logo/image", formData));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeLogo() {
    setError(null);
    try {
      setLogo(await apiDelete<LogoSettings>("/admin/logo/image"));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not remove logo");
    }
  }

  if (!logo) {
    return (
      <div>
        <PageHeader title="Logo" />
        <p className={`px-8 py-6 text-[13px] ${error ? "text-warn" : "text-muted"}`}>{error ?? "Loading…"}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Logo" sub="Customer-facing website" />
      <div className="max-w-[560px] px-8 py-6">
        <div className="card p-5">
          <div className="font-display text-[14px] font-semibold text-ink">Site logo</div>
          <p className="mt-1 text-[11.5px] text-faint">
            Shown in the website header and footer. PNG, JPG, WebP or SVG; a wide image with a transparent background works best. Without one, the site shows the "ARCA" wordmark.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-20 w-56 items-center justify-center rounded-md border border-border bg-white p-3">
              {logo.site_logo_url ? (
                <img src={logo.site_logo_url} alt="Site logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="font-display text-xl font-bold tracking-tight text-ink">ARCA</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-pill btn-primary px-4 py-2 text-[12.5px] font-medium disabled:opacity-50"
              >
                {uploading ? "Uploading…" : logo.site_logo_url ? "Replace logo" : "Upload logo"}
              </button>
              {logo.site_logo_url ? (
                <button type="button" onClick={removeLogo} className="text-left text-[12px] text-warn hover:underline">
                  Remove logo
                </button>
              ) : null}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>
          {error ? <p className="mt-3 text-[12px] text-warn">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
