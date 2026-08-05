import type { MetricTotals } from "@/lib/supabase/types";

/**
 * Las cuatro cifras que el dueño mira primero.
 *
 * Cada una va con su comparación contra la ventana anterior del mismo largo.
 * Un número solo ("17 clicks") no dice nada; "17, y ayer fueron 9" sí.
 *
 * Componente de servidor: son datos ya calculados, no hay nada interactivo
 * acá y no tiene sentido mandar JavaScript para pintar cuatro números.
 */

type Tile = {
  key: keyof MetricTotals;
  label: string;
  hint: string;
};

const TILES: Tile[] = [
  { key: "visits", label: "Visitas", hint: "Dispositivos distintos que entraron" },
  { key: "product_views", label: "Fichas vistas", hint: "Productos abiertos" },
  { key: "whatsapp_clicks", label: "WhatsApp", hint: "Toques al botón de consulta" },
  { key: "agent_queries", label: "Asistente", hint: "Consultas al chat" },
];

/** "vs. ayer" / "vs. los 7 días anteriores" según el rango elegido. */
function comparisonLabel(days: number): string {
  if (days === 1) return "vs. ayer";
  return `vs. los ${days} días anteriores`;
}

function Delta({ now, before }: { now: number; before: number }) {
  const diff = now - before;

  if (diff === 0) {
    return <span className="text-muted">sin cambios</span>;
  }

  // El signo menos tipográfico (−), no el guion. A este tamaño se nota.
  const sign = diff > 0 ? "+" : "−";
  const color = diff > 0 ? "text-ok" : "text-warn";

  return (
    <span className={color}>
      {sign}
      {Math.abs(diff)}
    </span>
  );
}

export default function MetricTiles({
  totals,
  previous,
  days,
}: {
  totals: MetricTotals;
  previous: MetricTotals;
  days: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TILES.map((tile) => (
        <div key={tile.key} className="metric-tile p-4">
          <p className="metric-label">{tile.label}</p>
          {/* El contraste es el punto: 44 px en peso 800 contra una etiqueta
              de 10 px. A la distancia de un teléfono en la mano, el número
              tiene que ser lo único que se lea. */}
          <p className="metric-value mt-2">{totals[tile.key]}</p>
          <p className="mt-2 text-xs">
            <Delta now={totals[tile.key]} before={previous[tile.key]} />{" "}
            <span className="text-muted">{comparisonLabel(days)}</span>
          </p>
          <p className="sr-only">{tile.hint}</p>
        </div>
      ))}
    </div>
  );
}
