import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminUser = { id: string; email: string; name: string; role: string; permissions: string[] };

type AuthState = {
  accessToken: string | null;
  admin: AdminUser | null;
  hasHydrated: boolean;
  setSession: (session: { accessToken: string; admin: AdminUser }) => void;
  setHasHydrated: (v: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      admin: null,
      hasHydrated: false,
      setSession: ({ accessToken, admin }) => set({ accessToken, admin }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      clear: () => set({ accessToken: null, admin: null }),
    }),
    {
      name: "arca-admin-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
