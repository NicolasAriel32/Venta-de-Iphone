"use client";

/**
 * cart.ts — el carrito, en Zustand y persistido en localStorage.
 *
 * Decisiones que importan:
 *
 * · **La clave del ítem es `producto + capacidad + color`** (CLAUDE.md §4).
 *   Dos capacidades del mismo modelo son dos líneas distintas, y dos colores
 *   de la misma capacidad también. Sumarlas en una sola línea haría imposible
 *   armar el mensaje de WhatsApp.
 *
 * · **Se guarda el precio en USD, no en pesos.** El peso se calcula al
 *   renderizar, con la cotización vigente, igual que en todo el catálogo
 *   (CLAUDE.md §4). Un carrito abandonado ayer tiene que mostrar el precio de
 *   hoy; el número recién se congela cuando se confirma el pedido
 *   (`orders.usd_rate_snapshot`).
 *
 * · **El servidor no le cree nada de esto al navegador.** Todo lo que hay
 *   acá es para pintar la pantalla. `POST /api/orders` vuelve a leer precios
 *   de la base a partir de los IDs; localStorage lo edita cualquiera.
 *
 * · El estado del drawer vive en el mismo store pero NO se persiste: nadie
 *   quiere volver a la tienda y encontrarse el carrito abierto.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useSyncExternalStore } from "react";

/** Tope por línea. Es una tienda de barrio, no un mayorista. */
export const MAX_QTY_PER_LINE = 20;

export type CartItem = {
  /** `productId|capacityId|colorId`. Ver itemKey(). */
  key: string;
  productId: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  coverPath: string | null;
  colorId: string | null;
  colorName: string | null;
  capacityId: string | null;
  capacityGb: number | null;
  /** Precio de la variante elegida, en USD. Ver el comentario de arriba. */
  priceUsd: number;
  discountPct: number;
  quantity: number;
};

/** Lo que manda la ficha de producto: la clave y la cantidad las pone el store. */
export type CartItemInput = Omit<CartItem, "key" | "quantity">;

export function itemKey(
  productId: string,
  capacityId: string | null,
  colorId: string | null,
): string {
  return `${productId}|${capacityId ?? "-"}|${colorId ?? "-"}`;
}

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.trunc(qty)));
}

type CartState = {
  items: CartItem[];
  /** Drawer abierto. No se persiste. */
  isOpen: boolean;
  /** Última línea agregada, para resaltarla en el drawer. No se persiste. */
  lastAddedKey: string | null;

  add: (input: CartItemInput, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastAddedKey: null,

      add(input, quantity = 1) {
        const key = itemKey(input.productId, input.capacityId, input.colorId);
        const items = get().items;
        const existing = items.find((i) => i.key === key);

        set({
          items: existing
            ? items.map((i) =>
                i.key === key
                  ? {
                      // Los datos del producto se refrescan con los del último
                      // agregado: si cambió el precio en USD, el carrito no
                      // puede seguir mostrando el viejo.
                      ...i,
                      ...input,
                      key,
                      quantity: clampQty(i.quantity + quantity),
                    }
                  : i,
              )
            : [...items, { ...input, key, quantity: clampQty(quantity) }],
          lastAddedKey: key,
          isOpen: true,
        });
      },

      setQuantity(key, quantity) {
        // Bajar de 1 no borra la línea: para eso está la X, y un ítem que
        // desaparece solo al tocar "−" se siente como un bug.
        set({
          items: get().items.map((i) =>
            i.key === key ? { ...i, quantity: clampQty(quantity) } : i,
          ),
        });
      },

      increment(key) {
        const item = get().items.find((i) => i.key === key);
        if (item) get().setQuantity(key, item.quantity + 1);
      },

      decrement(key) {
        const item = get().items.find((i) => i.key === key);
        if (item) get().setQuantity(key, item.quantity - 1);
      },

      remove(key) {
        set({ items: get().items.filter((i) => i.key !== key) });
      },

      clear() {
        set({ items: [], lastAddedKey: null });
      },

      open() {
        set({ isOpen: true });
      },

      close() {
        set({ isOpen: false, lastAddedKey: null });
      },
    }),
    {
      name: "mostrador-cart-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Solo las líneas. El drawer arranca cerrado siempre.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Nunca hay nada a qué suscribirse: esto no cambia después de hidratar. */
const neverChanges = () => () => {};

/**
 * `false` en el HTML del servidor y durante la hidratación; `true` después.
 *
 * El HTML lo genera el servidor, donde no hay localStorage: el carrito
 * siempre sale vacío de allá. Si el primer render del cliente ya mostrara las
 * líneas guardadas, React tiraría un error de hidratación. Con esto el primer
 * render coincide con el del servidor y el contenido real aparece enseguida.
 *
 * Se usa `useSyncExternalStore` y no un `useEffect` con `setState` porque es
 * para lo que existe: distinguir servidor de cliente sin encadenar renders.
 *
 * No hace falta esperar a la rehidratación de Zustand: localStorage es
 * síncrono, así que el store ya está cargado antes del segundo render.
 */
export function useCartReady(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true, // cliente
    () => false, // servidor
  );
}

/** Unidades totales, para el globito del header. */
export function useCartCount(): number {
  return useCart((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
}
