"use client";

import { create } from "zustand";
import { apiGetJson, apiPost, apiPut, apiDelete } from "../client-api";
import type { CartDetail } from "../types";

type CartState = {
  cart: CartDetail | null;
  loading: boolean;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
};

function countItems(cart: CartDetail | null) {
  return cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  itemCount: 0,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const cart = await apiGetJson<CartDetail>("/cart");
      set({ cart, itemCount: countItems(cart), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addItem: async (variantId, quantity = 1) => {
    const cart = await apiPost<CartDetail>("/cart/items", { variantId, quantity });
    set({ cart, itemCount: countItems(cart) });
  },

  updateItem: async (itemId, quantity) => {
    const cart = await apiPut<CartDetail>(`/cart/items/${itemId}`, { quantity });
    set({ cart, itemCount: countItems(cart) });
  },

  removeItem: async (itemId) => {
    const cart = await apiDelete<CartDetail>(`/cart/items/${itemId}`);
    set({ cart, itemCount: countItems(cart) });
  },

  applyCoupon: async (code) => {
    const cart = await apiPost<CartDetail>("/cart/coupon", { code });
    set({ cart, itemCount: countItems(cart) });
  },

  removeCoupon: async () => {
    const cart = await apiDelete<CartDetail>("/cart/coupon");
    set({ cart, itemCount: countItems(cart) });
  },
}));
