import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Field from "@/components/Field";
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Category, ProductDetail, Warehouse } from "@/lib/types";

function parseAttributes(input: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of input.split(",")) {
    const [k, v] = pair.split(":").map((s) => s.trim());
    if (k && v) out[k.toLowerCase()] = v;
  }
  return out;
}

function attributesToString(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    shortDesc: "",
    description: "",
    status: "draft",
    isFeatured: false,
    metaTitle: "",
    metaDescription: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatCategories = flattenCategories(categories);

  useEffect(() => {
    apiGet<Category[]>("/admin/categories").then(setCategories);
  }, []);

  useEffect(() => {
    if (!id) return;
    apiGet<ProductDetail>(`/admin/products/${id}`).then((p) => {
      setProduct(p);
      setForm({
        name: p.name,
        categoryId: p.categoryId ?? "",
        shortDesc: p.shortDesc ?? "",
        description: p.description ?? "",
        status: p.status,
        isFeatured: p.isFeatured,
        metaTitle: p.metaTitle ?? "",
        metaDescription: p.metaDescription ?? "",
      });
    });
  }, [id]);

  async function reload() {
    if (!id) return;
    const p = await apiGet<ProductDetail>(`/admin/products/${id}`);
    setProduct(p);
  }

  async function saveBasic(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, categoryId: form.categoryId || null };
      if (isNew) {
        const created = await apiPost<ProductDetail>("/admin/products", payload);
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        await apiPut(`/admin/products/${id}`, payload);
        await reload();
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!id || !confirm("Deactivate this product? It will stop showing on the storefront.")) return;
    await apiDelete(`/admin/products/${id}`);
    await reload();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New product" : product?.name ?? "Product"} sub={product ? `/${product.slug}` : undefined} />

      <div className="max-w-[640px] px-8 py-6">
        <form onSubmit={saveBasic} className="flex flex-col gap-4">
          <Field label="Product name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— None —</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prefix}
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>

          <Field label="Short description">
            <input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} maxLength={500} />
          </Field>
          <Field label="Description">
            <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>

          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              className="!w-auto"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            Featured on homepage
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Meta title (SEO)">
              <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
            </Field>
            <Field label="Meta description (SEO)">
              <input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
            </Field>
          </div>

          {error ? <p className="text-[12.5px] text-warn">{error}</p> : null}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-pill flex h-10 items-center justify-center btn-primary px-6 font-body text-[13px] font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
            </button>
            {!isNew && product?.status !== "archived" ? (
              <button type="button" onClick={archive} className="text-[12.5px] text-warn hover:underline">
                Deactivate product
              </button>
            ) : null}
          </div>
        </form>

        {!isNew && product ? (
          <>
            <ImagesSection product={product} onChange={reload} />
            <VariantsSection product={product} onChange={reload} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function flattenCategories(tree: Category[]): { id: string; name: string; prefix: string }[] {
  const out: { id: string; name: string; prefix: string }[] = [];
  function walk(nodes: Category[], depth: number) {
    for (const n of nodes) {
      out.push({ id: n.id, name: n.name, prefix: depth > 0 ? "— ".repeat(depth) : "" });
      walk(n.children, depth + 1);
    }
  }
  walk(tree, 0);
  return out;
}

function ImagesSection({ product, onChange }: { product: ProductDetail; onChange: () => void }) {
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  async function addImage(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setAdding(true);
    try {
      await apiPost(`/admin/products/${product.id}/images`, { url: url.trim() });
      setUrl("");
      onChange();
    } finally {
      setAdding(false);
    }
  }

  async function removeImage(imageId: string) {
    await apiDelete(`/admin/products/${product.id}/images/${imageId}`);
    onChange();
  }

  return (
    <div className="rule-strong mt-10 pb-4 pt-2">
      <div className="font-display text-[18px] font-semibold text-ink">Images</div>
      <div className="mt-4 flex flex-wrap gap-3">
        {product.images.map((img) => (
          <div key={img.id} className="group relative h-20 w-20">
            <img src={img.url} alt={img.alt ?? ""} className="h-full w-full rounded-md border border-border-strong object-cover" />
            <button
              onClick={() => removeImage(img.id)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] text-paper opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={addImage} className="mt-3 flex gap-2">
        <input placeholder="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} className="!w-80" />
        <button type="submit" disabled={adding} className="btn-pill border border-border-strong px-4 text-[12.5px] text-ink hover:border-ink">
          Add
        </button>
      </form>
    </div>
  );
}

function VariantsSection({ product, onChange }: { product: ProductDetail; onChange: () => void }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="pb-16 pt-2">
      <div className="rule-strong flex items-center justify-between pb-4">
        <span className="font-display text-[18px] font-semibold text-ink">Variants</span>
        <button onClick={() => setShowForm((v) => !v)} className="text-[12.5px] text-accent hover:underline">
          {showForm ? "Cancel" : "+ Add variant"}
        </button>
      </div>

      {showForm ? <NewVariantForm productId={product.id} onCreated={() => { setShowForm(false); onChange(); }} /> : null}

      <div className="mt-2 flex flex-col">
        {product.variants.map((v) => (
          <VariantRow key={v.id} productId={product.id} variant={v} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function NewVariantForm({ productId, onCreated }: { productId: string; onCreated: () => void }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({ name: "", sku: "", price: "", comparePrice: "", taxRate: "", attributes: "", initialStock: "0" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Warehouse[]>("/admin/warehouses").then(setWarehouses);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/admin/products/${productId}/variants`, {
        name: form.name || undefined,
        sku: form.sku,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        taxRate: form.taxRate ? Number(form.taxRate) : null,
        attributes: parseAttributes(form.attributes),
        initialStock: Number(form.initialStock),
        warehouseId: warehouses[0]?.id,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create variant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 grid grid-cols-3 gap-3 card p-4">
      <Field label="Variant name">
        <input placeholder="e.g. Black / M" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="SKU">
        <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
      </Field>
      <Field label="Attributes" hint="color:Black, size:M">
        <input value={form.attributes} onChange={(e) => setForm({ ...form, attributes: e.target.value })} />
      </Field>
      <Field label="Price (₹)">
        <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      </Field>
      <Field label="Compare-at / discount price (₹)">
        <input type="number" step="0.01" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} />
      </Field>
      <Field label="Tax rate %" hint="blank = platform default 18%">
        <input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
      </Field>
      <Field label="Initial stock">
        <input type="number" min={0} value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} />
      </Field>
      <div className="col-span-3 flex items-center gap-3">
        {error ? <p className="text-[12px] text-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-pill flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add variant"}
        </button>
      </div>
    </form>
  );
}

function VariantRow({ productId, variant, onChange }: { productId: string; variant: ProductDetail["variants"][number]; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: variant.name ?? "",
    price: variant.price,
    comparePrice: variant.comparePrice ?? "",
    taxRate: variant.taxRate ?? "",
    attributes: attributesToString(variant.attributes),
  });
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    try {
      await apiPut(`/admin/products/${productId}/variants/${variant.id}`, {
        name: form.name || undefined,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        taxRate: form.taxRate ? Number(form.taxRate) : null,
        attributes: parseAttributes(form.attributes),
      });
      setEditing(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save variant");
    }
  }

  async function remove() {
    if (!confirm(`Delete variant ${variant.sku}?`)) return;
    try {
      await apiDelete(`/admin/products/${productId}/variants/${variant.id}`);
      onChange();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Could not delete variant");
    }
  }

  if (editing) {
    return (
      <div className="rule grid grid-cols-6 gap-2 py-2.5">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="!py-1.5 !text-[12.5px]" />
        <input value={form.attributes} onChange={(e) => setForm({ ...form, attributes: e.target.value })} className="!py-1.5 !text-[12.5px]" />
        <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="!py-1.5 !text-[12.5px]" />
        <input
          type="number"
          value={form.comparePrice}
          onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
          className="!py-1.5 !text-[12.5px]"
        />
        <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="!py-1.5 !text-[12.5px]" />
        <div className="flex items-center gap-2">
          <button onClick={save} className="text-[12px] text-accent hover:underline">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="text-[12px] text-muted hover:underline">
            Cancel
          </button>
        </div>
        {error ? <p className="col-span-6 text-[11.5px] text-warn">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rule grid grid-cols-6 items-center gap-2 py-2.5 text-[13px] text-ink">
      <span>{variant.name ?? "—"}</span>
      <span className="font-mono text-[11.5px] text-muted">{variant.sku}</span>
      <span className="font-semibold">{formatMoney(variant.price)}</span>
      <span className="text-faint">{variant.comparePrice ? formatMoney(variant.comparePrice) : "—"}</span>
      <span className={`font-mono text-[12px] ${(variant.inventory?.qtyAvailable ?? 0) <= (variant.inventory?.lowStockThreshold ?? 5) ? "text-warning font-semibold" : "text-success"}`}>
        {variant.inventory?.qtyAvailable ?? 0} in stock
      </span>
      <div className="flex items-center gap-3">
        <button onClick={() => setEditing(true)} className="text-[12px] text-accent hover:underline">
          Edit
        </button>
        <button onClick={remove} className="text-[12px] text-warn hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}
