"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import CartLineRow from "./CartLineRow";
import { CloseIcon } from "@/components/ui/icons";
import { cartTotals, formatArs } from "@/lib/pricing";
import { useCart } from "@/store/cart";

/**
 * Drawer del carrito — FC-3 de SPEC.md.
 *
 * Se abre desde abajo apenas se agrega un producto, mostrando la línea recién
 * agregada. Desde ahí el comprador sigue comprando (cierra) o va a `/carrito`.
 *
 * ⚠️ z-index: el widget de Retell se ancla al borde inferior con 999999 y el
 * botón flotante de WhatsApp quedó en 1000000 (CLAUDE.md §9, decisión 38).
 * El drawer tiene que tapar a los dos o sus botones quedan flotando encima
 * del carrito.
 */
export default function CartDrawer({
  usdRate,
  paymentNote,
}: {
  usdRate: number;
  paymentNote: string;
}) {
  const isOpen = useCart((s) => s.isOpen);
  const items = useCart((s) => s.items);
  const lastAddedKey = useCart((s) => s.lastAddedKey);
  const close = useCart((s) => s.close);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  // Escape cierra; el fondo no scrollea mientras el drawer está arriba.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      restoreFocusTo.current?.focus?.();
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const totals = cartTotals(
    items.map((i) => ({
      priceUsd: i.priceUsd,
      discountPct: i.discountPct,
      quantity: i.quantity,
    })),
    usdRate,
  );

  return (
    <div className="fixed inset-0 z-[1000001]">
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar el carrito"
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
        className="cart-sheet absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-line bg-ink"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative flex items-center gap-2 border-b border-line px-4 pt-4 pb-3">
          {/* Agarradera: la pista visual de que esto se cierra tirando hacia abajo. */}
          <span
            aria-hidden
            className="absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-line"
          />
          <h2 className="sheet-title">
            Tu pedido
          </h2>
          <span className="text-sm text-muted">
            {totals.itemCount} {totals.itemCount === 1 ? "unidad" : "unidades"}
          </span>
          <div className="flex-1" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Cerrar el carrito"
            className="tap flex h-11 w-11 items-center justify-center rounded-lg text-muted"
          >
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-paper">Tu pedido está vacío.</p>
            <Link
              href="/productos"
              onClick={close}
              className="btn-ghost tap mt-4"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-4">
              {items.map((item) => (
                <CartLineRow
                  key={item.key}
                  item={item}
                  usdRate={usdRate}
                  highlight={item.key === lastAddedKey}
                />
              ))}
            </ul>

            <div className="border-t border-line px-4 pt-3 pb-4">
              {usdRate > 0 && (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Total</span>
                    <span className="cart-total mono">
                      {formatArs(totals.totalArs)}
                    </span>
                  </div>
                  {/* Sin ahorro real el renglón no va: ver SPEC.md §6. */}
                  {totals.hasDiscount && (
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs text-muted">Con transferencia</span>
                      <span className="cart-total-transf mono text-sm">
                        {formatArs(totals.transferArs)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {paymentNote && (
                <p className="mt-2 text-xs text-muted">💳 {paymentNote}</p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="btn-ghost flex-1"
                >
                  Seguir comprando
                </button>
                <Link
                  href="/carrito"
                  onClick={close}
                  className="btn-amber flex-1"
                >
                  Ir al carrito
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
