/**
 * exchange.ts — cotización del dólar.
 *
 * El catálogo se carga en USD y se muestra en pesos. Este módulo resuelve
 * de dónde sale el número que hace esa conversión.
 *
 * Dos modos, guardados en `store_config.rate_mode`:
 *
 *   auto   → se trae el dólar blue (venta) de dolarapi.com. La API publica
 *            el último valor disponible, así que un lunes a la mañana
 *            devuelve el cierre del último día hábil. Es exactamente el
 *            comportamiento que se busca.
 *   manual → manda `store_config.usd_rate`, cargado desde el panel.
 *
 * Por qué la de VENTA y no la de compra: la de venta es a la que el
 * revendedor repone mercadería. Convertir con la de compra es vender por
 * debajo del costo de reposición.
 *
 * Cadena de fallback, en orden:
 *   1. La API responde         → ese valor.
 *   2. La API falla            → `rate_auto` (el último valor conocido).
 *   3. Tampoco hay `rate_auto` → `usd_rate` (el manual).
 *   4. No hay nada             → 0, y la UI muestra "Consultar precio".
 *
 * Nunca se inventa un número. Un precio calculado con una cotización
 * inventada es peor que no mostrar precio.
 *
 * ⚠️ Esta función NO escribe `rate_auto` en la base. No puede: el render
 * público corre como anónimo y RLS solo permite escribir autenticado. El
 * refresco de `rate_auto` lo hace el panel al abrirse (F5) o el workflow de
 * n8n (F7). Mientras tanto es un colchón que se actualiza a mano, y su
 * único trabajo es evitar que la tienda quede sin precios si la API se cae.
 */

import "server-only";
import type { StoreConfig } from "./supabase/types";

const DOLAR_API = "https://dolarapi.com/v1/dolares/blue";

/** Cuánto se cachea la respuesta de la API. El blue no se mueve por minuto. */
const CACHE_SECONDS = 1800; // 30 min

/** Si la API tarda más que esto, no vale la pena esperarla. */
const TIMEOUT_MS = 3500;

export type ExchangeRate = {
  /** El número con el que se convierte. 0 = no se pudo resolver. */
  value: number;
  /** De dónde salió, para poder mostrarlo en el panel. */
  origin: "api" | "cache" | "manual" | "none";
  /** Cuándo se actualizó ese valor. */
  updatedAt: string | null;
};

type DolarApiResponse = {
  compra?: number;
  venta?: number;
  fechaActualizacion?: string;
};

/**
 * Pega a la API del dólar. Devuelve null ante cualquier problema: que la
 * cotización no cargue no puede tumbar el catálogo entero.
 */
export async function fetchBlueRate(): Promise<{
  value: number;
  updatedAt: string | null;
} | null> {
  try {
    const res = await fetch(DOLAR_API, {
      // Cache de Next: una sola llamada real cada 30 min para toda la app.
      next: { revalidate: CACHE_SECONDS, tags: ["usd-rate"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      console.error("[exchange] dolarapi respondió", res.status);
      return null;
    }

    const data = (await res.json()) as DolarApiResponse;
    const value = Number(data.venta);

    // Validación de cordura: si la API devuelve basura, no se usa.
    // Un dólar fuera de este rango es un error de la fuente, no una noticia.
    if (!Number.isFinite(value) || value <= 100 || value > 100_000) {
      console.error("[exchange] valor fuera de rango:", data.venta);
      return null;
    }

    return { value, updatedAt: data.fechaActualizacion ?? null };
  } catch (err) {
    console.error("[exchange] no se pudo traer la cotización:", err);
    return null;
  }
}

/**
 * Resuelve la cotización vigente a partir de la config de la tienda.
 *
 * Es la única función que el resto de la app debería usar.
 */
export async function resolveRate(config: StoreConfig | null): Promise<ExchangeRate> {
  if (!config) return { value: 0, origin: "none", updatedAt: null };

  // Modo manual: manda lo que cargó el dueño. Ni se llama a la API.
  if (config.rate_mode === "manual") {
    return {
      value: Number(config.usd_rate) || 0,
      origin: "manual",
      updatedAt: config.rate_updated_at,
    };
  }

  const fresh = await fetchBlueRate();
  if (fresh) {
    return { value: fresh.value, origin: "api", updatedAt: fresh.updatedAt };
  }

  // La API no respondió: se usa el último valor conocido.
  const cached = Number(config.rate_auto) || 0;
  if (cached > 0) {
    return { value: cached, origin: "cache", updatedAt: config.rate_auto_at };
  }

  // Ni eso: se cae al manual antes de rendirse.
  const manual = Number(config.usd_rate) || 0;
  return manual > 0
    ? { value: manual, origin: "manual", updatedAt: config.rate_updated_at }
    : { value: 0, origin: "none", updatedAt: null };
}

/** Texto para el panel y el pie del catálogo. */
export function rateLabel(rate: ExchangeRate): string {
  switch (rate.origin) {
    case "api":
      return "Cotización del dólar blue, actualizada automáticamente";
    case "cache":
      return "Última cotización conocida del dólar blue";
    case "manual":
      return "Cotización fijada manualmente";
    default:
      return "Sin cotización disponible";
  }
}
