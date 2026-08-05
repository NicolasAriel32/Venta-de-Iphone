"use client";

import Link from "next/link";
import { CartIcon } from "@/components/ui/icons";
import { useCartCount, useCartReady } from "@/store/cart";

/**
 * Ícono de carrito del header, con el globito de unidades.
 *
 * Va aparte de `Header` para que escribir en el buscador no re-renderice el
 * contador y viceversa.
 *
 * El globito solo se dibuja después de montar: el HTML lo genera el servidor,
 * donde no existe localStorage, así que el carrito siempre sale vacío de
 * allá. Pintarlo en el primer render del cliente sería un error de
 * hidratación (ver `useCartReady`).
 */
export default function CartButton() {
  const ready = useCartReady();
  const count = useCartCount();
  const showBadge = ready && count > 0;

  return (
    <Link
      href="/carrito"
      aria-label={
        showBadge
          ? `Ver el carrito, ${count} ${count === 1 ? "unidad" : "unidades"}`
          : "Ver el carrito"
      }
      className="tap relative flex h-11 w-11 items-center justify-center rounded-lg text-paper"
    >
      <CartIcon />
      {showBadge && (
        <span className="price-figure absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
