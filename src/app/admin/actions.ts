"use server";

/**
 * Server Actions del panel.
 *
 * Las tres cosas que el dueño hace todos los días: entrar, cambiar la
 * cotización y cambiar un precio.
 *
 * REGLA: después de tocar cualquier cosa que se vea en la tienda, se llama a
 * `revalidateShop()`. Sin eso, el catálogo es estático con ISR de 60 s y el
 * cambio tardaría hasta un minuto en aparecer — que es justo el momento en
 * que se cae la demo (§6 F5: "cambio la cotización, vuelvo a la tienda y
 * todos los precios cambiaron").
 *
 * Por qué revalidación on-demand y NO Supabase Realtime en la tienda: para
 * que la vitrina reaccione sola habría que volver cliente cada ficha y
 * suscribirla a un websocket. Son ~40 KB de bundle más una conexión abierta
 * con datos móviles, contra el presupuesto de 500 KB y 3 s de §1. Acá el
 * costo es cero para el comprador.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RateMode } from "@/lib/supabase/types";

/** Precio máximo aceptado, en USD. Techo de cordura contra un cero de más. */
const MAX_PRICE_USD = 100_000;
/** Cotización máxima aceptada. Misma idea. */
const MAX_RATE = 1_000_000;

export type ActionState = {
  ok: boolean;
  message: string;
  /**
   * Lo que quedó guardado, indexado por el id del campo.
   *
   * Existe porque `/admin` es `force-dynamic` y `revalidateShop()` no lo
   * alcanza: después de guardar, la página NO se vuelve a leer y el
   * formulario seguiría comparando contra el precio viejo, mostrando
   * "Guardar" para siempre. Con esto el cliente sabe cuál es la nueva línea
   * de base sin tener que recargar.
   */
  values?: Record<string, number>;
};

/**
 * Invalida toda la tienda.
 *
 * `"layout"` sobre `/` alcanza el layout raíz, todos los layouts anidados y
 * todas las páginas debajo — home, listado y las 42 fichas de una sola vez.
 * Revalidar ficha por ficha sería más quirúrgico y, con este volumen, más
 * código para el mismo resultado.
 */
function revalidateShop() {
  revalidatePath("/", "layout");
}

/**
 * Corta si la acción llegó sin sesión.
 *
 * No es redundante con `proxy.ts` ni con RLS, y hace falta por un motivo
 * concreto: un `update` de PostgREST que no matchea ninguna fila **no
 * devuelve error**. Sin este chequeo, una llamada sin sesión se iría con
 * "Precio actualizado" sin haber escrito nada — el peor de los dos mundos,
 * porque el dueño se queda tranquilo con un cambio que nunca pasó.
 *
 * `getUser()` y no `getSession()`: el segundo le cree a la cookie.
 */
async function requireUser(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user !== null;
}

const NO_SESSION: ActionState = {
  ok: false,
  message: "Se cerró la sesión. Volvé a entrar y probá de nuevo.",
};

/**
 * Lee un precio del formulario.
 * Acepta coma o punto decimal: en un teclado de celular argentino sale coma.
 */
function parsePrice(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;
  const clean = raw.trim().replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 0 || value > MAX_PRICE_USD) return null;
  // Dos decimales: la base es `numeric` y nadie carga un precio con más.
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { ok: false, message: "Completá el email y la contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje genérico a propósito: distinguir "ese email no existe" de
    // "esa contraseña está mal" le confirma a cualquiera qué cuentas existen.
    return {
      ok: false,
      message: "Email o contraseña incorrectos. Revisá y probá de nuevo.",
    };
  }

  // Dentro de un `try` esto se comería el redirect: `redirect()` funciona
  // tirando una excepción que Next intercepta.
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Cotización — el campo más importante de todo el sistema (CLAUDE.md §6 F5)
// ---------------------------------------------------------------------------

