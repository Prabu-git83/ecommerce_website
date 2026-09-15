"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchCurrentUser } from "@/lib/auth";

export default function AuthHydrator() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!accessToken) return;
    fetchCurrentUser().catch(() => clear());
    // Only re-verify when the token itself changes (login/refresh), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return null;
}
