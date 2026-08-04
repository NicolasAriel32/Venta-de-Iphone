/**
 * Franja de medios de pago.
 *
 * Es TEXTO, no un precio calculado (CLAUDE.md §9, decisión 12). No hay
 * coeficientes ni "12 × $153.500": publicar una cuota mal calculada es un
 * problema real y nadie la va a mantener actualizada.
 */
export default function PaymentNote({ note }: { note: string }) {
  if (!note) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-paper">
      <span aria-hidden>💳</span>
      <span>{note}</span>
    </p>
  );
}
