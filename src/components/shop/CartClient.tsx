"use client";

import { useState } from "react";
import Link from "next/link";
import CartLineRow from "./CartLineRow";
import { WhatsAppIcon } from "@/components/ui/icons";
import { cartTotals, formatArs } from "@/lib/pricing";
import { useCart, useCartReady } from "@/store/cart";

/**
 * Página `/carrito` — revisión, datos del cliente y salida a WhatsApp (FC-4).
 *
 * Orden del checkout, y por qué:
 *
 *   1. Se persiste el pedido en `POST /api/orders`.
 *   2. Recién si eso salió bien, se redirige a wa.me.
 *
 * Al revés se pierde el pedido: el navegador se va a otra app y no queda
 * registro de nada (CLAUDE.md §6, trampa de F4). Si el POST falla, no se
 * redirige: se muestra el error y el botón queda reintentable.
 *
 * El formulario pide nombre y teléfono. Nada más. Cada campo extra es una
 * venta menos.
 */
export default function CartClient({
  usdRate,
  paymentNote,
  whatsappNumber,
}: {
  usdRate: number;
  paymentNote: string;
  whatsappNumber: string;
}) {
  const ready = useCartReady();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = cartTotals(
    items.map((i) => ({
      priceUsd: i.priceUsd,
      discountPct: i.discountPct,
      quantity: i.quantity,
    })),
    usdRate,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          note,
          // Solo IDs y cantidades: el servidor vuelve a leer los precios de
          // la base. Lo que hay en localStorage no define lo que se cobra.
          items: items.map((i) => ({
            productId: i.productId,
            capacityId: i.capacityId,
            colorId: i.colorId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.whatsappUrl) {
        setError(
          data?.error ?? "No pudimos enviar el pedido. Probá de nuevo en un momento.",
        );
        setSending(false);
        return;
      }

      // El pedido ya está guardado. Recién ahora se sale a WhatsApp.
      //
      // `location.href` y no `window.open`: en iOS, una ventana nueva abierta
      // después de un `await` la bloquea el navegador porque ya no la asocia
      // al toque del usuario. Navegando en la misma pestaña, el link `wa.me`
      // abre la app instalada.
      clear();
      window.location.href = data.whatsappUrl as string;
    } catch {
      setError("No pudimos enviar el pedido. Revisá la conexión y probá de nuevo.");
      setSending(false);
    }
  }

  // Antes de montar no se sabe qué hay en localStorage. Un esqueleto corto
  // evita el parpadeo de "está vacío" en un carrito que sí tiene cosas.
  if (!ready) {
    return (
      <div className="py-8" aria-busy="true" aria-label="Cargando tu pedido">
        <div className="h-6 w-40 animate-pulse rounded bg-surface" />
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-16 text-center">
        <h1 className="cart-title">
          Tu pedido está vacío
        </h1>
        <p className="mx-auto mt-3 max-w-[32ch] text-sm text-muted">
          Agregá productos del catálogo y armá el pedido. Lo cerrás por WhatsApp en
          un toque.
        </p>
        <Link
          href="/productos"
          className="btn-amber tap mt-6"
        >
          Ver catálogo
        </Link>
      </section>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="cart-title">
          Tu pedido
        </h1>
        <button
          type="button"
          onClick={clear}
          className="tap h-11 text-sm text-muted hover:text-paper"
        >
          Vaciar
        </button>
      </div>

      <ul className="mt-2 divide-y divide-line">
        {items.map((item) => (
          <CartLineRow key={item.key} item={item} usdRate={usdRate} />
        ))}
      </ul>

      {/* Resumen */}
      <section className="price-card mt-6 p-5">
        {usdRate > 0 ? (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="cart-total mono">
                {formatArs(totals.totalArs)}
              </span>
            </div>

            {totals.hasDiscount && (
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-sm text-muted">Con transferencia</span>
                <span className="cart-total-transf mono">
                  {formatArs(totals.transferArs)}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-paper">
            No pudimos cargar el precio. Enviá el pedido igual y te lo pasamos por
            WhatsApp.
          </p>
        )}

        {paymentNote && (
          <p className="mt-4 border-t border-line pt-4 text-sm text-paper">
            💳 {paymentNote}
          </p>
        )}
      </section>

      {/* Datos del cliente — nombre y teléfono, nada más. */}
      <form onSubmit={onSubmit} className="mt-6">
        <label htmlFor="cart-name" className="block text-sm text-muted">
          Nombre
        </label>
        <input
          id="cart-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          enterKeyHint="next"
          className="field"
          placeholder="Tu nombre"
        />

        <label htmlFor="cart-phone" className="mt-4 block text-sm text-muted">
          Teléfono
        </label>
        <input
          id="cart-phone"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          maxLength={30}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="done"
          className="field"
          placeholder="11 5555-5555"
        />

        <label htmlFor="cart-note" className="mt-4 block text-sm text-muted">
          Comentario <span className="text-muted/70">(opcional)</span>
        </label>
        <textarea
          id="cart-note"
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          className="field field-area"
          placeholder="Zona de entrega, horario, lo que quieras aclarar"
        />

        {error && (
          <p
            role="alert"
            className="form-error"
          >
            {error}
          </p>
        )}

        {/*
          El botón va acá, al final del formulario, y no en una barra fija
          abajo como el resto de la app. Dos razones concretas de celular:
          el teclado virtual tapa las barras fijas justo cuando el cliente
          termina de escribir el teléfono, y el borde inferior está ocupado
          por el widget de Retell y el botón de WhatsApp (decisión 38).
          Acá queda igual en la zona del pulgar, justo debajo del último campo.
        */}
        <button
          type="submit"
          disabled={sending}
          className="btn-send"
        >
          {sending ? (
            "Enviando pedido…"
          ) : (
            <>
              <WhatsAppIcon />
              Enviar pedido por WhatsApp
            </>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-muted">
          Guardamos el pedido y te abrimos el chat con todo escrito. No se paga
          nada acá.
        </p>
      </form>

      <p className="mt-6 text-center">
        <a
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tap inline-flex h-11 items-center text-sm text-muted underline underline-offset-4"
        >
          ¿Preferís preguntar antes? Escribinos
        </a>
      </p>
    </div>
  );
}
