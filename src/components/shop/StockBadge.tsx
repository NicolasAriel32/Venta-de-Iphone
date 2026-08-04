import { STOCK_LABEL, type StockStatus } from "@/lib/supabase/types";

const STYLES: Record<StockStatus, string> = {
  in_stock: "text-ok",
  on_demand: "text-warn",
  out_of_stock: "text-muted",
};

/** Punto de color + etiqueta. Nunca solo color: eso no es accesible. */
export default function StockBadge({
  status,
  className = "",
}: {
  status: StockStatus;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${STYLES[status]} ${className}`}>
      <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
      {STOCK_LABEL[status]}
    </span>
  );
}
