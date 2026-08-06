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
      <div className="price-card">
        <p className="eyebrow">Sin cotización</p>
        <p className="price-figure mono">Consultar</p>
        <p className="price-ref">Escribinos por WhatsApp y te lo pasamos al instante.</p>
      </div>
    );
  }

  const price = buildPrice(priceUsd, usdRate, discountPct);

  if (compact) {
    return (
      <div>
        <p className="price-compact mono">{price.formatted.ars}</p>
        {price.hasDiscount && (
          <p className="price-compact-transf mono">
            {price.formatted.transferArs} con transferencia
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="price-card">
      <p className="eyebrow">Precio de contado</p>

      <p className="price-figure mono">{price.formatted.ars}</p>
      <p className="price-ref mono">{price.formatted.usd} · referencia</p>

      {/* Sin ahorro real no se muestra nada: ver PriceView.hasDiscount */}
      {price.hasDiscount && (
        <>
          <div className="price-rule" />

          <div className="price-badge-row">
            <span className="price-badge mono">−{price.discountPct}%</span>
            <span className="price-badge-l">con transferencia</span>
          </div>
          <p className="price-transf mono">{price.formatted.transferArs}</p>
          <p className="price-save mono">ahorrás {price.formatted.savingsArs}</p>
        </>
      )}

      {paymentNote && (
        <>
          <div className="price-rule" />
          <p className="price-pay">
            <span aria-hidden className="price-pay-icon">
              <CardIcon className="h-3.5 w-3.5" />
            </span>
            <span>{paymentNote}</span>
          </p>
        </>
      )}
    </div>
  );
}
