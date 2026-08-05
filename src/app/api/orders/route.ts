import { NextResponse } from "next/server";
import brand from "@/brand.config";
import { getStoreContext } from "@/lib/catalog";
import { createStaticClient } from "@/lib/supabase/server";
import { formatCapacity, lineTotals } from "@/lib/pricing";
import { buildOrderMessage, whatsappUrl } from "@/lib/whatsapp";
import type { Json } from "@/lib/supabase/database.types";
import type { OrderItem, StockStatus } from "@/lib/supabase/types";

/**
 * POST /api/orders — persiste el pedido y devuelve el link de WhatsApp.
 *
 * REGLA DURA (CLAUDE.md §6 F4): primero se guarda, después se redirige. Si
 * este handler falla, el cliente NO sale a WhatsApp: se muestra el error y
 * el botón queda reintentable. Al revés se pierde el pedido, que es
 * justamente lo único que esta pantalla tiene que garantizar.
 *
 * SEGUNDA REGLA: **los precios del body se ignoran.** El navegador manda
 * IDs y cantidades; los precios se vuelven a leer de la base y se convierten
 * acá con la cotización vigente. localStorage lo edita cualquiera con las
 * devtools abiertas, y un pedido guardado con un precio inventado es un
 * problema real cuando el dueño lo lee al día siguiente.
 *
 * Los valores que se calculan acá son los que quedan CONGELADOS: van a la
 * base junto con `usd_rate_snapshot` y son los mismos que arman el mensaje
 * de WhatsApp (SPEC.md FC-4).
 */

/** Lo que manda el navegador. Todo lo demás se resuelve en el servidor. */
type IncomingItem = {
  productId?: unknown;
  capacityId?: unknown;
  colorId?: unknown;
  quantity?: unknown;
};

const MAX_LINES = 50;
const MAX_QTY = 20;

