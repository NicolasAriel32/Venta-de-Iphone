import Link from "next/link";
import ProductImage from "./ProductImage";
import ColorDots from "./ColorDots";
import { listPrice, transferPrice, formatArs } from "@/lib/pricing";
import type { ProductListItem, StockStatus } from "@/lib/supabase/types";

/**
 * Card de producto — la ÚNICA del proyecto.
 *
 * La usan el listado de `/productos` y los destacados de la home. En la home
 * va envuelta en `<Tilt>` (ver `components/home/ShowcaseCard`), que es lo
 * único que cambia entre las dos: la inclinación 3D y el brillo especular.
 *
 * Antes eran dos componentes distintos y por eso el catálogo y la home no se
 * parecían. Una sola card no puede desincronizarse.
 *
 * Lo que NO va acá (CLAUDE.md §9, decisión 15): selectores de color y
 * capacidad. Son 6 controles de 44 px en una card de 180 px — no entran, y
 * multiplicarían el peso de la home. Acá va `Desde $X` y los puntitos de
 * color a modo informativo.
 */

const STOCK_SHORT: Record<StockStatus, string> = {
  in_stock: "Disponible",
  on_demand: "A pedido",
  out_of_stock: "Sin stock",
};

export default function ProductCard({
  product,
  usdRate,
  priority = false,
  sizes = "(max-width: 720px) 45vw, (max-width: 1040px) 30vw, 300px",
}: {
  product: ProductListItem;
  usdRate: number;
  priority?: boolean;
  sizes?: string;
}) {
  const price = listPrice(product.min_price_usd, usdRate, product.has_capacities);
  const transferArs = transferPrice(price.ars, product.discount_transfer_pct);
  const hasRate = usdRate > 0;

  return (
    <Link href={`/productos/${product.slug}`} className="showcase">
      <div className="showcase-art">
        <ProductImage
          path={product.cover_path}
          alt={product.name}
          brand={product.brand}
          name={product.name}
          priority={priority}
          sizes={sizes}
        />
      </div>

      <p className="showcase-mk mono">{product.brand}</p>
      <h3 className="showcase-nm">{product.name}</h3>

      {/* El peso manda; el dólar es la referencia de carga. Todo en mono con
          tabular-nums: al cambiar la cotización el precio no corre el layout. */}
      {hasRate ? (
        <>
          <p className="showcase-price mono">{price.label}</p>
          {/* Sin ahorro real no se muestra: en los accesorios el redondeo se
              come el descuento y "ahorrás $ 0" se lee como un bug, no como
              una oferta (decisión 30). */}
          {transferArs < price.ars && (
            <p className="showcase-transf mono">{formatArs(transferArs)} transf.</p>
          )}
        </>
      ) : (
        <p className="showcase-price mono">Consultar</p>
      )}

      <div className="showcase-foot">
        <span
          className={`showcase-stock ${
            product.stock_status === "in_stock" ? "is-ok" : "is-dim"
          }`}
        >
          <span aria-hidden className="showcase-dot" />
          {STOCK_SHORT[product.stock_status]}
        </span>
        <span className="mono showcase-usd">{price.usdLabel}</span>
      </div>

      {product.colors.length > 0 && (
        <div className="showcase-colors">
          <ColorDots colors={product.colors} />
        </div>
      )}
    </Link>
  );
}
