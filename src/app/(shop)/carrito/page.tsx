import type { Metadata } from "next";
import brand from "@/brand.config";
import CartClient from "@/components/shop/CartClient";
import { getStoreContext } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tu pedido",
  description:
    "Revisá tu pedido y cerralo por WhatsApp. Sin registro y sin pagar nada online.",
  // Un carrito no tiene nada que hacer en Google, y cada URL indexada de más
  // le come presupuesto de rastreo a las fichas de producto.
  robots: { index: false, follow: true },
};

/**
 * `/carrito` — servidor solo para resolver la cotización y la config.
 *
 * Las líneas viven en localStorage, así que las pinta el cliente. Lo único
 * que no puede salir de ahí es el precio en pesos: se calcula con la
 * cotización vigente, igual que en todo el catálogo (CLAUDE.md §4).
 *
 * `revalidate` igual al del catálogo: si el carrito se refrescara cada 30 min
 * (lo que hereda del cache de `lib/exchange.ts`), el total podría quedar
 * calculado con una cotización más vieja que la de la ficha de la que vino el
 * producto. Ver dos precios distintos del mismo ítem rompe la confianza justo
 * en la pantalla donde se cierra la venta.
 */
export const revalidate = 60;
export default async function CarritoPage() {
  const { config, rate } = await getStoreContext();

  return (
    <div className="page-wrap">
      <CartClient
        usdRate={rate.value}
        paymentNote={config?.payment_note || brand.notes.payment}
        whatsappNumber={config?.whatsapp_number || brand.whatsapp.number}
      />
    </div>
  );
}
