import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Field from "@/components/Field";
import { apiGet, apiPut, apiUpload, apiDelete, ApiClientError } from "@/lib/api";
import type { BannerSettings } from "@/lib/types";

export default function Banner() {
  const [banner, setBanner] = useState<BannerSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    apiGet<BannerSettings>("/admin/banner").then(setBanner);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!banner) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { banner_image_url, ...text } = banner;
      const updated = await apiPut<BannerSettings>("/admin/banner", text);
      setBanner(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save banner");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await apiUpload<BannerSettings>("/admin/banner/image", formData);
      setBanner(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage() {
    try {
      const updated = await apiDelete<BannerSettings>("/admin/banner/image");
      setBanner(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not remove image");
    }
  }

  if (!banner) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  return (
    <div>
      <PageHeader title="Homepage Banner" sub="Customer-facing website" />

      <div className="grid grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="card grid grid-cols-2 gap-4 p-5">
            <div className="col-span-2 font-display text-[14px] font-semibold text-ink">Text</div>
            <Field label="Eyebrow label" hint='e.g. "Banner · New season"'>
              <input value={banner.banner_eyebrow} onChange={(e) => setBanner({ ...banner, banner_eyebrow: e.target.value })} />
            </Field>
            <Field label="CTA button label">
              <input value={banner.banner_cta_label} onChange={(e) => setBanner({ ...banner, banner_cta_label: e.target.value })} />
            </Field>
            <div className="col-span-2">
              <Field label="Heading">
                <input value={banner.banner_heading} onChange={(e) => setBanner({ ...banner, banner_heading: e.target.value })} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Subtext">
                <textarea rows={2} value={banner.banner_subtext} onChange={(e) => setBanner({ ...banner, banner_subtext: e.target.value })} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="CTA link" hint="a path like /products, or a full URL">
                <input value={banner.banner_cta_link} onChange={(e) => setBanner({ ...banner, banner_cta_link: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="card p-5">
            <div className="font-display text-[14px] font-semibold text-ink">Image</div>
            <p className="mt-1 text-[11.5px] text-faint">Optional — without one, the banner shows a plain accent-colored gradient.</p>
            <div className="mt-3 flex items-center gap-3">
              {banner.banner_image_url ? (
                <div className="group relative h-20 w-32 flex-none overflow-hidden rounded-md border border-border">
                  <img src={banner.banner_image_url} alt="Banner" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-warn text-[11px] text-white opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-20 w-32 flex-none flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-strong text-faint hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <span className="text-[20px] leading-none">{uploading ? "…" : "+"}</span>
                <span className="text-[10px] font-medium">{uploading ? "Uploading" : banner.banner_image_url ? "Replace" : "Upload"}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error ? <p className="text-[12px] text-warn">{error}</p> : null}
            {saved ? <p className="text-[12px] font-medium text-success">Saved</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="btn-pill flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <div>
          <div className="eyebrow mb-2">Preview</div>
          <div
            className="flex h-[180px] flex-col justify-center rounded-lg p-6 text-white"
            style={
              banner.banner_image_url
                ? {
                    backgroundImage: `linear-gradient(rgba(15,23,42,.55), rgba(15,23,42,.55)), url(${banner.banner_image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { background: "linear-gradient(100deg, #1F63D6, #164BA6)" }
            }
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] opacity-80">{banner.banner_eyebrow}</span>
            <h1 className="mt-2 font-display text-[20px] font-semibold leading-[1.15] tracking-tight">{banner.banner_heading}</h1>
            <p className="mt-1.5 text-[12px] opacity-90">{banner.banner_subtext}</p>
            <span className="btn-pill mt-3 inline-flex w-fit items-center bg-white px-4 py-2 font-body text-[11px] font-semibold text-ink">
              {banner.banner_cta_label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
