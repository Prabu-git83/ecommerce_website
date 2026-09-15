"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, accessToken, router, pathname]);

  // Wait for the persisted store to rehydrate before rendering anything —
  // otherwise a signed-in user flashes a redirect to /login on every hard reload.
  if (!hasHydrated || !accessToken) return null;
  return <>{children}</>;
}
