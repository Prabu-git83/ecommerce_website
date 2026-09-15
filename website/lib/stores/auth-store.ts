"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  hasHydrated: boolean;
  setSession: (session: { accessToken: string; refreshToken: string; user: User }) => void;
  setUser: (user: User | null) => void;
  setHasHydrated: (v: boolean) => void;
  clear: () => void;
};

// `hasHydrated` tracks whether the persisted (localStorage) state has been
// read back into the store yet. On the very first render after a hard page
// load it hasn't — accessToken is momentarily null even for a signed-in
// user — so anything gating on auth (RequireAuth) must wait for this flag
// before deciding to redirect, or it will bounce logged-in users to /login.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      setUser: (user) => set({ user }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "arca-auth",
      partialize: (state) => ({ accessToken: state.accessToken, refreshToken: state.refreshToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
