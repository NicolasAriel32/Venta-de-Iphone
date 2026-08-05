/**
 * pricing.ts — conversión USD → ARS, descuentos y formato.
 *
 * Es el módulo que resuelve el dolor #1 del rubro: el precio se carga una
 * sola vez en USD y todo el catálogo se actualiza cambiando la cotización.
 *
 * Reglas duras (CLAUDE.md §4 y SPEC.md §6):
 *   · El precio NUNCA se guarda en ARS. Se guarda en USD y se convierte
 *     en cada render con la cotización vigente.
 *   · **El peso es el número que se publica.** El USD va abajo, en chico,
 *     como referencia de cómo está cargado el producto.
 *   · La cotización se trae sola del dólar blue (ver `lib/exchange.ts`),
 *     así que el peso queda al día sin que nadie toque nada.
 *   · El redondeo es HACIA ARRIBA, tanto al millar en pesos como al dólar
 *     entero. Nadie publica precios con unidades en este rubro, y redondear
 *     para abajo es regalar plata.
 *   · La capacidad define el precio. El color no.
 */

import type { ProductCapacity, StockStatus } from "./supabase/types";

/** Redondea hacia arriba al millar. 1.841.240 → 1.842.000 */
export function roundToThousand(amount: number): number {
  return Math.ceil(amount / 1000) * 1000;
}

/** Convierte USD a ARS aplicando la cotización y el redondeo. */
export function usdToArs(priceUsd: number, usdRate: number): number {
  if (!Number.isFinite(priceUsd) || !Number.isFinite(usdRate) || usdRate <= 0) {
    return 0;
  }
  return roundToThousand(priceUsd * usdRate);
}

/** Aplica el descuento por transferencia sobre un precio ya en ARS. */
export function transferPrice(priceArs: number, discountPct: number): number {
  const pct = Math.min(Math.max(discountPct, 0), 90);
  return roundToThousand(priceArs * (1 - pct / 100));
}

/** Redondea hacia arriba al dólar entero. USD 1.139,05 → USD 1.140 */
export function roundUsd(amount: number): number {
  return Math.ceil(amount);
}

/** El mismo descuento por transferencia, pero en dólares. */
export function transferPriceUsd(priceUsd: number, discountPct: number): number {
  const pct = Math.min(Math.max(discountPct, 0), 90);
  return roundUsd(priceUsd * (1 - pct / 100));
}

/**
 * Formatea en pesos: `$ 1.842.000`
 * Separador de miles con punto, sin decimales, espacio después del signo.
 */
export function formatArs(amount: number): string {
  const n = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount));
  return `$ ${n}`;
}

/** Formatea la referencia en dólares: `USD 1.199` */
export function formatUsd(amount: number): string {
  const n = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `USD ${n}`;
}

/** Formatea la capacidad: 1024 → `1 TB`, 256 → `256 GB` */
export function formatCapacity(gb: number): string {
  if (gb >= 1024 && gb % 1024 === 0) {
    return `${gb / 1024} TB`;
  }
  return `${gb} GB`;
}

// ---------------------------------------------------------------------------

export type PriceView = {
  /** PRINCIPAL: precio de lista en pesos, a la cotización vigente. */
  ars: number;
  /** PRINCIPAL: precio en pesos con descuento por transferencia. */
  transferArs: number;
  /** Referencia: cómo está cargado el producto. */
  usd: number;
  /** Referencia: el de transferencia en dólares. */
  transferUsd: number;
  /** Cuánto se ahorra pagando por transferencia, en pesos. */
  savingsArs: number;
  /**
   * Si el ahorro real es 0, NO hay que mostrar el bloque de transferencia.
   *
   * Pasa en los productos baratos, donde el redondeo se come el descuento.
   * Mostrar "ahorrás $ 0" se lee como un error, no como una oferta.
   */
  hasDiscount: boolean;
  discountPct: number;
  /** Texto listo para renderizar. */
  formatted: {
    ars: string;
    transferArs: string;
    usd: string;
    transferUsd: string;
    savingsArs: string;
  };
};

/**
 * Arma la ficha de precio completa a partir de un precio en USD.
 *
 * El peso es el número que se publica; el dólar queda como referencia de
 * cómo está cargado el producto.
 */
