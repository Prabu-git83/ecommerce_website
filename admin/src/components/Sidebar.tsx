import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";

const OPERATIONS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
  { to: "/categories", label: "Categories" },
  { to: "/inventory", label: "Inventory" },
];

export default function Sidebar() {
  const admin = useAuthStore((s) => s.admin);
  const clear = useAuthStore((s) => s.clear);

  return (
    <aside className="flex h-screen w-[220px] flex-none flex-col border-r border-border-strong bg-sidebar py-5">
      <div className="px-5 pb-6">
        <span className="font-display text-[17px] font-extrabold tracking-tight text-ink">
          ARCA <span className="font-mono text-[11px] font-normal tracking-wider text-faint">ADMIN</span>
        </span>
      </div>

      <div className="eyebrow px-5 pb-2">Operations</div>
      <nav className="flex flex-col">
        {OPERATIONS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `border-l-2 px-5 py-1.5 font-body text-[13px] ${
                isActive ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="eyebrow px-5 pb-2 pt-5">Customers</div>
      <nav className="flex flex-col">
        <NavLink
          to="/customers"
          className={({ isActive }) =>
            `border-l-2 px-5 py-1.5 font-body text-[13px] ${
              isActive ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
            }`
          }
        >
          Customers
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-border-strong px-5 pt-3.5">
        <div className="font-body text-[12.5px] font-semibold text-ink">{admin?.name}</div>
        <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wider text-faint">{admin?.role}</div>
        <button onClick={clear} className="mt-2.5 text-[11.5px] text-muted hover:text-ink">
          Sign out
        </button>
      </div>
    </aside>
  );
}
