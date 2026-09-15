"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart-store";

export default function CartHydrator() {
  const fetchCart = useCartStore((s) => s.fetchCart);
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);
  return null;
}
