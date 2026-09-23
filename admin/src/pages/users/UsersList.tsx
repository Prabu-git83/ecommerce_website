import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import Field from "@/components/Field";
import { apiGet, apiPost, apiPut, ApiClientError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from "@/lib/permissions";
import type { AdminUser } from "@/lib/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "AA";
}

function PermissionCheckboxes({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  function toggle(key: PermissionKey) {
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  }
  return (
    <div className="col-span-2 grid grid-cols-3 gap-2.5 rounded-md border border-border bg-paper p-3">
      {PERMISSION_KEYS.map((key) => (
        <label key={key} className="flex items-center gap-2 text-[12.5px] text-ink">
          <input type="checkbox" className="!w-auto" checked={value.includes(key)} onChange={() => toggle(key)} />
          {PERMISSION_LABELS[key]}
        </label>
      ))}
    </div>
  );
}

export default function UsersList() {
  const currentAdminId = useAuthStore((s) => s.admin?.id);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const items = await apiGet<AdminUser[]>("/admin/users");
    setUsers(items);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(u: AdminUser) {
    const next = u.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !confirm(`Suspend ${u.name}'s access?`)) return;
    try {
      await apiPut(`/admin/users/${u.id}/status`, { status: next });
      load();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Could not update status");
    }
  }

  return (
    <div>
      <PageHeader
        title="Users & roles"
        sub={users ? `${users.length} admins` : undefined}
        actions={
          <button onClick={() => setShowForm((v) => !v)} className="btn-pill btn-primary px-5 py-2 font-medium">
            {showForm ? "Cancel" : "New user"}
          </button>
        }
      />

      <div className="max-w-[880px] px-8 py-6">
        {showForm ? (
          <NewUserForm
            onDone={() => {
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : null}

        <div className="table-card">
          <div className="table-head grid grid-cols-[minmax(0,1fr)_130px_90px_110px_120px] gap-3 px-4 py-2.5">
            <span>Admin</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span></span>
          </div>
          {users === null ? (
            <p className="px-4 py-4 text-[13px] text-muted">Loading…</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="border-b border-chrome last:border-b-0">
                <div className="grid grid-cols-[minmax(0,1fr)_130px_90px_110px_120px] items-center gap-3 px-4 py-2.5 text-[13px] text-ink">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-chrome font-body text-[11px] font-semibold text-muted">
                      {initials(u.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{u.name}</span>
                      <span className="block truncate font-mono text-[11px] text-muted">{u.email}</span>
                    </span>
                  </span>
                  <span className="truncate text-[12px] text-muted">{u.role === "super_admin" ? "Super Admin" : "Admin"}</span>
                  <StatusText status={u.status} />
                  <span className="font-mono text-[11.5px] text-faint">{formatDate(u.createdAt)}</span>
                  {u.role === "super_admin" ? (
                    <span className="text-[12px] text-faint">Full access</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                        className="text-[12px] font-medium text-accent hover:underline"
                      >
                        {editingId === u.id ? "Close" : "Edit access"}
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={u.id === currentAdminId}
                        className={`text-[12px] font-medium hover:underline disabled:opacity-30 ${
                          u.status === "active" ? "text-warn" : "text-accent"
                        }`}
                      >
                        {u.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                    </div>
                  )}
                </div>
                {editingId === u.id ? (
                  <div className="px-4 pb-4">
                    <EditPermissionsForm
                      user={u}
                      onDone={() => {
                        setEditingId(null);
                        load();
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EditPermissionsForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [permissions, setPermissions] = useState<string[]>(user.permissions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiPut(`/admin/users/${user.id}`, { permissions });
      onDone();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save access");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card grid grid-cols-2 gap-3 p-4">
      <div className="col-span-2 font-display text-[13px] font-semibold text-ink">Access for {user.name}</div>
      <PermissionCheckboxes value={permissions} onChange={setPermissions} />
      <div className="col-span-2 flex items-center gap-3">
        {error ? <p className="text-[12px] text-warn">{error}</p> : null}
        <button
          onClick={save}
          disabled={saving}
          className="btn-pill flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save access"}
        </button>
      </div>
    </div>
  );
}

function NewUserForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost("/admin/users", { ...form, permissions });
      onDone();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create admin user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 grid grid-cols-2 gap-3 card p-4">
      <div className="col-span-2 font-display text-[15px] font-semibold text-ink">New admin user</div>
      <Field label="Name">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Email">
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <div className="col-span-2">
        <Field label="Password" hint="minimum 8 characters">
          <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
      </div>
      <div className="col-span-2 eyebrow">Access</div>
      <PermissionCheckboxes value={permissions} onChange={setPermissions} />
      <div className="col-span-2 flex items-center gap-3">
        {error ? <p className="text-[12px] text-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-pill flex h-9 items-center justify-center btn-primary px-5 text-[12.5px] font-medium disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create user"}
        </button>
        <button type="button" onClick={onCancel} className="text-[12.5px] text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