/** Errores con el tono de SPEC.md §7: qué pasó y qué hacer. Sin "Ups". */
function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function asId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  let body: { name?: unknown; phone?: unknown; note?: unknown; items?: unknown };

  try {
    body = await request.json();
  } catch {
    return fail("No pudimos leer el pedido. Volvé a intentar.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

  if (name.length < 2 || name.length > 80) {
    return fail("Escribí tu nombre para que sepamos con quién hablamos.", 400);
  }

  // Se cuentan los dígitos, no los caracteres: "11 5555-5555" es válido.
  if (phone.replace(/\D/g, "").length < 6 || phone.length > 30) {
    return fail("Escribí un teléfono con característica, sin el 15.", 400);
  }

  const rawItems = Array.isArray(body.items) ? (body.items as IncomingItem[]) : [];
  if (rawItems.length === 0) {
    return fail("El carrito está vacío.", 400);
  }
  if (rawItems.length > MAX_LINES) {
    return fail("El pedido tiene demasiadas líneas. Escribinos por WhatsApp.", 400);
  }

  const requested = rawItems.map((item) => ({
    productId: asId(item.productId),
    capacityId: asId(item.capacityId),
    colorId: asId(item.colorId),
    quantity: Math.min(MAX_QTY, Math.max(1, Math.trunc(Number(item.quantity)) || 1)),
  }));

  if (requested.some((i) => !i.productId)) {
    return fail("Hay un producto que no reconocemos. Volvé a armar el carrito.", 400);
  }

  // -------------------------------------------------------- cotización
  const { config, rate } = await getStoreContext();
  const usdRate = rate.value;

  // Sin cotización no hay precio en pesos, y guardar un pedido sin precio
  // es peor que no guardarlo (CLAUDE.md §9, decisión 34).
  if (!usdRate) {
    return fail(
      "No pudimos calcular el precio en pesos ahora. Escribinos por WhatsApp y lo cerramos por ahí.",
      503,
    );
  }

  // ------------------------------------------------- precios desde la base
  const supabase = createStaticClient();

  const productIds = [...new Set(requested.map((i) => i.productId as string))];
  const capacityIds = [...new Set(requested.map((i) => i.capacityId).filter(Boolean))] as string[];
  const colorIds = [...new Set(requested.map((i) => i.colorId).filter(Boolean))] as string[];

  const [productsRes, capacitiesRes, colorsRes] = await Promise.all([
    supabase
      .from("products_public")
      .select("id, sku, name, has_capacities, min_price_usd, discount_transfer_pct, stock_status")
      .in("id", productIds),
    capacityIds.length
      ? supabase
          .from("product_capacities")
          .select("id, product_id, capacity_gb, price_usd, stock_status")
          .in("id", capacityIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
    colorIds.length
      ? supabase
          .from("product_colors")
          .select("id, product_id, name")
          .in("id", colorIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsRes.error || capacitiesRes.error || colorsRes.error) {
    console.error(
      "[orders] no se pudo leer el catálogo:",
      productsRes.error?.message ?? capacitiesRes.error?.message ?? colorsRes.error?.message,
    );
    return fail("No pudimos enviar el pedido. Probá de nuevo en un momento.", 502);
  }

  const products = new Map((productsRes.data ?? []).map((p) => [p.id as string, p]));
  const capacities = new Map((capacitiesRes.data ?? []).map((c) => [c.id, c]));
  const colors = new Map((colorsRes.data ?? []).map((c) => [c.id, c]));

  const items: OrderItem[] = [];
  let totalArs = 0;
  let transferArs = 0;

  for (const req of requested) {
    const product = products.get(req.productId as string);

    // La vista solo trae productos activos: si no está, se dio de baja
    // mientras el carrito dormía en localStorage.
    if (!product) {
      return fail(
        "Un producto del carrito ya no está disponible. Sacalo y volvé a intentar.",
        409,
      );
    }

    const capacity = req.capacityId ? capacities.get(req.capacityId) : undefined;

    // La capacidad tiene que existir y ser de ESTE producto: si no, el precio
    // saldría de otro modelo.
    if (capacity && capacity.product_id !== product.id) {
      return fail("Hay una variante que no corresponde. Volvé a armar el carrito.", 409);
    }
    if (product.has_capacities && !capacity) {
      return fail(
        `Elegí la capacidad de ${product.name} antes de enviar el pedido.`,
        409,
      );
    }

    const color = req.colorId ? colors.get(req.colorId) : undefined;
    if (color && color.product_id !== product.id) {
      return fail("Hay un color que no corresponde. Volvé a armar el carrito.", 409);
    }

    const stock: StockStatus = capacity
      ? capacity.stock_status
      : (product.stock_status as StockStatus);

    if (stock === "out_of_stock") {
      return fail(
        `${product.name} quedó sin stock. Sacalo del carrito o consultanos por WhatsApp.`,
        409,
      );
    }

    // Sin capacidades, `min_price_usd` de la vista es `products.price_usd`.
    const priceUsd = capacity ? capacity.price_usd : (product.min_price_usd as number);
    const discountPct = (product.discount_transfer_pct as number) ?? 0;

    const totals = lineTotals({ priceUsd, discountPct, quantity: req.quantity }, usdRate);

    // Color y capacidad se guardan en TEXTO, no por ID: el pedido tiene que
    // seguir siendo legible aunque el producto se borre (CLAUDE.md §4).
    items.push({
      sku: product.sku as string,
      name: product.name as string,
      color: color?.name ?? null,
      capacity: capacity ? formatCapacity(capacity.capacity_gb) : null,
      quantity: req.quantity,
      unit_price_ars: totals.unitArs,
      subtotal_ars: totals.subtotalArs,
    });

    totalArs += totals.subtotalArs;
    transferArs += totals.subtotalTransferArs;
  }

  if (totalArs <= 0) {
    return fail("No pudimos calcular el total del pedido. Escribinos por WhatsApp.", 422);
  }

  // ------------------------------------------------------------ persistir
  // `create_order` corre como SECURITY DEFINER: es lo que permite devolver el
  // código sin abrirle la tabla `orders` a un comprador anónimo.
  const { data: code, error } = await supabase.rpc("create_order", {
    p_prefix: brand.orderPrefix,
    p_customer_name: name,
    p_customer_phone: phone,
    p_items: items as unknown as Json,
    p_total_ars: totalArs,
    p_usd_rate: usdRate,
    p_note: note,
  });

  if (error || !code) {
    console.error("[orders] no se pudo guardar el pedido:", error?.message);
    return fail("No pudimos enviar el pedido. Probá de nuevo en un momento.", 500);
  }

  // ------------------------------------------------------------- mensaje
  const storeName = config?.store_name || brand.name;
  const whatsappNumber = config?.whatsapp_number || brand.whatsapp.number;

  const message = buildOrderMessage({
    storeName,
    code,
    items,
    totalArs,
    transferArs,
    customerName: name,
    customerPhone: phone,
    note,
  });

  return NextResponse.json(
    {
      code,
      totalArs,
      transferArs,
      usdRate,
      whatsappUrl: whatsappUrl(whatsappNumber, message),
    },
    { status: 201 },
  );
}
