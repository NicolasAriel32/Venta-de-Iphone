import Link from "next/link";

/**
 * Estado "todavía no construido", usado por las rutas que se completan en
 * fases posteriores. No es decorativo: valida que el ruteo, el layout y el
 * chasis funcionan antes de que exista contenido.
 *
 * Se borra cuando la última fase lo reemplace por la pantalla real.
 */
export default function Placeholder({
  phase,
  title,
  detail,
}: {
  phase: string;
  title: string;
  detail: string;
}) {
  return (
    <section className="py-16 text-center">
      <p className="font-display text-xs tracking-widest text-accent uppercase">
        {phase}
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-paper">{title}</h1>
      <p className="mx-auto mt-3 max-w-[32ch] text-sm text-muted">{detail}</p>
      <Link
        href="/"
        className="tap mt-6 inline-flex h-11 items-center rounded-lg border border-line px-5 text-sm text-paper"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
