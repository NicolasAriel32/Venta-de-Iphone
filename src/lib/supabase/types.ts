/**
 * Tipos de dominio.
 *
 * Los tipos generados (`database.types.ts`) son fieles al schema pero
 * incómodos de leer. Acá viven los alias que usa el resto de la app, más
 * los tipos que el schema no puede expresar (por ejemplo: la vista devuelve
 * `colors` como `Json`, y en realidad es un array de colores).
 */

import type { Tables, Enums } from "./database.types";

export type StockStatus = Enums<"stock_status">;
export type OrderStatus = Enums<"order_status">;
export type RateMode = Enums<"rate_mode">;

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductColor = Tables<"product_colors">;
export type ProductCapacity = Tables<"product_capacities">;
export type ProductImage = Tables<"product_images">;
export type StoreConfig = Tables<"store_config">;
export type Order = Tables<"orders">;

/** Los puntitos de color del listado. Viene embebido en la vista. */
export type ColorDot = {
  name: string;
  hex: string;
  slug: string;
};

/**
 * Fila de `products_public`.
 *
 * La vista devuelve todo como nullable porque Postgres no le garantiza a
 * PostgREST que las columnas de un join no puedan ser null. En la práctica
 * nunca lo son: la vista filtra por `is_active`. Este tipo lo corrige para
 * no tener que poner `!` en cada uso.
 */
export type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  discount_transfer_pct: number;
  is_featured: boolean;
  sort_order: number;
  has_capacities: boolean;
  min_price_usd: number;
  max_price_usd: number;
  stock_status: StockStatus;
  colors: ColorDot[];
  cover_path: string | null;
  created_at: string;
};

/** Producto completo para la ficha de detalle. */
export type ProductDetail = ProductListItem & {
  specs: Record<string, string>;
  capacities: ProductCapacity[];
  allColors: ProductColor[];
  images: ProductImage[];
};

/**
 * Ítem de pedido tal como se guarda en `orders.items`.
 *
 * Color y capacidad van en TEXTO PLANO, no por ID: el pedido tiene que
 * seguir siendo legible aunque el producto se borre (CLAUDE.md §4).
 */
export type OrderItem = {
  sku: string;
  name: string;
  color: string | null;
  capacity: string | null;
  quantity: number;
  unit_price_ars: number;
  subtotal_ars: number;
};

export const STOCK_LABEL: Record<StockStatus, string> = {
  in_stock: "Disponible",
  on_demand: "A pedido · 7 a 10 días",
  out_of_stock: "Sin stock",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  closed: "Cerrado",
  lost: "Perdido",
};
