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
 * URL pública de una imagen del bucket.
 *
 * El bucket es público, así que la URL se arma por string: no hace falta
 * pedirle nada a Supabase ni firmar nada.
 */
export function imageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}
