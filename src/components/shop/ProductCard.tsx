import Link from "next/link";
import ProductImage from "./ProductImage";
import ColorDots from "./ColorDots";
import StockBadge from "./StockBadge";
import { listPrice, transferPrice, formatArs } from "@/lib/pricing";
import type { ProductListItem } from "@/lib/supabase/types";

/**
 * Card del listado.
 *
 * Lo que NO va acá (CLAUDE.md §6, segunda trampa de F3): selectores de
 * color y capacidad. Son 6 controles de 44 px en una card de 180 px de
 * ancho — no entran, y multiplicarían el peso de la home. Acá va
 * `Desde $X` y los puntitos de color a modo informativo.
 */
export default function ProductCard({
  product,
  usdRate,
  priority = false,
}: {
  product: ProductListItem;
  usdRate: number;
  priority?: boolean;
}) {
  const price = listPrice(product.min_price_usd, usdRate, product.has_capacities);
  const transferArs = transferPrice(price.ars, product.discount_transfer_pct);

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-accent focus-visible:border-accent"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ink/40">
        <ProductImage
          path={product.cover_path}
          alt={product.name}
          brand={product.brand}
          name={product.name}
          priority={priority}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-[10px] tracking-wider text-muted uppercase">{product.brand}</p>

        <h3 className="line-clamp-2 text-sm leading-tight font-medium text-paper">
          {product.name}
        </h3>

        <div className="flex-1" />

        {/* El peso manda; el dólar es la referencia de carga. */}
        {usdRate > 0 ? (
          <>
            <p className="font-display text-lg leading-none font-bold text-paper">
              {price.label}
            </p>
            {transferArs < price.ars && (
              <p className="text-xs text-ok">{formatArs(transferArs)} transf.</p>
            )}
            <p className="text-[11px] text-muted">{price.usdLabel}</p>
          </>
        ) : (
          <p className="text-xs text-muted">Consultar precio</p>
        )}

        <div className="mt-1 flex items-center justify-between gap-2">
          <ColorDots colors={product.colors} />
          <StockBadge status={product.stock_status} className="text-[11px]" />
        </div>
      </div>
    </Link>
  );
}
