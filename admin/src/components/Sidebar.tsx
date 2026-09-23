import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";

const OPERATIONS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
  { to: "/categories", label: "Categories" },
  { to: "/inventory", label: "Inventory" },
];

const SUPPORT = [
  { to: "/tickets", label: "Tickets" },
  { to: "/customers", label: "Customers" },
];

const ADMINISTRATION = [
  { to: "/analytics", label: "Analytics" },
  { to: "/users", label: "Users & roles" },
  { to: "/settings", label: "Configuration" },
];

function initials(name?: string) {
  if (!name) return "AA";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "AA";
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

  return (
    <aside className="flex h-screen w-[220px] flex-none flex-col bg-ink py-4">
      <div className="flex items-center gap-2.5 px-4 pb-5">
        <span className="block h-[22px] w-[22px] rounded-[5px] bg-accent" />
        <span className="font-display text-[14px] font-bold text-white">ARCA Admin</span>
      </div>

      <div className="px-4 pb-2 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sidebar-label">Operations</div>
      <nav className="flex flex-col gap-0.5 px-2">
        {OPERATIONS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="px-4 pb-2 pt-4 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sidebar-label">Support</div>
      <nav className="flex flex-col gap-0.5 px-2">
        {SUPPORT.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="px-4 pb-2 pt-4 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sidebar-label">Administration</div>
      <nav className="flex flex-col gap-0.5 px-2">
        {ADMINISTRATION.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 overflow-hidden border-t border-slate px-4 pt-3.5">
        <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md bg-slate font-body text-[11px] font-semibold text-faint">
          {initials(admin?.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-[11.5px] font-medium text-white">{admin?.name}</span>
          <span className="block font-mono text-[9.5px] uppercase tracking-wider text-sidebar-label">{admin?.role}</span>
        </span>
        <button onClick={clear} className="flex-none text-[11px] text-faint hover:text-white">
          Sign out
        </button>
      </div>
    </aside>
  );
}
