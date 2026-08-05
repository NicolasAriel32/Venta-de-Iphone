"use client";

import Link from "next/link";
import ProductImage from "./ProductImage";
import { CloseIcon } from "@/components/ui/icons";
import { formatArs, formatCapacity, lineTotals } from "@/lib/pricing";
import { MAX_QTY_PER_LINE, useCart, type CartItem } from "@/store/cart";

/**
 * Una línea del carrito. La usan el drawer y la página `/carrito`.
 *
 * El color y la capacidad van SIEMPRE visibles (SPEC.md §5): dos líneas del
 * mismo modelo solo se distinguen por eso, y sin el dato el cliente no sabe
 * qué está por comprar.
 *
 * Los pesos se calculan acá con la cotización vigente, no salen de
 * localStorage: el carrito guarda USD (ver `store/cart.ts`).
 */
export default function CartLineRow({
  item,
  usdRate,
  highlight = false,
}: {
  item: CartItem;
  usdRate: number;
  /** Resalta la línea recién agregada en el drawer. */
  highlight?: boolean;
}) {
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);
  const close = useCart((s) => s.close);

  const totals = lineTotals(
    { priceUsd: item.priceUsd, discountPct: item.discountPct, quantity: item.quantity },
    usdRate,
  );

  const variant = [
    item.colorName,
    item.capacityGb ? formatCapacity(item.capacityGb) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const atMin = item.quantity <= 1;
  const atMax = item.quantity >= MAX_QTY_PER_LINE;

  return (
    <li
      className={`flex gap-3 py-3 transition-colors ${
        highlight ? "-mx-2 rounded-xl bg-accent/10 px-2" : ""
      }`}
    >
      <Link
        href={`/productos/${item.slug}`}
        onClick={close}
        aria-label={item.name}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-ink/40"
      >
        <ProductImage
          path={item.coverPath}
          alt={item.name}
          brand={item.brand}
          sizes="64px"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/productos/${item.slug}`}
              onClick={close}
              className="line-clamp-2 text-sm leading-tight font-medium text-paper"
            >
              {item.name}
            </Link>
            {variant && <p className="mt-0.5 text-xs text-muted">{variant}</p>}
          </div>

          <button
            type="button"
            onClick={() => remove(item.key)}
            aria-label={`Quitar ${item.name} del carrito`}
            className="tap -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-paper"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          {/* Áreas táctiles de 44 px: son los controles que más se tocan
              con una mano y en movimiento (CLAUDE.md §1). */}
          <div className="flex items-center rounded-lg border border-line">
            <button
              type="button"
              onClick={() => decrement(item.key)}
              disabled={atMin}
              aria-label={`Quitar una unidad de ${item.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-l-lg text-lg text-paper disabled:text-muted/40"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="qty-control w-8 text-center text-sm text-paper"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => increment(item.key)}
              disabled={atMax}
              aria-label={`Agregar una unidad de ${item.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-r-lg text-lg text-paper disabled:text-muted/40"
            >
              +
            </button>
          </div>

          <div className="text-right">
            {usdRate > 0 ? (
              <>
                <p className="price-figure font-display leading-none font-bold text-paper">
                  {formatArs(totals.subtotalArs)}
                </p>
                {item.quantity > 1 && (
                  <p className="mt-1 text-[11px] text-muted">
                    {formatArs(totals.unitArs)} c/u
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted">Consultar precio</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
