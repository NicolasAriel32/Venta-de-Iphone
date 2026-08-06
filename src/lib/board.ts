/**
 * board.ts — la forma de una fila de la pizarra.
 *
 * Vive separado de `catalog.ts` por la misma razón que `images.ts`
 * (decisión 27): la pizarra es un componente cliente y necesita estos
 * tipos, pero `catalog.ts` arrastra `next/headers`. Este módulo solo
 * importa `pricing.ts` y tipos, así que se puede usar de los dos lados.
 *
 * REGLA: el ARS se calcula **una sola vez, en el servidor**, y viaja ya
 * formateado. El navegador pinta lo que recibe; no vuelve a multiplicar
 * nada. Es la misma regla del catálogo llevada al polling.
 */

import { formatArs, usdToArs } from "./pricing";
import {
  STOCK_LABEL,
  type ProductListItem,
  type StockStatus,
} from "./supabase/types";

/**
 * De dónde salió la cotización. Es la misma unión que `ExchangeRate`, escrita
 * de nuevo a mano y no importada: `exchange.ts` abre con `import "server-only"`
 * y no vale la pena que un `import type` mal borrado por un bundler tire abajo
 * el build del cliente.
 */
export type RateOrigin = "api" | "cache" | "manual" | "none";

export type BoardRow = {
  slug: string;
  name: string;
  brand: string;
  /** Referencia de carga. `null` si no hay cotización con la cual comparar. */
  usd: number;
  /** Contado en pesos, ya redondeado por `pricing.ts`. 0 = sin cotización. */
  ars: number;
  /**
   * `$ 1.842.000`, con un `+` al final si el producto tiene capacidades.
   *
   * En el listado el prefijo es "Desde $ …", pero en la pizarra no entra: son
   * 17 caracteres en una columna de 118 px y el número queda cortado al
   * medio. El `+` dice lo mismo en dos caracteres y el pie de la pizarra lo
   * explica.
   */
  arsLabel: string;
  /** Si el precio es el mínimo de varias capacidades. Alimenta la leyenda. */
  fromPrice: boolean;
  stock: StockStatus;
  stockLabel: string;
};

export type BoardSnapshot = {
  rate: {
    value: number;
    origin: RateOrigin;
    updatedAt: string | null;
    /** Texto humano del origen, para el pie de la pizarra. */
    label: string;
  };
  rows: BoardRow[];
};

/** Cuántas filas entran en la pizarra sin que haya que scrollear. */
export const BOARD_SIZE = 6;

/**
 * Etiqueta corta para la columna de estado.
 *
 * `STOCK_LABEL` sirve para una ficha, no para una pizarra: "A pedido · 7 a 10
 * días" no entra en una columna de 10 caracteres a 390 px. Acá se recorta,
 * sin inventar estados que el modelo no tiene (el demo traía un "ÚLTIMAS 3"
 * que no existe en la base).
 */
const BOARD_STOCK: Record<StockStatus, string> = {
  in_stock: "DISPONIBLE",
  on_demand: "A PEDIDO",
  out_of_stock: "SIN STOCK",
};

/**
 * Convierte productos del catálogo en filas de pizarra.
 *
 * Con `usdRate = 0` no se inventa un número: la fila viaja con `ars: 0` y la
 * etiqueta "CONSULTAR", que es lo que ya hace el resto de la tienda cuando la
 * cadena de fallback de `exchange.ts` se queda sin opciones (decisión 34).
 */
export function buildBoardRows(
  products: ProductListItem[],
  usdRate: number,
): BoardRow[] {
  return products.slice(0, BOARD_SIZE).map((p) => {
    const ars = usdToArs(p.min_price_usd, usdRate);
    const hasRate = usdRate > 0;

    return {
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      usd: p.min_price_usd,
      ars: hasRate ? ars : 0,
      arsLabel: hasRate
        ? `${formatArs(ars)}${p.has_capacities ? " +" : ""}`
        : "CONSULTAR",
      fromPrice: p.has_capacities,
      stock: p.stock_status,
      stockLabel: BOARD_STOCK[p.stock_status],
    };
  });
}

export { STOCK_LABEL };
