"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import PriceTag from "./PriceTag";
import StockBadge from "./StockBadge";
import { WhatsAppIcon } from "@/components/ui/icons";
import { imageUrl } from "@/lib/images";
import { defaultCapacity, effectiveStock, formatCapacity } from "@/lib/pricing";
import type { ProductDetail } from "@/lib/supabase/types";

/**
 * Selectores de variante + galería + ficha de precio.
 *
 * Reglas (SPEC.md FC-2):
 *   · El color cambia la GALERÍA. El precio no se mueve.
 *   · La capacidad cambia el PRECIO y el stock. La galería no se mueve.
 *   · Todo es instantáneo y local: las variantes ya vinieron en el payload,
 *     no se va al servidor y no hay spinner.
 *   · La variante se refleja en la URL sin recargar, para que un link
 *     pegado en WhatsApp abra el color y la capacidad correctos.
 *   · Sin salto de layout: la galería y la ficha tienen altura reservada.
 */
export default function ProductVariants({
  product,
  usdRate,
  paymentNote,
  whatsappNumber,
}: {
  product: ProductDetail;
  usdRate: number;
  paymentNote: string;
  whatsappNumber: string;
}) {
  const colors = product.allColors;
  const capacities = product.capacities;

  // Estado inicial: primer color activo y capacidad más chica con stock.
  const [colorSlug, setColorSlug] = useState(() => colors[0]?.slug ?? "");
  const [capacityId, setCapacityId] = useState(
    () => defaultCapacity(capacities)?.id ?? "",
  );

  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  // Hasta no haber leído la URL, no se pisa la URL con el estado por defecto.
  const [urlRead, setUrlRead] = useState(false);

  /**
   * Lee la variante de la URL al montar.
   *
   * Se hace acá y no en el servidor a propósito: si la página leyera
   * searchParams, Next la volvería dinámica y perdería el ISR. Un link
   * pegado en WhatsApp con ?color=negro&cap=256 abre igual en la variante
   * correcta, apenas un frame después.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const wantedColor = params.get("color");
    if (wantedColor) {
      const match = colors.find((c) => c.slug === wantedColor);
      if (match) setColorSlug(match.slug);
    }

    const wantedCap = params.get("cap");
    if (wantedCap) {
      const match = capacities.find((c) => String(c.capacity_gb) === wantedCap);
      if (match) setCapacityId(match.id);
    }

    setUrlRead(true);
    // Solo al montar: después manda el estado, no la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedColor = colors.find((c) => c.slug === colorSlug) ?? null;
  const selectedCapacity = capacities.find((c) => c.id === capacityId) ?? null;

  /**
   * Galería filtrada por color.
   * `color_id = NULL` es "imagen general, se muestra siempre". Si el color
   * elegido no tiene imágenes propias, se cae a las generales sin romper.
   */
  const gallery = useMemo(() => {
    if (!selectedColor) return product.images;
    const own = product.images.filter((i) => i.color_id === selectedColor.id);
    if (own.length) return own;
    return product.images.filter((i) => i.color_id === null);
  }, [product.images, selectedColor]);

  // Al cambiar de color, volver a la primera foto de ese color.
  useEffect(() => {
    setImageIndex(0);
  }, [colorSlug]);

  // Reflejar la variante en la URL sin recargar ni ensuciar el historial.
  useEffect(() => {
    if (!urlRead) return;
    const params = new URLSearchParams(window.location.search);
    if (colorSlug) params.set("color", colorSlug);
    else params.delete("color");

    if (selectedCapacity) params.set("cap", String(selectedCapacity.capacity_gb));
    else params.delete("cap");

    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
  }, [colorSlug, selectedCapacity, urlRead]);

  const priceUsd = selectedCapacity?.price_usd ?? product.min_price_usd;
  const stock = effectiveStock(product.stock_status, selectedCapacity);
  const isOut = stock === "out_of_stock";

  const variantLabel = [
    selectedColor?.name,
    selectedCapacity ? formatCapacity(selectedCapacity.capacity_gb) : null,
  ]
    .filter(Boolean)
    .join(", ");

  const waMessage = isOut
    ? `Hola! ¿Tenés el ${product.name}${variantLabel ? ` (${variantLabel})` : ""}? Me aparece sin stock.`
    : `Hola! Me interesa el ${product.name}${variantLabel ? ` (${variantLabel})` : ""}. ¿Está disponible?`;

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;

  const current = gallery[imageIndex] ?? gallery[0] ?? null;
  const currentSrc = imageUrl(current?.storage_path);

  return (
    <>
      {/* Galería — altura fija para que cambiar de color no mueva el layout */}
      <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface">
        {currentSrc ? (
          <Image
            src={currentSrc}
            alt={current?.alt || `${product.name} ${variantLabel}`.trim()}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-contain"
          />
        ) : (
          <div
            role="img"
            aria-label={product.name}
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-line/60 to-surface p-6 text-center"
          >
            <span className="font-display text-xs tracking-[0.2em] text-muted uppercase">
              {product.brand}
            </span>
            <span className="font-display text-xl leading-tight font-bold text-muted/80">
              {product.name}
            </span>
          </div>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {gallery.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setImageIndex(i)}
              aria-label={`Ver imagen ${i + 1} de ${gallery.length}`}
              aria-current={i === imageIndex}
              className="tap flex h-11 w-11 items-center justify-center"
            >
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === imageIndex ? "bg-accent" : "bg-line"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Selector de COLOR — cambia la galería, no el precio */}
      {colors.length > 1 && (
        <section className="mt-6">
          <h2 className="text-sm text-muted">
            Color: <span className="text-paper">{selectedColor?.name}</span>
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {colors.map((c) => {
              const active = c.slug === colorSlug;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorSlug(c.slug)}
                  aria-pressed={active}
                  aria-label={c.name}
                  title={c.name}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
                    active ? "border-accent" : "border-line"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-7 w-7 rounded-full ring-1 ring-black/20"
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Selector de CAPACIDAD — cambia el precio y el stock, no la galería */}
      {capacities.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm text-muted">Capacidad</h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {capacities.map((c) => {
              const active = c.id === capacityId;
              const unavailable = c.stock_status === "out_of_stock";
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCapacityId(c.id)}
                  aria-pressed={active}
                  className={`flex h-11 items-center rounded-lg border px-4 text-sm transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-paper"
                      : "border-line text-muted hover:text-paper"
                  } ${unavailable ? "line-through opacity-50" : ""}`}
                >
                  {formatCapacity(c.capacity_gb)}
                </button>
              );
            })}
          </div>
          {/* Las opciones sin stock se muestran atenuadas, NO se ocultan:
              que el cliente vea que existen es parte de la venta. */}
        </section>
      )}

      {/* Ficha de precio — elemento firma */}
      <section className="mt-6">
        <PriceTag
          priceUsd={priceUsd}
          usdRate={usdRate}
          discountPct={product.discount_transfer_pct}
          paymentNote={paymentNote}
        />
      </section>

      <div className="mt-4">
        <StockBadge status={stock} />
      </div>

      {/* Barra fija de acción — zona del pulgar */}
      <div
        className="product-action-bar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 backdrop-blur-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          {isOut ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 flex-1 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white"
            >
              Consultar disponibilidad
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                // TODO F4: acá va addItem() del store de Zustand con
                // product_id + capacity_id + color_id como clave del ítem.
                setAdded(true);
                setTimeout(() => setAdded(false), 2200);
              }}
              className="h-12 flex-1 rounded-lg bg-accent text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              {added ? "Agregado ✓" : "Agregar al carrito"}
            </button>
          )}

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Consultar por WhatsApp"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white"
          >
            <WhatsAppIcon />
          </a>
        </div>
      </div>

      {added && (
        <p role="status" className="mt-3 text-sm text-ok">
          Agregado. El carrito se conecta en la próxima fase.
        </p>
      )}
    </>
  );
}
