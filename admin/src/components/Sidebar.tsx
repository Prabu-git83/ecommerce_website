import { NavLink } from "react-router-dom";
import { useAuthStore, type AdminUser } from "@/lib/auth-store";
import { hasPermission } from "@/lib/permissions";

type NavEntry = { to: string; label: string; end?: boolean; show: (admin: AdminUser | null) => boolean };

const OPERATIONS: NavEntry[] = [
  { to: "/", label: "Dashboard", end: true, show: () => true },
  { to: "/orders", label: "Orders", show: (a) => hasPermission(a, "orders") },
  { to: "/products", label: "Products", show: (a) => hasPermission(a, "products") },
  { to: "/categories", label: "Categories", show: (a) => hasPermission(a, "categories") },
  { to: "/inventory", label: "Inventory", show: (a) => hasPermission(a, "inventory") },
  { to: "/delivery-payments", label: "Delivery & Payments", show: (a) => hasPermission(a, ["delivery", "payments"]) },
];

const SUPPORT: NavEntry[] = [
  { to: "/tickets", label: "Tickets", show: (a) => hasPermission(a, "tickets") },
  { to: "/customers", label: "Customers", show: (a) => a?.role === "super_admin" },
];

const ADMINISTRATION: NavEntry[] = [
  { to: "/analytics", label: "Analytics", show: (a) => a?.role === "super_admin" },
  { to: "/users", label: "Users & roles", show: (a) => a?.role === "super_admin" },
  { to: "/settings", label: "Configuration", show: (a) => a?.role === "super_admin" },
  { to: "/themes", label: "Themes", show: (a) => a?.role === "super_admin" },
  { to: "/banner", label: "Homepage Banner", show: (a) => a?.role === "super_admin" },
];

function initials(name?: string) {
  if (!name) return "AA";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "AA";
}

function roleLabel(role?: string) {
  if (role === "super_admin") return "Super Admin";
  return role ?? "";
}

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-md px-4 py-2 font-body text-[12.5px] transition-colors ${
          isActive ? "bg-accent font-medium text-white" : "text-faint hover:text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const admin = useAuthStore((s) => s.admin);
  const clear = useAuthStore((s) => s.clear);

  const operations = OPERATIONS.filter((item) => item.show(admin));
  const support = SUPPORT.filter((item) => item.show(admin));
  const administration = ADMINISTRATION.filter((item) => item.show(admin));

  return (
    <aside className="flex h-screen w-[220px] flex-none flex-col bg-ink py-4">
      <div className="flex flex-none items-center gap-2.5 px-4 pb-5">
        <span className="block h-[22px] w-[22px] rounded-[5px] bg-accent" />
        <span className="font-display text-[14px] font-bold text-white">ARCA Admin</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-3">
        {operations.length > 0 ? (
          <>
            <div className="px-4 pb-2 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sidebar-label">Operations</div>
            <nav className="flex flex-col gap-0.5 px-2">
              {operations.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} end={item.end} />
              ))}
            </nav>
          </>
        ) : null}

        {support.length > 0 ? (
          <>
            <div className="px-4 pb-2 pt-4 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sidebar-label">Support</div>
            <nav className="flex flex-col gap-0.5 px-2">
              {support.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} />
              ))}
            </nav>
          </>
        ) : null}

        {administration.length > 0 ? (
          <>
            <div className="px-4 pb-2 pt-4 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sidebar-label">Administration</div>
            <nav className="flex flex-col gap-0.5 px-2">
              {administration.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} />
              ))}
            </nav>
          </>
        ) : null}
      </div>

      <div className="flex flex-none items-center gap-2.5 overflow-hidden border-t border-slate px-4 pt-3.5">
        <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md bg-slate font-body text-[11px] font-semibold text-faint">
          {initials(admin?.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-[11.5px] font-medium text-white">{admin?.name}</span>
          <span className="block font-mono text-[9.5px] uppercase tracking-wider text-sidebar-label">{roleLabel(admin?.role)}</span>
        </span>
        <button onClick={clear} className="flex-none text-[11px] text-faint hover:text-white">
          Sign out
        </button>
      </div>
    </aside>
  );
}
