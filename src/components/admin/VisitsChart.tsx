import type { MetricPoint } from "@/lib/supabase/types";

/**
 * Visitas por día.
 *
 * Barras con CSS, sin SVG y sin librería de gráficos. Recharts para esto
 * costaría más peso que todo el resto del panel junto y va contra la regla 4
 * de §0. El SVG estirado tampoco servía: con `preserveAspectRatio="none"`
 * los bordes redondeados se deforman y a 30 barras se nota.
 *
 * Se dibuja solo con dos días o más. Con un punto, una barra sola no dice
 * nada que la cifra grande de arriba no diga mejor.
 */
export default function VisitsChart({ series }: { series: MetricPoint[] }) {
  if (series.length < 2) return null;

  const max = Math.max(...series.map((p) => p.visits), 1);
  const total = series.reduce((acc, p) => acc + p.visits, 0);
  const lastIndex = series.length - 1;

  return (
    <section className="metric-tile p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="metric-label">Visitas por día</h2>
        <span className="usd-value text-xs text-muted">{total} en total</span>
      </div>

      <div
        className="mt-4 flex h-20 items-end gap-[3px]"
        role="img"
        aria-label={`Visitas por día. ${series
          .map((p) => `${formatDay(p.day)}: ${p.visits}`)
          .join(". ")}`}
      >
        {series.map((point, i) => {
          // Mínimo 3 px para que un día sin visitas siga marcando la ranura.
          // Una barra de altura cero se lee como "falta el dato".
          const pct = Math.max((point.visits / max) * 100, 4);
          const isLast = i === lastIndex;

          return (
            <div
              key={point.day}
              style={{ height: `${pct}%` }}
              // El último día —hoy— va en acento pleno; el resto atenuado.
              // Es el único que todavía puede cambiar mientras se mira.
              className={`min-w-0 flex-1 rounded-t-[2px] ${
                point.visits === 0
                  ? "bg-line"
                  : isLast
                    ? "bg-accent"
                    : "bg-accent/35"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>{formatDay(series[0].day)}</span>
        <span>hoy</span>
      </div>
    </section>
  );
}

/**
 * `2026-08-05` → `5/8`.
 *
 * Se parte el string a mano en vez de usar `new Date()`: el RPC ya devuelve
 * el día en hora de Argentina, y parsearlo lo volvería a correr de huso —
 * un `2026-08-05` se interpreta como medianoche UTC y en Buenos Aires eso
 * es el 4 a las 21.
 */
function formatDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}`;
}
