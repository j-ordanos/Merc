'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartItem } from '@/lib/types';
export function sanitizeItems(items: CartItem[]): CartItem[] {
  const result = new Map<string, number>();
  for (const item of items)
    if (
      item &&
      typeof item.productId === 'string' &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    )
      result.set(item.productId, Math.min(10, item.quantity));
  return [...result].slice(0, 50).map(([productId, quantity]) => ({ productId, quantity }));
}
type CartState = {
  items: CartItem[];
  settledOrders: string[];
  hydrated: boolean;
  add: (id: string, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  settle: (orderId: string, items: CartItem[]) => void;
  hydrate: () => void;
};
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      settledOrders: [],
      hydrated: false,
      add: (productId, quantity = 1) =>
        set((s) => ({
          items: sanitizeItems([
            ...s.items.filter((i) => i.productId !== productId),
            {
              productId,
              quantity: (s.items.find((i) => i.productId === productId)?.quantity ?? 0) + quantity,
            },
          ]),
        })),
      setQuantity: (id, quantity) =>
        set((s) => ({
          items: sanitizeItems(s.items.map((i) => (i.productId === id ? { ...i, quantity } : i))),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      settle: (orderId, purchased) =>
        set((s) =>
          s.settledOrders.includes(orderId)
            ? s
            : {
                items: sanitizeItems(
                  s.items.map((i) => ({
                    ...i,
                    quantity:
                      i.quantity -
                      (purchased.find((p) => p.productId === i.productId)?.quantity ?? 0),
                  })),
                ),
                settledOrders: [...s.settledOrders, orderId],
              },
        ),
      hydrate: () => set((s) => ({ hydrated: true, items: sanitizeItems(s.items) })),
    }),
    {
      name: 'merc-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ items: s.items, settledOrders: s.settledOrders }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<CartState> | undefined;
        return {
          ...current,
          items: sanitizeItems(Array.isArray(saved?.items) ? saved.items : []),
          settledOrders: Array.isArray(saved?.settledOrders)
            ? saved.settledOrders.filter((id) => typeof id === 'string')
            : [],
        };
      },
    },
  ),
);
