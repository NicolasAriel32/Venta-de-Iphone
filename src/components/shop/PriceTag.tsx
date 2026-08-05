import { buildPrice } from "@/lib/pricing";
import { CardIcon } from "@/components/ui/icons";

/**
 * ELEMENTO FIRMA (CLAUDE.md §3).
 *
 * El **peso es el número grande**: es lo que el comprador va a pagar y lo
 * que la normativa argentina espera ver exhibido. El dólar va abajo, en
 * chico, como referencia de cómo está cargado el producto.
 *
 * El peso no lo carga nadie a mano: el producto se guarda en USD y la
 * cotización se trae sola del blue (`lib/exchange.ts`), así que el catálogo
 * queda al día sin trabajo manual.
 *
 * Alto reservado: al cambiar de capacidad el precio cambia, y si el
 * contenedor no tiene altura mínima el layout salta. Eso está prohibido.
 */
export default function PriceTag({
  priceUsd,
  usdRate,
  discountPct,
  paymentNote,
  compact = false,
}: {
  priceUsd: number;
  usdRate: number;
  discountPct: number;
  paymentNote?: string;
  compact?: boolean;
}) {
  // Sin cotización no hay peso posible, y mostrar un precio calculado con
  // un número inventado es peor que no mostrar ninguno.
  if (!usdRate) {
    return (
      <div className="price-card p-5">
        <p className="text-sm text-paper">No pudimos cargar el precio.</p>
        <p className="mt-1 text-sm text-muted">
          Escribinos por WhatsApp y te lo pasamos al instante.
        </p>
      </div>
    );
  }

  const price = buildPrice(priceUsd, usdRate, discountPct);

  if (compact) {
    return (
      <div>
        <p className="price-figure font-display text-xl leading-none font-extrabold text-paper">
          {price.formatted.ars}
        </p>
        {price.hasDiscount && (
          <p className="mt-1 text-xs font-medium text-ok">
            {price.formatted.transferArs} con transferencia
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="price-card min-h-[216px] p-5">
      <span className="hero-kicker">Precio de contado</span>

      <p className="price-figure font-display mt-1 text-5xl leading-none font-extrabold tracking-tight text-paper">
        {price.formatted.ars}
      </p>
      <p className="mt-2 text-sm text-muted">{price.formatted.usd} · referencia</p>

      {/* Sin ahorro real no se muestra nada: ver PriceView.hasDiscount */}
      {price.hasDiscount && (
        <>
          <div className="my-4 h-px bg-line" />

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-bold tracking-wide text-ok uppercase">
              −{price.discountPct}%
            </span>
            <span className="text-xs text-muted">con transferencia</span>
          </div>
          <p className="price-figure font-display mt-1.5 text-3xl leading-none font-extrabold text-ok">
            {price.formatted.transferArs}
          </p>
          <p className="mt-1.5 text-sm text-muted">
            ahorrás {price.formatted.savingsArs}
          </p>
        </>
      )}

      {paymentNote && (
        <>
          <div className="my-4 h-px bg-line" />
          <p className="flex items-start gap-2.5 text-sm text-paper">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
            >
              <CardIcon className="h-3.5 w-3.5" />
            </span>
            <span>{paymentNote}</span>
          </p>
        </>
      )}
    </div>
  );
}
