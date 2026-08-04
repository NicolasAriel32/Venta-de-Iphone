/**
 * POST /api/agent/catalog — el catálogo real, para el asistente del chat.
 *
 * Existe porque un prompt no puede ser la base de conocimiento de un
 * catálogo vivo. 42 productos, 46 capacidades y 88 colores, con precios en
 * USD que se convierten a pesos con la cotización del blue del día: meter
 * eso en el prompt obliga a reescribirlo cada vez que se mueve un precio
 * —justo el trabajo manual que este proyecto existe para eliminar— y aun
 * así el modelo alucina, porque un listado largo en el prompt lo lee como
 * sugerencia y no como verdad.
 *
 * Con esto el agente consulta la misma fuente que la web. Cambiás la
 * cotización y el chat también se actualiza.
 *
 * Reusa `catalog.ts` y `pricing.ts` a propósito: si el precio del chat se
 * calculara acá con su propia fórmula, el día que cambie el redondeo o el
 * descuento por transferencia el chat empezaría a decir otro número que la
 * ficha. Una sola fuente de verdad para el precio.
 *
 * Autenticación: header `x-agent-secret`. El endpoint es público —lo llama
 * Retell desde sus servidores, no el navegador— así que sin secreto queda
 * abierto a que cualquiera se baje el catálogo entero.
 */

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import brand from "@/brand.config";
import { getProductBySlug, getStoreContext, searchProducts } from "@/lib/catalog";
import { buildPrice, formatCapacity, listPrice } from "@/lib/pricing";
import { STOCK_LABEL, type ProductDetail } from "@/lib/supabase/types";

/** Nunca se prerenderiza: cada llamada tiene que leer la cotización del momento. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Cuántos productos se devuelven como máximo. Un LLM no necesita 42. */
const MAX_RESULTS = 4;

type AgentArgs = {
  /** Texto libre: "iphone 17 pro", "notebook", "cargador". */
  query?: string;
  /** Búsqueda directa por slug, si el agente ya lo tiene. */
  slug?: string;
};

/** Comparación de secretos en tiempo constante. */
function secretMatches(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Arma la respuesta de un producto.
 *
 * Si `usdRate` es 0 no se pudo resolver la cotización: se devuelve el precio
 * en null en vez de un número inventado, igual que hace la web (decisión 34).
 */
function shapeProduct(product: ProductDetail, usdRate: number) {
  const discount = product.discount_transfer_pct;
  const hasRate = usdRate > 0;

  const price = (usd: number) => {
    if (!hasRate) return { precio: null, precio_transferencia: null, usd: `USD ${usd}` };
    const view = buildPrice(usd, usdRate, discount);
    return {
      precio: view.formatted.ars,
      precio_transferencia: view.hasDiscount ? view.formatted.transferArs : null,
      usd: view.formatted.usd,
    };
  };

  const capacidades = product.capacities.map((c) => ({
    capacidad: formatCapacity(c.capacity_gb),
    ...price(Number(c.price_usd)),
    stock: STOCK_LABEL[c.stock_status],
    disponible: c.stock_status === "in_stock",
  }));

  return {
    nombre: product.name,
    marca: product.brand,
    sku: product.sku,
    categoria: product.category_name,
    url: `${brand.url}/productos/${product.slug}`,
    descripcion: product.description,
    stock_general: STOCK_LABEL[product.stock_status],
    colores: product.allColors.map((c) => c.name),
    /** Solo cuando NO hay capacidades: ahí el precio vive en el producto. */
    ...(product.has_capacities
      ? {
          desde: hasRate
            ? listPrice(Number(product.min_price_usd), usdRate, true).label
            : null,
          capacidades,
        }
      : { ...price(Number(product.min_price_usd)), capacidades: [] }),
  };
}

export async function POST(request: Request) {
  const expected = process.env.AGENT_API_SECRET;

  // Fail closed: sin secreto configurado el endpoint no atiende a nadie.
  if (!expected) {
    console.error("[agent/catalog] falta AGENT_API_SECRET");
    return NextResponse.json({ error: "Endpoint sin configurar" }, { status: 500 });
  }

  const received = request.headers.get("x-agent-secret") ?? "";
  if (!secretMatches(received, expected)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Retell manda `{ call, name, args }`; otros clientes mandan los args
  // pelados. Se aceptan las dos formas para no atarse a un proveedor.
  const args = ((body.args as AgentArgs) ?? body) as AgentArgs;
  const query = typeof args.query === "string" ? args.query.trim() : "";
  const slug = typeof args.slug === "string" ? args.slug.trim() : "";

  if (!query && !slug) {
    return NextResponse.json(
      { error: "Falta `query` o `slug`." },
      { status: 400 },
    );
  }

  const { rate } = await getStoreContext();

  // Por slug es una sola lectura; por texto se busca y después se traen las
  // variantes de cada resultado.
  //
  // La búsqueda es por términos, no por la frase entera: el asistente
  // pregunta como habla el cliente ("iPhone 17 Pro de 256 gigas") y la
  // capacidad no está en el nombre del producto.
  const slugs = slug
    ? [slug]
    : (await searchProducts(query, MAX_RESULTS)).map((p) => p.slug);

  const details = (
    await Promise.all(slugs.slice(0, MAX_RESULTS).map((s) => getProductBySlug(s)))
  ).filter((p): p is ProductDetail => p !== null);

  if (details.length === 0) {
    return NextResponse.json({
      encontrados: 0,
      productos: [],
      nota:
        "No hay ningún producto que coincida. No inventes uno: ofrecé " +
        "buscar otro modelo o derivá la consulta por WhatsApp.",
    });
  }

  return NextResponse.json({
    cotizacion: {
      valor: rate.value,
      origen: rate.origin,
      actualizada: rate.updatedAt,
    },
    encontrados: details.length,
    productos: details.map((p) => shapeProduct(p, rate.value)),
    nota:
      "Estos son los únicos datos válidos de precio y stock. Si el cliente " +
      "pregunta por algo que no figura acá, decí que no lo tenés.",
  });
}
