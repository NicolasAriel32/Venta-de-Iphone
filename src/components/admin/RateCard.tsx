"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRate, type ActionState } from "@/app/admin/actions";
import { formatArs } from "@/lib/pricing";
import type { RateMode } from "@/lib/supabase/types";

/**
 * Cotización del dólar — el campo más importante de todo el sistema.
 *
 * Es el clímax de la demo (§6 F5): se cambia acá, se vuelve a la tienda y
 * los 42 productos ya están repreciados. La Server Action revalida el
 * catálogo entero, así que no hay que esperar el ISR de 60 s.
 *
 * Dos modos (decisión 33):
 *   Automática → el blue de dolarapi. El dueño no toca nada nunca más.
 *   Manual     → él fija el número. Existe para cuando el dólar se dispara
 *                y quiere quedarse quieto un día, y porque sin ese control
 *                la demo no tiene un botón que apretar.
 *
 * ⚠️ Por qué NO usa `useActionState` como el resto de los formularios del
 * panel: guardar la cotización cambia el precio de **toda la pantalla** —el
 * número grande de acá arriba y los 42 previos en pesos de la lista de
 * abajo—, y esos datos los calculó el servidor. Hace falta un
 * `router.refresh()` después de guardar, y `useActionState` no avisa cuándo
 * terminó. Con `useTransition` la acción se llama a mano y el refresh sale
 * en el mismo bloque, sin efectos que sincronicen estado (misma corrección
 * que se hizo en F4).
 */

const INITIAL: ActionState = { ok: true, message: "" };

export default function RateCard({
  mode,
  manualRate,
  resolvedRate,
  originLabel,
}: {
  mode: RateMode;
  /** `store_config.usd_rate`: el número que manda cuando el modo es manual. */
  manualRate: number;
  /** El que la tienda está usando ahora mismo, ya resuelto por `exchange.ts`. */
  resolvedRate: number;
  originLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>(INITIAL);
  const [selected, setSelected] = useState<RateMode>(mode);
  const [draft, setDraft] = useState(String(manualRate));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveRate(INITIAL, formData);
      setState(result);
      // Vuelve a pedir la pantalla al servidor: es lo único que actualiza
      // los precios en pesos de la lista de abajo, que se calcularon allá.
      if (result.ok) router.refresh();
    });
  }

  const saveLabel = selected === "manual" ? "Guardar" : "Pasar a automática";

  return (
    <section className="rate-card p-5">
      <h2 className="metric-label">Cotización del dólar</h2>

      {/* La cifra más grande del panel, y a propósito: es el número del que
          dependen los otros 42. */}
      <p
        className={`rate-value mt-2 ${
          resolvedRate > 0 ? "text-paper" : "text-muted"
        }`}
      >
        {resolvedRate > 0 ? formatArs(resolvedRate) : "Sin cotización"}
      </p>
      <p className="mt-2 text-xs text-muted">{originLabel}</p>

      <form action={handleSubmit} className="mt-4">
        {/* Un radio group de verdad, no dos botones que fingen serlo: así el
            teclado y el lector de pantalla lo entienden sin ayuda. */}
        <fieldset disabled={pending}>
          <legend className="sr-only">Modo de cotización</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["auto", "manual"] as const).map((value) => (
              <label
                key={value}
                className={`flex h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                  selected === value
                    ? "border-accent bg-accent/10 text-paper"
                    : "border-line text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={value}
                  checked={selected === value}
                  onChange={() => setSelected(value)}
                  className="sr-only"
                />
                {value === "auto" ? "Automática" : "Manual"}
              </label>
            ))}
          </div>
        </fieldset>

        {selected === "manual" ? (
          <div className="mt-3 flex gap-2">
            <label htmlFor="rate" className="sr-only">
              Cotización en pesos por dólar
            </label>
            <input
              id="rate"
              name="rate"
              // `decimal` y no `numeric`: en iOS abre el teclado con la coma,
              // que es como se escribe un decimal acá.
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={pending}
              className="price-input h-12 w-full rounded-lg border border-line bg-ink px-3 text-paper outline-none focus:border-accent"
            />
            <SaveButton pending={pending} label={saveLabel} />
          </div>
        ) : (
          <div className="mt-3">
            <p className="mb-3 text-xs text-muted">
              Se toma el dólar blue (venta) todos los días. No hay que tocar
              nada.
            </p>
            {/* Solo si hay algo que cambiar: guardar "automática" estando ya
                en automática no haría nada. */}
            {mode !== "auto" && (
              <SaveButton pending={pending} label={saveLabel} />
            )}
          </div>
        )}

        {state.message && (
          <p
            role="status"
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              state.ok
                ? "border border-ok/40 bg-ok/10 text-ok"
                : "border border-warn/40 bg-warn/10 text-warn"
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}

function SaveButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 shrink-0 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}
