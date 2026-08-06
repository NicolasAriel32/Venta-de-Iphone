import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { formatArs } from "@/lib/pricing";
import type { Category } from "@/lib/supabase/types";
import type { BoardSnapshot } from "@/lib/board";

/**
 * Bento de la home: qué hay adentro de la tienda.
 *
 * La celda de cotización ocupa 2×2 porque es el dato que explica todos los
 * demás — es la misma jerarquía que el panel le da a `RateCard` (decisión 59).
 *
 * ⚠️ Dos cosas del demo NO están acá, a propósito:
 *
 *  · El sparkline de la cotización. El demo lo llenaba con `Math.random()`.
 *    No hay histórico del blue en ninguna tabla, y dibujar una curva
 *    inventada del dólar es exactamente lo que prohíbe la decisión 34.
 *  · La celda "Comparar dos modelos". Esa pantalla no existe. Un bento que
 *    ofrece una función que no está es una promesa rota en la home.
 */
export default function BentoGrid({
  board,
  categories,
  totalProducts,
  whatsappHref,
}: {
  board: BoardSnapshot;
  categories: Category[];
  totalProducts: number;
  whatsappHref: string;
}) {
  const { rate } = board;

  return (
    <section className="sec" id="catalogo">
      <Reveal className="sec-head">
        <div>
          <p className="eyebrow">Qué hay adentro</p>
          <h2 className="sec-title">
            Doce categorías,
            <br />
            un solo precio por producto.
          </h2>
        </div>
        <Link href="/productos" className="link-more tap">
          Ver los {totalProducts} productos →
        </Link>
      </Reveal>

      <div className="bento">
        <Reveal className="tile tile-rate" delay={0}>
          <div>
            <p className="eyebrow">Dólar blue · venta</p>
            <p className="rate-big mono">
              {rate.value > 0 ? formatArs(rate.value) : "—"}
            </p>
            <p className="tile-p">
              Todos los precios en pesos salen de esta cotización. Cuando se
              mueve, la pizarra se da vuelta.
            </p>
          </div>
          <p className="tile-foot mono">{rate.label}</p>
        </Reveal>

        <Reveal className="tile tile-wide" delay={80}>
          <h3 className="tile-h">Elegí por categoría</h3>
          <p className="tile-p">
            Cada ficha ya trae color, capacidad y precio de transferencia.
          </p>
          <ul className="cats">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/productos?cat=${c.slug}`} className="cat-chip tap">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="tile" delay={160}>
          <h3 className="tile-h">Buscá lo que ya sabés</h3>
          <p className="tile-p">
            Por modelo o por SKU, con filtro de marca y orden por precio.
          </p>
          <Link href="/productos" className="link-more tap tile-link">
            Abrir el catálogo →
          </Link>
        </Reveal>

        <Reveal className="tile tile-wa" delay={240}>
          <h3 className="tile-h">Escribinos y listo</h3>
          <p className="tile-p">
            Mandás el modelo, te confirmamos stock y coordinamos la entrega.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="link-more tap tile-link"
          >
            Abrir WhatsApp →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
