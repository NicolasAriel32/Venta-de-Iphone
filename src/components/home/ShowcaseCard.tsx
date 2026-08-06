import ProductCard from "@/components/shop/ProductCard";
import Tilt from "./Tilt";
import type { ProductListItem } from "@/lib/supabase/types";

/**
 * La card del catálogo, con la inclinación 3D de la home encima.
 *
 * Es lo único que separa la vidriera del listado. La card en sí es la misma
 * (`components/shop/ProductCard`): mientras fueron dos componentes distintos,
 * la home y el catálogo se veían como dos sitios.
 *
 * El tilt no se mete dentro de `ProductCard` porque en `/productos` entran 12
 * por pantalla y doce cards inclinándose es ruido, no jerarquía.
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
  return (
    <Tilt>
      <ProductCard
        product={product}
        usdRate={usdRate}
        priority={priority}
        sizes="(max-width: 720px) 45vw, (max-width: 1040px) 45vw, 30vw"
      />
    </Tilt>
  );
}
