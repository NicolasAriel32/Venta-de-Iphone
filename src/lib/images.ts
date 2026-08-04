/**
 * URLs del bucket de imágenes.
 *
 * Vive separado de `catalog.ts` a propósito: catalog.ts importa
 * `next/headers` a través del cliente de servidor de Supabase, y si un
 * componente cliente importara desde ahí, todo ese grafo se iría al bundle
 * del navegador y el build rompería.
 *
 * Este módulo no importa nada. Se puede usar de los dos lados.
 */

/**
 * URL pública de una imagen.
 *
 * Acepta dos formas de `storage_path`, y la distingue por la barra inicial:
 *
 * - `/productos/iphone-17-pro-1.webp` → asset propio de `public/`, servido
 *   por el CDN de Netlify junto con el resto del sitio.
 * - `iphone-17-pro/1.webp` → objeto del bucket `product-images`.
 *
 * Conviven a propósito (decisión 41). La base sigue siendo la fuente de
 * verdad de qué imagen es de qué producto; lo único que cambia entre una
 * forma y la otra es dónde está el archivo. Migrar una foto de `public/` al
 * bucket es editar su `storage_path` y nada más.
 *
 * El bucket es público, así que la URL se arma por string: no hace falta
 * pedirle nada a Supabase ni firmar nada.
 */
export function imageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith("/")) return storagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}

/**
 * La misma URL, pero absoluta.
 *
 * Para `<Image>` alcanza con la ruta relativa; para Open Graph y JSON-LD no:
 * WhatsApp y Google no resuelven rutas relativas, así que una previsualización
 * con `/productos/x.webp` sale sin imagen. `origin` es `brand.url`.
 */
export function absoluteImageUrl(
  storagePath: string | null | undefined,
  origin: string,
): string | null {
  const url = imageUrl(storagePath);
  if (!url) return null;
  return url.startsWith("/") ? `${origin.replace(/\/$/, "")}${url}` : url;
}
