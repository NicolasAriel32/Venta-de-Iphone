/**
 * GET /api/rate — cotización vigente + las filas de la pizarra.
 *
 * Existe por una razón concreta: la pizarra de la home tiene que poder
 * actualizarse sin recargar, y `lib/exchange.ts` es `server-only`. Sin este
 * endpoint, el navegador tendría que pegarle a dolarapi.com directo, que es
 * exactamente lo que el brief prohíbe: una API externa en el camino crítico
 * del cliente, sin la validación de cordura ni la cadena de fallback.
 *
 * **Devuelve los pesos ya calculados.** El cliente no multiplica nada: la
 * conversión pasa acá, con `pricing.ts`, igual que en el render de las
 * páginas. Un redondeo distinto entre el servidor y el navegador se vería
 * como un precio que cambia solo al cargar.
 *
 * Cacheado 60 s, igual que el ISR del catálogo. Sin eso, cien pestañas
 * abiertas serían cien consultas por minuto a São Paulo. La llamada a
 * dolarapi ya tiene su propio caché de 30 min dentro de `exchange.ts`, así
 * que este endpoint no le agrega tráfico a la API del dólar.
 */

import { NextResponse } from "next/server";
import { getFeatured, getStoreContext } from "@/lib/catalog";
import { rateLabel } from "@/lib/exchange";
import { buildBoardRows, BOARD_SIZE, type BoardSnapshot } from "@/lib/board";

export const revalidate = 60;

export async function GET() {
  const [{ rate }, featured] = await Promise.all([
    getStoreContext(),
    getFeatured(BOARD_SIZE),
  ]);

  const snapshot: BoardSnapshot = {
    rate: {
      value: rate.value,
      origin: rate.origin,
      updatedAt: rate.updatedAt,
      label: rateLabel(rate),
    },
    rows: buildBoardRows(featured, rate.value),
  };

  return NextResponse.json(snapshot);
}
