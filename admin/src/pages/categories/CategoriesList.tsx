import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Field from "@/components/Field";
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [showForm, setShowForm] = useState<{ parentId: string | null } | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);

  async function load() {
    const tree = await apiGet<Category[]>("/admin/categories");
    setCategories(tree);
  }

  useEffect(() => {
    load();
  }, []);

  async function deactivate(id: string) {
    if (!confirm("Deactivate this category? It will be hidden from the storefront.")) return;
    await apiDelete(`/admin/categories/${id}`);
    load();
  }

  function renderRows(nodes: Category[], depth: number): React.ReactNode {
    return nodes.map((c) => (
      <div key={c.id}>
        <div className="rule grid grid-cols-[1fr_100px_80px_90px_110px] items-center gap-3 py-2.5">
          <span className="text-[13px] text-ink" style={{ paddingLeft: depth * 20 }}>
            {depth > 0 ? "— " : ""}
            {c.name}
          </span>
          <span className="font-mono text-[11px] text-muted">{c.productCount} items</span>
          <span className="font-mono text-[11.5px] text-muted">order {c.sortOrder}</span>
          <span className={`text-[12px] font-semibold ${c.isActive ? "text-accent" : "text-faint"}`}>{c.isActive ? "Active" : "Inactive"}</span>
          <div className="flex gap-3">
            <button onClick={() => setEditing(c)} className="text-[12px] text-accent hover:underline">
              Edit
            </button>
            {depth === 0 ? (
              <button onClick={() => setShowForm({ parentId: c.id })} className="text-[12px] text-accent hover:underline">
                + Sub
              </button>
            ) : null}
            {c.isActive ? (
              <button onClick={() => deactivate(c.id)} className="text-[12px] text-warn hover:underline">
                Deactivate
              </button>
            ) : null}
          </div>
        </div>
        {renderRows(c.children, depth + 1)}
      </div>
    ));
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        actions={
          <button onClick={() => setShowForm({ parentId: null })} className="btn-pill bg-ink px-5 py-2 font-medium text-paper">
            New category
          </button>
        }
      />

      <div className="max-w-[760px] px-8 py-6">
        {showForm ? (
          <CategoryForm
            parentId={showForm.parentId}
            onDone={() => {
              setShowForm(null);
              load();
            }}
            onCancel={() => setShowForm(null)}
          />
        ) : null}

        {editing ? (
          <CategoryForm
            category={editing}
            parentId={editing.parentId}
            onDone={() => {
              setEditing(null);
              load();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}

        <div className="mt-4 grid grid-cols-[1fr_100px_80px_90px_110px] gap-3 rule pb-2 font-mono text-[9.5px] uppercase tracking-wider text-faint">
          <span>Category</span>
          <span>Products</span>
          <span>Sort</span>
          <span>Status</span>
          <span></span>
        </div>
        {categories === null ? <p className="mt-4 text-[13px] text-muted">Loading…</p> : renderRows(categories, 0)}
      </div>
    </div>
  );
}

function CategoryForm({
  category,
  parentId,
  onDone,
  onCancel,
}: {
  category?: Category;
  parentId: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: category?.name ?? "",
    description: category?.description ?? "",
    imageUrl: category?.imageUrl ?? "",
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (category) {
        await apiPut(`/admin/categories/${category.id}`, form);
      } else {
        await apiPost("/admin/categories", { ...form, parentId });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-border-strong bg-surface p-4">
      <div className="col-span-2 font-display text-[15px] font-bold text-ink">
        {category ? `Edit ${category.name}` : parentId ? "New subcategory" : "New category"}
      </div>
      <Field label="Name">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Sort order">
        <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
      </Field>
      <div className="col-span-2">
        <Field label="Description">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>
      <div className="col-span-2">
        <Field label="Image URL">
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        </Field>
      </div>
      <label className="col-span-2 flex items-center gap-2 text-[13px] text-ink">
        <input type="checkbox" className="!w-auto" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Active (visible on storefront)
      </label>
      <div className="col-span-2 flex items-center gap-3">
        {error ? <p className="text-[12px] text-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-pill flex h-9 items-center justify-center bg-ink px-5 text-[12.5px] font-medium text-paper disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="text-[12.5px] text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
