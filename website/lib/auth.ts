"use client";

import { useAuthStore } from "./stores/auth-store";
import { useCartStore } from "./stores/cart-store";
import { apiPost, apiGetJson } from "./client-api";
import type { User } from "./types";

type AuthResponse = { user: User; accessToken: string; refreshToken: string };

export async function login(email: string, password: string) {
  const res = await apiPost<AuthResponse>("/auth/login", { email, password });
  useAuthStore.getState().setSession(res);
  await useCartStore.getState().fetchCart();
  return res.user;
}

export async function register(input: { email: string; password: string; firstName: string; lastName?: string }) {
  const res = await apiPost<AuthResponse>("/auth/register", input);
  useAuthStore.getState().setSession(res);
  await useCartStore.getState().fetchCart();
  return res.user;
}

export async function logout() {
  const { refreshToken, clear } = useAuthStore.getState();
  if (refreshToken) {
    await apiPost("/auth/logout", { refreshToken }).catch(() => {});
  }
  clear();
}

export async function fetchCurrentUser() {
  const user = await apiGetJson<User>("/customers/me");
  useAuthStore.getState().setUser(user);
  return user;
}
