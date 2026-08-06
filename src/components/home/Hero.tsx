import Link from "next/link";
import PriceBoard from "@/components/board/PriceBoard";
import type { BoardSnapshot } from "@/lib/board";

/**
 * Hero de la home.
 *
 * Server Component: adentro solo hay texto y links. Lo único que corre en el
 * navegador es la pizarra, que tiene su propio `"use client"`.
 *
 * La entrada escalonada (~90 ms entre bloques) es CSS puro con
 * `animation-delay`, igual que el resto del sistema. No hace falta JS para
 * animar algo que pasa una sola vez, al cargar.
 */
export default function Hero({ board }: { board: BoardSnapshot }) {
  return (
    <section className="hero-grid" id="pizarra">
      <div className="hero-copy">
        <p className="eyebrow load-1">
          <span className="pulse-dot" aria-hidden />
          Lista viva · precio del día
        </p>

        <h1 className="hero-title load-2">
          El precio que leés
          <em>es el que pagás.</em>
        </h1>

        <p className="hero-lede load-3">
          Pesos atados al blue del día, stock real, y el color y la capacidad ya
          elegidos antes de escribirnos. Sin &ldquo;consultá disponibilidad&rdquo;.
        </p>

        <div className="hero-ctas load-4">
          <Link href="/productos" className="btn-amber tap">
            Ver catálogo
          </Link>
          <Link href="#comprar" className="btn-ghost tap">
            Cómo comprar
          </Link>
        </div>

        <dl className="microstats load-5">
          <div>
            <dt className="microstat-n mono">6 meses</dt>
            <dd className="microstat-l">Garantía</dd>
          </div>
          <div>
            <dt className="microstat-n mono">2 tarjetas</dt>
            <dd className="microstat-l">Hasta en cuotas</dd>
          </div>
          <div>
            <dt className="microstat-n mono">24 h · 7 días</dt>
            <dd className="microstat-l">Te responde Bart</dd>
          </div>
        </dl>
      </div>

      <div className="hero-board load-3">
        <PriceBoard initial={board} />
      </div>
    </section>
  );
}
