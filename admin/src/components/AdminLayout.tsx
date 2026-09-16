import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const location = useLocation();

  if (!hasHydrated) return null;
  if (!accessToken) return <Navigate to="/login" state={{ next: location.pathname }} replace />;

  return (
    <div className="flex bg-paper">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
