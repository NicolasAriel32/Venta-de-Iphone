/**
 * catalog.ts — todas las lecturas del catálogo público.
 *
 * Vive del lado del servidor: los Server Components de la tienda llaman
 * a estas funciones y el HTML sale ya renderizado con los precios en ARS.
 * El navegador no consulta Supabase para ver el catálogo.
 *
 * Nada de esto necesita sesión: RLS permite lectura anónima de las filas
 * activas (F2).
 */

import { createStaticClient } from "./supabase/server";
import { resolveRate, type ExchangeRate } from "./exchange";
import type {
  Category,
  ColorDot,
  ProductCapacity,
  ProductColor,
  ProductDetail,
  ProductImage,
  ProductListItem,
  StoreConfig,
} from "./supabase/types";

/** Revalidación del ISR. La cotización cambia todos los días, no cada minuto. */
export const REVALIDATE_SECONDS = 60;

const LIST_COLUMNS =
  "id, sku, name, slug, brand, description, category_id, category_name, category_slug, discount_transfer_pct, is_featured, sort_order, has_capacities, min_price_usd, max_price_usd, stock_status, colors, cover_path, created_at";

/**
 * La vista devuelve todo nullable porque PostgREST no puede garantizar que
 * las columnas de un join no sean null. En la práctica nunca lo son: la
 * vista ya filtra por is_active. Este cast lo corrige en un solo lugar en
 * vez de obligar a poner `!` en cada componente.
 */
function asListItem(row: Record<string, unknown>): ProductListItem {
  return {
    ...row,
    colors: (row.colors ?? []) as ColorDot[],
  } as ProductListItem;
}

// ---------------------------------------------------------------- config

/**
 * Config de la tienda. Es la fila que trae la cotización, así que la toca
 * absolutamente todo el catálogo.
 */
export async function getStoreConfig(): Promise<StoreConfig | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase.from("store_config").select("*").single();

  if (error) {
    console.error("[catalog] getStoreConfig:", error.message);
    return null;
  }
  return data;
}

/**
 * Config + cotización vigente, resueltas juntas.
 *
 * Es lo que consumen las páginas: `usd_rate` de la tabla NO alcanza, porque
 * en modo automático el número real viene de la API del dólar. Ver
 * `lib/exchange.ts`.
 */
export async function getStoreContext(): Promise<{
  config: StoreConfig | null;
  rate: ExchangeRate;
}> {
  const config = await getStoreConfig();
  const rate = await resolveRate(config);
  return { config, rate };
}

/** Atajo cuando solo hace falta el número. 0 = no se pudo resolver. */
export async function getUsdRate(): Promise<number> {
  const { rate } = await getStoreContext();
  return rate.value;
}

// ------------------------------------------------------------ categorías

export async function getCategories(): Promise<Category[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[catalog] getCategories:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

// --------------------------------------------------------------- listado

export type SortOption = "relevance" | "price_asc" | "price_desc" | "newest";

export type CatalogFilters = {
  category?: string;
  brand?: string;
  query?: string;
  sort?: SortOption;
  page?: number;
  perPage?: number;
};

export type CatalogPage = {
  items: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export async function getProducts(filters: CatalogFilters = {}): Promise<CatalogPage> {
  const {
    category,
    brand,
    query,
    sort = "relevance",
    page = 1,
    perPage = 12,
  } = filters;

  const supabase = createStaticClient();
  let q = supabase.from("products_public").select(LIST_COLUMNS, { count: "exact" });

  if (category) q = q.eq("category_slug", category);
  if (brand) q = q.eq("brand", brand);

  // Búsqueda por nombre, marca o SKU. `or` con ilike cubre los tres casos
  // sin necesidad de full-text search, que para 42 productos sería un
  // martillo para un clavito.
  if (query) {
    const safe = query.replace(/[%,()]/g, " ").trim();
    if (safe) {
      q = q.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,sku.ilike.%${safe}%`);
    }
  }

  switch (sort) {
    case "price_asc":
      q = q.order("min_price_usd", { ascending: true });
      break;
    case "price_desc":
      q = q.order("min_price_usd", { ascending: false });
      break;
    case "newest":
      q = q.order("created_at", { ascending: false });
      break;
    default:
      q = q.order("is_featured", { ascending: false }).order("sort_order");
  }

  const from = (page - 1) * perPage;
  q = q.range(from, from + perPage - 1);

  const { data, error, count } = await q;

  if (error) {
    console.error("[catalog] getProducts:", error.message);
    return { items: [], total: 0, page, perPage, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    items: (data ?? []).map(asListItem),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getFeatured(limit = 6): Promise<ProductListItem[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("products_public")
    .select(LIST_COLUMNS)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(limit);

  if (error) {
    console.error("[catalog] getFeatured:", error.message);
    return [];
  }
  return (data ?? []).map(asListItem);
}

/** Marcas presentes en el catálogo, para el filtro. */
export async function getBrands(category?: string): Promise<string[]> {
  const supabase = createStaticClient();
  let q = supabase.from("products_public").select("brand");
  if (category) q = q.eq("category_slug", category);

  const { data, error } = await q;
  if (error) return [];

  const unique = new Set((data ?? []).map((r) => r.brand).filter(Boolean) as string[]);
  return [...unique].sort((a, b) => a.localeCompare(b, "es"));
}

// --------------------------------------------------------------- detalle

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createStaticClient();

  const { data: base, error } = await supabase
    .from("products_public")
    .select(`${LIST_COLUMNS}, specs`)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !base) return null;

  // Las tres consultas de variantes no dependen entre sí: van en paralelo.
  const [colorsRes, capacitiesRes, imagesRes] = await Promise.all([
    supabase
      .from("product_colors")
      .select("*")
      .eq("product_id", base.id as string)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("product_capacities")
      .select("*")
      .eq("product_id", base.id as string)
      .eq("is_active", true)
      .order("capacity_gb"),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", base.id as string)
      .order("sort_order"),
  ]);

  return {
    ...asListItem(base),
    specs: (base.specs ?? {}) as Record<string, string>,
    allColors: (colorsRes.data ?? []) as ProductColor[],
    capacities: (capacitiesRes.data ?? []) as ProductCapacity[],
    images: (imagesRes.data ?? []) as ProductImage[],
  };
}

/** Slugs de todos los productos activos. Alimenta el sitemap. */
export async function getAllProductSlugs(): Promise<{ slug: string; created_at: string }[]> {
  const supabase = createStaticClient();
  const { data } = await supabase.from("products_public").select("slug, created_at");
  return (data ?? []) as { slug: string; created_at: string }[];
}

// ---------------------------------------------------------------- imágenes

export { imageUrl } from "./images";
