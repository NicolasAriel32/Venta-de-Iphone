/**
 * analytics.ts — envío de eventos desde el navegador.
 *
 * Alimenta las métricas del panel (F5). Tres reglas de diseño:
 *
 * 1. **No compite con el LCP.** Todo sale en `requestIdleCallback`, después
 *    de que la pantalla ya pintó. Una métrica no vale un milisegundo del
 *    presupuesto de 3 s con datos móviles.
 * 2. **No puede romper nada.** Todo va envuelto en try/catch y se ignora el
 *    resultado. Si el endpoint está caído, el cliente ni se entera.
 * 3. **No guarda datos personales.** El `session_id` es un UUID que genera
 *    el propio navegador para poder distinguir una visita de diez recargas.
 *    No se cruza con nada ni identifica a nadie.
 *
 * Va contra `/api/track` y no contra Supabase directo porque `sendBeacon` no
 * permite mandar headers, y la API de Supabase necesita el `apikey`. De paso
 * queda un solo lugar donde poner el rate limit en F7.
 */

import type { AnalyticsEventKind } from "@/lib/supabase/types";

const ENDPOINT = "/api/track";
const SESSION_KEY = "mostrador:sid";

/**
 * UUID del navegador, persistido en localStorage.
 *
 * En `sessionStorage` se perdería en cada pestaña nueva y el mismo cliente
 * contaría como cinco visitas. En localStorage vive hasta que borre datos.
 */
function sessionId(): string | null {
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Modo privado de Safari, cookies bloqueadas, lo que sea. El evento se
    // manda igual, solo que sin sesión: cuenta como pantalla vista, no como
    // visita distinta.
    return null;
  }
}

/** Corre `fn` cuando el navegador esté libre, sin bloquear el pintado. */
function whenIdle(fn: () => void) {
  if (typeof window === "undefined") return;

  const idle = window.requestIdleCallback;
  if (typeof idle === "function") {
    idle(fn, { timeout: 2000 });
    return;
  }

  // Safari viejo. Un timeout de 0 alcanza: igual sale después del paint.
  window.setTimeout(fn, 0);
}

export type TrackOptions = {
  productId?: string | null;
  meta?: Record<string, string | number | boolean>;
};

export function track(kind: AnalyticsEventKind, options: TrackOptions = {}) {
  if (typeof window === "undefined") return;

  whenIdle(() => {
    try {
      const body = JSON.stringify({
        kind,
        path: window.location.pathname,
        productId: options.productId ?? null,
        session: sessionId(),
        meta: options.meta ?? {},
      });

      // `sendBeacon` sobrevive a que el usuario navegue o cierre la pestaña
      // en el mismo gesto — que es exactamente lo que pasa con el click de
      // WhatsApp, donde el navegador se va a otra app.
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon?.(ENDPOINT, blob)) return;

      // Fallback: `keepalive` le pide lo mismo a fetch.
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Una métrica perdida no es un problema del comprador.
    }
  });
}

/**
 * Click a WhatsApp — el evento más cercano a una venta en este rubro.
 * `where` distingue el botón flotante del de la ficha.
 */
export function trackWhatsApp(where: string, productId?: string | null) {
  track("whatsapp_click", { productId, meta: { where } });
}
