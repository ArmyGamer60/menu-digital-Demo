"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine } from "@/types";

export interface CartState {
  lines: CartLine[];
  /** Agrega o suma cantidad si ya existe mismo producto + selección + nota. */
  add: (line: CartLine) => void;
  /** Reemplaza la línea editada desde el ProductSheet. */
  update: (id: string, line: CartLine) => void;
  remove: (id: string) => void;
  inc: (id: string) => void;
  /** Bajar a 0 elimina la línea. */
  dec: (id: string) => void;
  clear: () => void;
}

const sameSelection = (a: CartLine, b: CartLine) =>
  a.productId === b.productId && JSON.stringify(a.sel) === JSON.stringify(b.sel) && a.notes === b.notes;

type CartStore = UseBoundStore<StoreApi<CartState>> & { persist: { rehydrate: () => Promise<void> | void } };

const stores = new Map<string, CartStore>();

/** Un store persistente por negocio (key `menu-digital.cart.{slug}`). */
export function getCartStore(slug: string): CartStore {
  let store = stores.get(slug);
  if (!store) {
    store = create<CartState>()(
      persist(
        (set) => ({
          lines: [],
          add: (line) =>
            set((s) => {
              const same = s.lines.find((l) => sameSelection(l, line));
              return same
                ? { lines: s.lines.map((l) => (l === same ? { ...l, qty: l.qty + line.qty } : l)) }
                : { lines: [...s.lines, line] };
            }),
          update: (id, line) => set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...line, id } : l)) })),
          remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
          inc: (id) => set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) })),
          dec: (id) =>
            set((s) => ({
              lines: s.lines.flatMap((l) => (l.id !== id ? [l] : l.qty <= 1 ? [] : [{ ...l, qty: l.qty - 1 }])),
            })),
          clear: () => set({ lines: [] }),
        }),
        {
          name: `menu-digital.cart.${slug}`,
          version: 1,
          storage: createJSONStorage(() => localStorage),
          skipHydration: true,
          partialize: (s) => ({ lines: s.lines }),
        },
      ),
    ) as CartStore;
    stores.set(slug, store);
  }
  return store;
}
