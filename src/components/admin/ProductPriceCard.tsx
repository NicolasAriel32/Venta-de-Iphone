"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { savePrices, type ActionState } from "@/app/admin/actions";
import { formatArs, formatCapacity, usdToArs } from "@/lib/pricing";
import { STOCK_LABEL } from "@/lib/supabase/types";
import type { AdminProduct } from "@/lib/admin";

/**
 * Ficha editable de un producto.
 *
 * REGLA DURA (CLAUDE.md §4, decisión 03): **el precio se carga en USD**. En
 * la base nunca hay un precio en pesos. Lo que se ve al lado del input es el
 * peso calculado con la cotización de hoy — informativo, no editable. Si
 * fuera al revés, cada cambio del dólar dejaría los 42 precios viejos, que es
 * exactamente el dolor que este proyecto existe para resolver.
 *
 * Y la capacidad define el precio, no el color: por eso un iPhone muestra una
 * fila por capacidad y un cargador una sola.
 */

const INITIAL: ActionState = { ok: true, message: "" };

/** Acepta "1.250,50" y "1250.5" por igual. Devuelve NaN si no es un número. */
function toNumber(raw: string): number {
  return Number(raw.trim().replace(/\./g, "").replace(",", "."));
}

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!dirty || pending}
      className="btn-amber w-full"
    >
      {pending ? "Guardando…" : dirty ? "Guardar" : "Sin cambios"}
    </button>
  );
}

/** Una línea: etiqueta, input en USD y el peso resultante. */
function PriceRow({
  id,
  label,
  sub,
  value,
  onChange,
  usdRate,
}: {
  id: string;
  label: string;
  sub?: string;
  value: string;
  onChange: (v: string) => void;
  usdRate: number;
}) {
  const usd = toNumber(value);
  const ars = Number.isFinite(usd) && usd > 0 ? usdToArs(usd, usdRate) : 0;

  return (
    <div className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
      <div className="w-20 shrink-0">
        <p className="text-sm font-semibold text-paper">{label}</p>
        {sub && <p className="text-[11px] text-muted">{sub}</p>}
      </div>

      <div className="relative w-28 shrink-0">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted">
          USD
        </span>
        <label htmlFor={`price_${id}`} className="sr-only">
          Precio en dólares de {label}
        </label>
        <input
          id={`price_${id}`}
          name={`price_${id}`}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="price-input h-12 w-full rounded-lg border border-line bg-ink pr-2 pl-11 text-right text-paper outline-none focus:border-accent"
        />
      </div>

      {/* El peso se recalcula mientras se tipea: el dueño ve el número que va
          a ver el cliente antes de guardar. */}
      <p
        aria-live="polite"
        className="usd-value min-w-0 flex-1 truncate text-right text-sm text-muted"
      >
        {ars > 0 ? formatArs(ars) : "—"}
      </p>
    </div>
  );
}

export default function ProductPriceCard({
  product,
  usdRate,
}: {
  product: AdminProduct;
  usdRate: number;
}) {
  const [state, formAction] = useActionState(savePrices, INITIAL);

  // Los precios que ve el formulario, indexados por el id del campo. Para un
  // producto sin capacidades, la única clave es la del propio producto.
  const fromDb: Record<string, string> =
    product.capacities.length > 0
      ? Object.fromEntries(
          product.capacities.map((c) => [c.id, String(c.price_usd)]),
        )
      : { [product.id]: String(product.price_usd) };

  const [draft, setDraft] = useState(fromDb);

  /**
   * Contra qué se compara para saber si hay cambios sin guardar.
   *
   * Se **deriva**, no se sincroniza con un `setState` dentro de un efecto:
   * es el precio que vino de la base, o el que devolvió el último guardado
   * exitoso. Es la misma corrección que se hizo en F4 con el selector de
   * variante, y por el mismo motivo — un efecto que copia estado a estado
   * dispara renders en cascada y se desincroniza en el peor momento.
   */
  const baseline: Record<string, string> =
    state.ok && state.values
      ? Object.fromEntries(
          Object.entries(state.values).map(([k, v]) => [k, String(v)]),
        )
      : fromDb;

  // "Sin cambios" tiene que ser verdad, o el botón deja de significar algo.
  const dirty = Object.keys(baseline).some((k) => draft[k] !== baseline[k]);

  return (
    <form action={formAction} className="admin-card p-4" data-dirty={dirty}>
      <input type="hidden" name="productId" value={product.id} />

      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="admin-prod-nm truncate">
            {product.name}
          </p>
          <p className="truncate text-[11px] text-muted">
            {product.category_name} · {product.sku}
          </p>
        </div>
        {!product.is_active && (
          <span className="admin-flag mono">
            Pausado
          </span>
        )}
      </div>

      {product.capacities.length > 0 ? (
        product.capacities.map((cap) => (
          <PriceRow
            key={cap.id}
            id={cap.id}
            label={formatCapacity(cap.capacity_gb)}
            sub={STOCK_LABEL[cap.stock_status]}
            value={draft[cap.id] ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, [cap.id]: v }))}
            usdRate={usdRate}
          />
        ))
      ) : (
        <PriceRow
          id={product.id}
          label="Precio"
          sub={STOCK_LABEL[product.stock_status]}
          value={draft[product.id] ?? ""}
          onChange={(v) => setDraft((d) => ({ ...d, [product.id]: v }))}
          usdRate={usdRate}
        />
      )}

      <div className="mt-3">
        <SaveButton dirty={dirty} />
      </div>

      {state.message && (
        <p
          // La `key` reinicia la animación del pulso. Se arma con el
          // contenido y no con un contador: dos guardados seguidos no pueden
          // tener los mismos valores, porque después de guardar el botón
          // queda deshabilitado hasta que se toque algo.
          key={`${state.message}:${JSON.stringify(state.values ?? "")}`}
          role="status"
          className={`mt-2 rounded-lg py-1 text-center text-xs ${
            state.ok ? "just-saved text-ok" : "text-warn"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