export function buildPrice(
  priceUsd: number,
  usdRate: number,
  discountPct: number,
): PriceView {
  const ars = usdToArs(priceUsd, usdRate);
  const transferArs = transferPrice(ars, discountPct);
  const savingsArs = ars - transferArs;

  return {
    ars,
    transferArs,
    usd: priceUsd,
    transferUsd: transferPriceUsd(priceUsd, discountPct),
    savingsArs,
    hasDiscount: savingsArs > 0,
    discountPct,
    formatted: {
      ars: formatArs(ars),
      transferArs: formatArs(transferArs),
      usd: formatUsd(priceUsd),
      transferUsd: formatUsd(transferPriceUsd(priceUsd, discountPct)),
      savingsArs: formatArs(savingsArs),
    },
  };
}

/**
 * Precio que muestra el LISTADO.
 *
 * Con capacidades → `Desde $X` con el mínimo.
 * Sin capacidades → el precio a secas.
 * El dólar va aparte, en la línea chica de abajo.
 */
export function listPrice(
  minPriceUsd: number,
  usdRate: number,
  hasCapacities: boolean,
): { label: string; ars: number; usd: number; usdLabel: string } {
  const ars = usdToArs(minPriceUsd, usdRate);
  const arsLabel = formatArs(ars);

  return {
    ars,
    usd: minPriceUsd,
    label: hasCapacities ? `Desde ${arsLabel}` : arsLabel,
    usdLabel: formatUsd(minPriceUsd),
  };
}

/**
 * Elige la capacidad preseleccionada al entrar al detalle: la más chica
 * que tenga stock. Si ninguna tiene, la más chica de todas — el cliente
 * tiene que ver un precio igual, y el botón pasa a "Consultar".
 */
export function defaultCapacity(
  capacities: ProductCapacity[],
): ProductCapacity | null {
  const active = capacities
    .filter((c) => c.is_active)
    .sort((a, b) => a.capacity_gb - b.capacity_gb);

  if (active.length === 0) return null;
  return active.find((c) => c.stock_status === "in_stock") ?? active[0];
}

/** El stock que corresponde mostrar según haya o no capacidades. */
export function effectiveStock(
  productStock: StockStatus,
  selected: ProductCapacity | null,
): StockStatus {
  return selected ? selected.stock_status : productStock;
}

// ------------------------------------------------------------------ carrito

/**
 * Una línea del carrito, en la unidad en la que se guarda: USD.
 *
 * El carrito NO guarda pesos. Guarda el USD del producto y la conversión se
 * hace en cada render con la cotización vigente, igual que el catálogo. Si
 * guardara pesos, un carrito abandonado ayer mostraría el precio de ayer
 * mientras la ficha del mismo producto muestra el de hoy.
 *
 * El descuento por transferencia es POR PRODUCTO (`discount_transfer_pct`),
 * no global: un accesorio y un iPhone pueden tener porcentajes distintos.
 */
export type CartLineInput = {
  priceUsd: number;
  discountPct: number;
  quantity: number;
};

export type CartLineTotals = {
  unitArs: number;
  unitTransferArs: number;
  subtotalArs: number;
  subtotalTransferArs: number;
};

/**
 * Totales de una línea.
 *
 * El descuento se aplica al precio UNITARIO y recién después se multiplica
 * por la cantidad. Al revés, el total de transferencia no coincidiría con
 * el precio unitario que muestra esa misma línea en pantalla.
 */
export function lineTotals(line: CartLineInput, usdRate: number): CartLineTotals {
  const qty = Math.max(1, Math.trunc(line.quantity));
  const unitArs = usdToArs(line.priceUsd, usdRate);
  const unitTransferArs = transferPrice(unitArs, line.discountPct);

  return {
    unitArs,
    unitTransferArs,
    subtotalArs: unitArs * qty,
    subtotalTransferArs: unitTransferArs * qty,
  };
}

export type CartTotals = {
  totalArs: number;
  transferArs: number;
  savingsArs: number;
  /** Sin ahorro real no se muestra el bloque de transferencia (SPEC.md §6). */
  hasDiscount: boolean;
  /** Unidades, no líneas: es lo que va en el globito del header. */
  itemCount: number;
};

export function cartTotals(lines: CartLineInput[], usdRate: number): CartTotals {
  let totalArs = 0;
  let transferArs = 0;
  let itemCount = 0;

  for (const line of lines) {
    const t = lineTotals(line, usdRate);
    totalArs += t.subtotalArs;
    transferArs += t.subtotalTransferArs;
    itemCount += Math.max(1, Math.trunc(line.quantity));
  }

  const savingsArs = totalArs - transferArs;
  return {
    totalArs,
    transferArs,
    savingsArs,
    hasDiscount: savingsArs > 0,
    itemCount,
  };
}
