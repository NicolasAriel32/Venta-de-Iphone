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

// ------------------------------------------------------- búsqueda por términos

/**
 * Palabras que no aportan a la búsqueda. Se comparan sin acentos.
 *
 * No incluye "celular", "notebook" ni similares a propósito: esos sí pueden
 * coincidir con el nombre de una categoría.
 */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas", "con",
  "para", "por", "en", "al", "que", "tenes", "tienes", "tiene", "hay", "precio",
  "precios", "cuesta", "cuanto", "sale", "vale", "stock", "modelo", "disponible",
  "quiero", "busco", "necesito", "me", "mi", "tu", "su", "es", "esta", "este",
  "cual", "cuales", "algun", "alguna", "y", "o", "a",
]);

/** Números que son capacidad, no modelo. `iPhone 17` sí; `256` no. */
const CAPACITY_NUMBERS = new Set(["32", "64", "128", "256", "512", "1024", "2048"]);

/** "256 GB", "512 gigas", "1 TB" — la capacidad no vive en `products`. */
const CAPACITY_UNITS = /\b\d+\s*(gb|gigas?|gigabytes?|tb|teras?|terabytes?)\b/gi;

/**
 * Minúsculas y sin acentos, solo para comparar contra STOPWORDS.
 *
 * El rango de marcas diacríticas se arma con `RegExp` en vez de un literal:
 * escritas a mano son caracteres invisibles en el fuente y cualquier
 * herramienta que normalice el archivo las rompe sin dejar rastro.
 */
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function fold(term: string): string {
  return term.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

/**
 * Parte la consulta en términos útiles.
 *
 * El asistente pregunta como habla un cliente —"iPhone 17 Pro de 256 gigas"—
 * y la capacidad está en `product_capacities`, no en el nombre. Buscar la
 * frase entera con un `ilike` no encuentra nada y el chat termina diciendo
 * que no tiene un producto que sí tiene.
 *
 * Los términos se dejan con acentos: `ilike` es sensible a ellos y el
 * catálogo los usa.
 */
export function tokenizeQuery(raw: string): string[] {
  return raw
    .replace(CAPACITY_UNITS, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length > 1)
    .filter((t) => !CAPACITY_NUMBERS.has(t))
    .filter((t) => !STOPWORDS.has(fold(t)))
    .slice(0, 6);
}

/**
 * Busca por términos y ordena por cuántos coinciden.
 *
 * El filtro contra Postgres es un OR —traer de más es barato con 42
 * productos— y el ranking se resuelve acá. Un AND en PostgREST obligaría a
 * encadenar `.or()` y depender de cómo agrupa los parámetros repetidos;
 * con este volumen no vale la pena esa deuda.
 *
 * No toca `getProducts`: el buscador de la tienda es otra cosa y cambiarlo
 * sería meterse con F3 sin haberla terminado.
 */
export async function searchProducts(
  query: string,
  limit = 4,
): Promise<ProductListItem[]> {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) return [];

  const supabase = createStaticClient();
  const filter = terms
    .flatMap((t) => [
      `name.ilike.%${t}%`,
      `brand.ilike.%${t}%`,
      `sku.ilike.%${t}%`,
      `category_name.ilike.%${t}%`,
    ])
    .join(",");

  const { data, error } = await supabase
    .from("products_public")
    .select(LIST_COLUMNS)
    .or(filter)
    .limit(40);

  if (error) {
    console.error("[catalog] searchProducts:", error.message);
    return [];
  }

  const scored = (data ?? []).map((row) => {
    const item = asListItem(row);
    const haystack =
      `${item.name} ${item.brand} ${item.sku} ${item.category_name}`.toLowerCase();
    const hits = terms.filter((t) => haystack.includes(t.toLowerCase())).length;
    return { item, hits };
  });

  return scored
    .sort(
      (a, b) =>
        b.hits - a.hits ||
        Number(b.item.is_featured) - Number(a.item.is_featured) ||
        a.item.sort_order - b.item.sort_order,
    )
    .slice(0, limit)
    .map((s) => s.item);
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
