import Link from "next/link";
import brand, { whatsappLink } from "@/brand.config";
import Hero from "@/components/home/Hero";
import BrandMarquee from "@/components/home/BrandMarquee";
import BentoGrid from "@/components/home/BentoGrid";
import ShowcaseCard from "@/components/home/ShowcaseCard";
import Steps from "@/components/home/Steps";
import Promises from "@/components/home/Promises";
import Reveal from "@/components/ui/Reveal";
import { buildBoardRows, BOARD_SIZE, type BoardSnapshot } from "@/lib/board";
import {
  getBrands,
  getCategories,
  getFeatured,
  getProducts,
  getStoreContext,
  REVALIDATE_SECONDS,
} from "@/lib/catalog";
import { rateLabel } from "@/lib/exchange";

export const revalidate = 60;

export default async function HomePage() {
  // Cinco consultas independientes: van juntas para no encadenar cinco viajes
  // a São Paulo en el camino crítico de la home.
  const [{ config, rate }, categories, featured, brands, catalog] = await Promise.all([
    getStoreContext(),
    getCategories(),
    getFeatured(BOARD_SIZE),
    getBrands(),
    getProducts({ perPage: 1 }),
  ]);

  const usdRate = rate.value;
  const storeName = config?.store_name || brand.name;

  // La pizarra se renderiza en el servidor con estos datos y de ahí en más se
  // refresca sola contra /api/rate. Nunca arranca vacía.
  const board: BoardSnapshot = {
    rate: {
      value: rate.value,
      origin: rate.origin,
      updatedAt: rate.updatedAt,
      label: rateLabel(rate),
    },
    rows: buildBoardRows(featured, usdRate),
  };

  const whatsapp = config?.whatsapp_number || brand.whatsapp.number;
  const whatsappHref = config?.whatsapp_number
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(brand.whatsapp.defaultMessage)}`
    : whatsappLink();

  return (
    <>
      <Hero board={board} />

      <BrandMarquee brands={brands} />

      <BentoGrid
        board={board}
        categories={categories}
        totalProducts={catalog.total}
        whatsappHref={whatsappHref}
      />

      {featured.length > 0 && (
        <section className="sec" id="destacados">
          <Reveal className="sec-head">
            <div>
              <p className="eyebrow">Los que más salen</p>
              <h2 className="sec-title">Destacados de la semana</h2>
            </div>
            <Link href="/productos" className="link-more tap">
              Ver todo →
            </Link>
          </Reveal>

          <ul className="showcase-grid">
            {featured.map((p, i) => (
              <li key={p.id}>
                <ShowcaseCard product={p} usdRate={usdRate} priority={i < 2} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Steps />

      <Promises />

      {/* Estado de error: la base no respondió. Decir qué pasa y qué hacer,
          sin pedir disculpas (CLAUDE.md §6, F6). */}
      {!config && (
        <section className="sec">
          <div className="tile">
            <h3 className="tile-h">No pudimos cargar los precios</h3>
            <p className="tile-p">
              Escribinos por WhatsApp y te pasamos la lista actualizada al
              momento.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="link-more tap tile-link"
            >
              Abrir WhatsApp →
            </a>
          </div>
        </section>
      )}

      <p className="sr-only">
        {storeName} · catálogo actualizado con revalidación cada {REVALIDATE_SECONDS}{" "}
        segundos
      </p>
    </>
  );
}
