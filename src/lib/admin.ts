/**
 * admin.ts — lecturas del panel.
 *
 * Separado de `catalog.ts` por una razón de permisos, no de orden: el
 * catálogo lee como anónimo y solo ve las filas activas, mientras que el
 * panel lee con la sesión del dueño y tiene que ver **todo**, incluidos los
 * productos desactivados. Si no, un producto pausado desaparecería del panel
 * y no habría forma de volver a activarlo.
 *
 * `server-only` para que un import distraído desde un componente cliente
 * rompa el build en vez de mandarle la sesión al navegador.
 */

import "server-only";
import { createClient } from "./supabase/server";
import type { DashboardMetrics, StockStatus } from "./supabase/types";

/** Rangos que ofrece el panel. Se validan contra esto, no contra el input. */
export const METRIC_RANGES = [1, 7, 30] as const;
export type MetricRange = (typeof METRIC_RANGES)[number];

export function parseRange(value: string | undefined): MetricRange {
  const n = Number(value);
  return (METRIC_RANGES as readonly number[]).includes(n)
    ? (n as MetricRange)
    : 1;
}

/**
 * Capacidad de un producto tal como la edita el panel.
 * Ojo: `price_usd` llega como `number` desde PostgREST aunque en la base sea
 * `numeric`. Se lo normaliza igual para no depender de eso.
 */
export type AdminCapacity = {
  id: string;
  capacity_gb: number;
  price_usd: number;
  stock_status: StockStatus;
  is_active: boolean;
};

export type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  brand: string;
  category_name: string;
  is_active: boolean;
  stock_status: StockStatus;
  discount_transfer_pct: number;
  /** Solo se usa cuando el producto NO tiene capacidades (CLAUDE.md §4). */
  price_usd: number;
  capacities: AdminCapacity[];
};

/** Forma cruda del join, antes de normalizar. */
type ProductRow = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  brand: string;
  is_active: boolean;
  stock_status: StockStatus;
  price_usd: number | string;
  discount_transfer_pct: number | string;
  categories: { name: string } | null;
  product_capacities: {
    id: string;
    capacity_gb: number;
    price_usd: number | string;
    stock_status: StockStatus;
    is_active: boolean;
    sort_order: number;
  }[];
};

/**
 * Todas las métricas en una sola llamada al RPC.
 *
 * Devuelve `null` si la base no contestó. La pantalla muestra el estado de
 * error correspondiente en vez de ceros: "0 visitas" y "no pudimos leer las
 * visitas" son cosas muy distintas para el que mira el panel.
 */
export async function getMetrics(
  days: MetricRange,
): Promise<DashboardMetrics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_metrics", {
    p_days: days,
  });

  if (error || !data) {
    console.error("[admin] dashboard_metrics", error?.message);
    return null;
  }

  return data as unknown as DashboardMetrics;
}

/** El catálogo entero, ordenado como se edita: por categoría y después por nombre. */
export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, sku, slug, brand, is_active, stock_status, price_usd,
       discount_transfer_pct,
       categories ( name ),
       product_capacities ( id, capacity_gb, price_usd, stock_status, is_active, sort_order )`,
    )
    .order("name");

  if (error || !data) {
    console.error("[admin] getAdminProducts", error?.message);
    return [];
  }

  return (data as unknown as ProductRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    slug: row.slug,
    brand: row.brand,
    category_name: row.categories?.name ?? "Sin categoría",
    is_active: row.is_active,
    stock_status: row.stock_status,
    discount_transfer_pct: Number(row.discount_transfer_pct),
    price_usd: Number(row.price_usd),
    capacities: [...(row.product_capacities ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order || a.capacity_gb - b.capacity_gb)
      .map((c) => ({
        id: c.id,
        capacity_gb: c.capacity_gb,
        price_usd: Number(c.price_usd),
        stock_status: c.stock_status,
        is_active: c.is_active,
      })),
  }));
}

// La config de la tienda NO se lee desde acá: el panel usa `getStoreContext()`
// de `catalog.ts`, el mismo que usa la tienda. Es deliberado — el panel tiene
// que mostrar exactamente la cotización que están viendo los compradores, y
// una segunda función de lectura es una segunda forma de que se separen.
