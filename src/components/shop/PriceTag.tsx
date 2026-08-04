import { buildPrice } from "@/lib/pricing";

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
      <div className="rounded-2xl border border-line bg-surface p-5">
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
        <p className="font-display text-xl leading-none font-bold text-paper">
          {price.formatted.ars}
        </p>
        {price.hasDiscount && (
          <p className="mt-1 text-xs text-ok">
            {price.formatted.transferArs} con transferencia
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[196px] rounded-2xl border border-line bg-surface p-5">
      <p className="font-display text-4xl leading-none font-bold tracking-tight text-paper">
        {price.formatted.ars}
      </p>
      <p className="mt-1.5 text-sm text-muted">{price.formatted.usd}</p>

      {/* Sin ahorro real no se muestra nada: ver PriceView.hasDiscount */}
      {price.hasDiscount && (
        <>
          <div className="my-4 h-px bg-line" />

          <p className="font-display text-2xl leading-none font-bold text-ok">
            {price.formatted.transferArs}
          </p>
          <p className="mt-1.5 text-sm text-muted">
            con transferencia · {price.discountPct}% off · ahorrás{" "}
            {price.formatted.savingsArs}
          </p>
        </>
      )}

      {paymentNote && (
        <>
          <div className="my-4 h-px bg-line" />
          <p className="flex items-start gap-2 text-sm text-paper">
            <span aria-hidden>💳</span>
            <span>{paymentNote}</span>
          </p>
        </>
      )}
    </div>
  );
}
