"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import PriceTag from "./PriceTag";
import StockBadge from "./StockBadge";
import { WhatsAppIcon } from "@/components/ui/icons";
import { imageUrl } from "@/lib/images";
import { defaultCapacity, effectiveStock, formatCapacity } from "@/lib/pricing";
import { inquiryMessage, outOfStockMessage, whatsappUrl } from "@/lib/whatsapp";
import { trackWhatsApp } from "@/lib/analytics";
import { useCart } from "@/store/cart";
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

/** Nunca hay nada a qué suscribirse: esto no cambia después de hidratar. */
const neverChanges = () => () => {};

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

  /**
   * Lo que el usuario tocó. `null` = todavía no tocó nada y manda la URL.
   */
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [pickedCapacity, setPickedCapacity] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const addToCart = useCart((s) => s.add);

  /**
   * `false` en el HTML del servidor y durante la hidratación; `true` después.
   *
   * La variante de la URL no se puede leer en el servidor: si la página
   * leyera `searchParams`, Next la volvería dinámica y perdería el ISR
   * (decisión 26). Y si el primer render del cliente ya usara la URL, no
   * coincidiría con el HTML del servidor y React tiraría un error de
   * hidratación. Con esto, el link pegado en WhatsApp con
   * `?color=negro&cap=256` abre en la variante correcta un frame después.
   */
  const hydrated = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );

  const urlParams = hydrated ? new URLSearchParams(window.location.search) : null;

  // La selección se DERIVA: lo que tocó el usuario, si no lo que dice la URL,
  // si no el default (primer color activo y capacidad más chica con stock).
  // Derivarlo evita el efecto que antes sincronizaba estas tres fuentes a
  // fuerza de `setState`, que encadenaba renders.
  const urlColor = urlParams?.get("color");
  const colorSlug =
    pickedColor ??
    colors.find((c) => c.slug === urlColor)?.slug ??
    colors[0]?.slug ??
    "";

  const urlCap = urlParams?.get("cap");
  const capacityId =
    pickedCapacity ??
    capacities.find((c) => String(c.capacity_gb) === urlCap)?.id ??
    defaultCapacity(capacities)?.id ??
    "";

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
  // Se corrige en el propio render y no en un efecto: en un efecto, el usuario
  // llega a ver un frame con la foto del color anterior antes del reajuste.
  const [indexColor, setIndexColor] = useState(colorSlug);
  if (indexColor !== colorSlug) {
    setIndexColor(colorSlug);
    setImageIndex(0);
  }

  // Reflejar la variante en la URL sin recargar ni ensuciar el historial.
  // Este SÍ es un efecto legítimo: escribe en un sistema externo (el
  // historial del navegador), no sincroniza estado de React contra estado.
  useEffect(() => {
    if (!hydrated) return;
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
  }, [colorSlug, selectedCapacity, hydrated]);

  const priceUsd = selectedCapacity?.price_usd ?? product.min_price_usd;
  const stock = effectiveStock(product.stock_status, selectedCapacity);
  const isOut = stock === "out_of_stock";

  const variantLabel = [
    selectedColor?.name,
    selectedCapacity ? formatCapacity(selectedCapacity.capacity_gb) : null,
  ]
    .filter(Boolean)
    .join(", ");

  // Los mensajes viven en lib/whatsapp.ts, no escritos acá: es el canal por
  // el que se cierra la venta y tiene que sonar igual en toda la tienda.
  const waMessage = isOut
    ? outOfStockMessage(product.name, variantLabel)
    : inquiryMessage(product.name, variantLabel);

  const waHref = whatsappUrl(whatsappNumber, waMessage);

  const current = gallery[imageIndex] ?? gallery[0] ?? null;
  const currentSrc = imageUrl(current?.storage_path);

  /**
   * Agrega la VARIANTE, no el producto (CLAUDE.md §4): la clave del ítem es
   * producto + capacidad + color, así que dos capacidades del mismo modelo
   * son dos líneas distintas del carrito.
   *
   * Se guarda el precio en USD, no en pesos: el peso lo calcula el carrito
   * con la cotización del momento en que se mira, y recién se congela cuando
   * se confirma el pedido.
   */
  function handleAdd() {
    addToCart({
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      // La foto del color elegido, para que la línea del carrito coincida
      // con lo que el cliente vio en la galería.
      coverPath: current?.storage_path ?? product.cover_path,
      colorId: selectedColor?.id ?? null,
      colorName: selectedColor?.name ?? null,
      capacityId: selectedCapacity?.id ?? null,
      capacityGb: selectedCapacity?.capacity_gb ?? null,
      priceUsd,
      discountPct: product.discount_transfer_pct,
    });
  }

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
                  onClick={() => setPickedColor(c.slug)}
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
                  onClick={() => setPickedCapacity(c.id)}
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
              onClick={handleAdd}
              className="h-12 flex-1 rounded-lg bg-accent text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              Agregar al carrito
            </button>
          )}

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Consultar por WhatsApp"
            // Con el producto, para que el panel pueda decir cuál es el que
            // más consultas genera y no solo cuántas hubo.
            onClick={() => trackWhatsApp("detail", product.id)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white"
          >
            <WhatsAppIcon />
          </a>
        </div>
      </div>
    </>
  );
}
