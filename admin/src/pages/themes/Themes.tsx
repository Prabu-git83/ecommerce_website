import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { apiGet, apiPut, ApiClientError } from "@/lib/api";
import type { ThemesResponse } from "@/lib/types";

function rgb(triplet: string) {
  return `rgb(${triplet.split(" ").join(" ")})`;
}

export default function Themes() {
  const [data, setData] = useState<ThemesResponse | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiGet<ThemesResponse>("/admin/themes").then(setData);
  }

  useEffect(() => {
    load();
  }, []);

  async function activate(themeId: string) {
    setActivatingId(themeId);
    setError(null);
    try {
      const updated = await apiPut<ThemesResponse>("/admin/themes/active", { themeId });
      setData(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not activate theme");
    } finally {
      setActivatingId(null);
    }
  }

  if (!data) return <div className="p-8 text-[13px] text-muted">Loading…</div>;

  return (
    <div>
      <PageHeader title="Themes" sub="Customer-facing website" />

      <div className="px-8 py-6">
        {error ? <p className="mb-4 text-[12.5px] text-warn">{error}</p> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.themes.map((theme) => {
            const isActive = theme.id === data.activeThemeId;
            return (
              <div key={theme.id} className={`card overflow-hidden ${isActive ? "border-accent" : ""}`}>
                <div className="flex h-20" style={{ background: rgb(theme.tokens.paper) }}>
                  <div className="flex flex-1 items-center justify-center">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-semibold text-white"
                      style={{ background: rgb(theme.tokens.accent) }}
                    >
                      Aa
                    </span>
                  </div>
                  <div className="h-full w-3" style={{ background: rgb(theme.tokens.chrome) }} />
                  <div className="h-full w-3" style={{ background: rgb(theme.tokens.ink) }} />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[14px] font-semibold text-ink">{theme.name}</span>
                    {isActive ? <span className="status-pill bg-success-soft text-success-text">Active</span> : null}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{theme.description}</p>
                  {!isActive ? (
                    <button
                      onClick={() => activate(theme.id)}
                      disabled={activatingId === theme.id}
                      className="btn-pill mt-3 flex h-8 w-full items-center justify-center border border-border-strong text-[12px] font-medium text-ink hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      {activatingId === theme.id ? "Activating…" : "Activate"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
