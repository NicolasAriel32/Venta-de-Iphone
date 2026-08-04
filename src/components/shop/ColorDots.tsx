import type { ColorDot } from "@/lib/supabase/types";

/**
 * Puntitos de color del LISTADO.
 *
 * Son INFORMACIÓN, no un control (CLAUDE.md §9, decisión 15). No se puede
 * tocar: seis controles de 44 px no entran en una card de 390 px de ancho.
 * La elección de variante pasa solo en el detalle.
 */
export default function ColorDots({ colors, max = 4 }: { colors: ColorDot[]; max?: number }) {
  if (!colors?.length) return null;

  const shown = colors.slice(0, max);
  const rest = colors.length - shown.length;

  return (
    <div className="flex items-center gap-1" aria-label={`Colores: ${colors.map((c) => c.name).join(", ")}`}>
      {shown.map((c) => (
        <span
          key={c.slug}
          aria-hidden
          title={c.name}
          className="h-2.5 w-2.5 rounded-full ring-1 ring-line"
          style={{ backgroundColor: c.hex }}
        />
      ))}
      {rest > 0 && <span className="text-[10px] text-muted">+{rest}</span>}
    </div>
  );
}