export async function saveRate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await requireUser())) return NO_SESSION;

  const mode = String(formData.get("mode") ?? "auto") as RateMode;

  if (mode !== "auto" && mode !== "manual") {
    return { ok: false, message: "Modo de cotización inválido." };
  }

  const supabase = await createClient();

  if (mode === "auto") {
    // En automático no se toca `usd_rate`: queda como estaba y sigue siendo
    // el tercer escalón de la cadena de fallback de `exchange.ts`. Borrarlo
    // dejaría la tienda sin precios el día que dolarapi no conteste.
    const { error } = await supabase
      .from("store_config")
      .update({ rate_mode: "auto" })
      .eq("id", true);

    if (error) {
      return { ok: false, message: "No pudimos guardar. Probá de nuevo." };
    }

    revalidateShop();
    return { ok: true, message: "Cotización automática activada." };
  }

  const value = parsePrice(formData.get("rate"));
  if (value === null || value <= 0 || value > MAX_RATE) {
    return { ok: false, message: "Poné una cotización mayor a cero." };
  }

  const { error } = await supabase
    .from("store_config")
    .update({
      rate_mode: "manual",
      usd_rate: value,
      rate_updated_at: new Date().toISOString(),
      rate_source: "manual",
    })
    .eq("id", true);

  if (error) {
    return { ok: false, message: "No pudimos guardar. Probá de nuevo." };
  }

  revalidateShop();
  return { ok: true, message: "Cotización actualizada." };
}

// ---------------------------------------------------------------------------
// Precios
// ---------------------------------------------------------------------------

/**
 * Guarda los precios de un producto.
 *
 * Los campos llegan como `price_<id>`: el del producto cuando no tiene
 * capacidades, y uno por capacidad cuando sí. Se guardan juntos para que en
 * el celular sea un solo toque de "Guardar" y no uno por fila.
 *
 * El precio se edita **en USD**, nunca en pesos: es la regla de §4 y la
 * decisión 03. El peso lo calcula la tienda con la cotización del día.
 */
export async function savePrices(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await requireUser())) return NO_SESSION;

  const productId = String(formData.get("productId") ?? "");
  if (!productId) {
    return { ok: false, message: "Falta el producto." };
  }

  const supabase = await createClient();

  const productPrice = parsePrice(formData.get(`price_${productId}`));

  // Todo lo que no sea el precio del producto es una capacidad.
  const capacities: { id: string; price: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("price_")) continue;
    const id = key.slice("price_".length);
    if (id === productId) continue;

    const price = parsePrice(value);
    if (price === null) {
      return {
        ok: false,
        message: "Hay un precio vacío o inválido. Revisalo y guardá de nuevo.",
      };
    }
    capacities.push({ id, price });
  }

  if (productPrice === null && capacities.length === 0) {
    return { ok: false, message: "No hay ningún precio para guardar." };
  }

  // Las capacidades van de a una: son dos o tres por producto y un `upsert`
  // obligaría a mandar la fila entera, con el riesgo de pisar el stock con
  // un valor viejo del formulario.
  for (const cap of capacities) {
    const { error } = await supabase
      .from("product_capacities")
      .update({ price_usd: cap.price })
      // El `eq` de producto no es decorativo: sin él, un id manipulado en el
      // formulario podría editar la capacidad de otro producto.
      .eq("id", cap.id)
      .eq("product_id", productId);

    if (error) {
      return { ok: false, message: "No pudimos guardar. Probá de nuevo." };
    }
  }

  if (productPrice !== null) {
    const { error } = await supabase
      .from("products")
      .update({ price_usd: productPrice })
      .eq("id", productId);

    if (error) {
      return { ok: false, message: "No pudimos guardar. Probá de nuevo." };
    }
  }

  revalidateShop();

  const values: Record<string, number> = Object.fromEntries(
    capacities.map((c) => [c.id, c.price]),
  );
  if (productPrice !== null) values[productId] = productPrice;

  return { ok: true, message: "Precio actualizado en la tienda.", values };
}
