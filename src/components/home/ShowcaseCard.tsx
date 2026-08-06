import Link from "next/link";
import ProductImage from "@/components/shop/ProductImage";
import ColorDots from "@/components/shop/ColorDots";
import Tilt from "./Tilt";
import { listPrice, transferPrice, formatArs } from "@/lib/pricing";
import type { ProductListItem } from "@/lib/supabase/types";

/**
 * Card de destacado, solo para la home.
 *
 * Es una card aparte y no un modo de `ProductCard` a propósito: `ProductCard`
 * también arma el listado de `/productos`, donde entran 12 por pantalla y una
 * inclinación 3D por card sería ruido. Separarlas deja tocar la vidriera sin
 * arriesgar el catálogo.
 *
 * Server Component: los precios se calculan acá, con `pricing.ts`, igual que
 * en el resto de la tienda. Lo único que baja al navegador es `Tilt`.
 */
export default function ShowcaseCard({
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
  const hasRate = usdRate > 0;

  return (
    <Tilt>
      <Link href={`/productos/${product.slug}`} className="showcase">
        <div className="showcase-art">
          <ProductImage
            path={product.cover_path}
            alt={product.name}
            brand={product.brand}
            name={product.name}
            priority={priority}
            sizes="(max-width: 720px) 90vw, (max-width: 1040px) 45vw, 30vw"
          />
        </div>

        <p className="showcase-mk mono">{product.brand}</p>
        <h3 className="showcase-nm">{product.name}</h3>

        {hasRate ? (
          <>
            <p className="showcase-price mono">{price.label}</p>
            {/* Sin ahorro real el bloque no se muestra: en los accesorios el
                redondeo se come el descuento y "ahorrás $ 0" se lee como un
                bug, no como una oferta (decisión 30). */}
            {transferArs < price.ars && (
              <p className="showcase-transf mono">
                {formatArs(transferArs)} por transferencia
              </p>
            )}
          </>
        ) : (
          <p className="showcase-price mono">Consultar precio</p>
        )}

        <div className="showcase-foot">
          <span
            className={`showcase-stock ${
              product.stock_status === "in_stock" ? "is-ok" : "is-dim"
            }`}
          >
            <span aria-hidden className="showcase-dot" />
            {product.stock_status === "in_stock"
              ? "Disponible"
              : product.stock_status === "on_demand"
                ? "A pedido"
                : "Sin stock"}
          </span>
          <span className="mono showcase-usd">{price.usdLabel}</span>
        </div>

        <div className="showcase-colors">
          <ColorDots colors={product.colors} />
        </div>
      </Link>
    </Tilt>
  );
}
