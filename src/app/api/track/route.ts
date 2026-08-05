import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

/**
 * POST /api/track — registra un evento de tráfico.
 *
 * Existe por una razón concreta: `navigator.sendBeacon` no permite mandar
 * headers, y pegarle a Supabase directo requiere el `apikey`. Este handler
 * es el puente, y de paso deja un único punto donde poner el rate limit en F7.
 *
 * **Siempre responde 204, incluso cuando descarta el evento.** No es
 * descuido: el que llama es el navegador de un comprador y no tiene nada que
 * hacer con el error. Devolver 400 solo serviría para que un bot sepa qué
 * payload sí entra.
 *
 * La validación de verdad está en el RPC `track_event`, que corre en la base:
 * tipo de evento conocido, ruta interna, producto existente, meta acotada.
 * Acá arriba solo se recorta lo evidente para no viajar al pedo.
 */

// Este endpoint escribe: nunca se cachea ni se prerenderiza.
export const dynamic = "force-dynamic";

/** Sin body, sin ceremonia. Es la respuesta que espera `sendBeacon`. */
const ACK = new NextResponse(null, { status: 204 });

function asString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(request: Request) {
  let body: {
    kind?: unknown;
    path?: unknown;
    productId?: unknown;
    session?: unknown;
    meta?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return ACK;
  }

  const kind = asString(body.kind, 32);
  if (!kind) return ACK;

  // El objeto `meta` se pasa tal cual: el RPC lo rechaza si no es un objeto
  // o si pesa más de 500 caracteres.
  const meta: Json =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Json)
      : {};

  try {
    // Cliente anónimo a propósito: el que navega la tienda no tiene sesión,
    // y `track_event` es SECURITY DEFINER justamente para eso.
    const supabase = createStaticClient();
    await supabase.rpc("track_event", {
      p_kind: kind,
      p_path: asString(body.path, 200) ?? undefined,
      p_product_id: asString(body.productId, 36) ?? undefined,
      p_session: asString(body.session, 64) ?? undefined,
      p_meta: meta,
    });
  } catch {
    // Supabase pausado, red caída, lo que sea. Se pierde la métrica y ya.
  }

  return ACK;
}
