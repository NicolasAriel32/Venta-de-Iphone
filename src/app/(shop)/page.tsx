import Image from "next/image";
import Link from "next/link";
import brand from "@/brand.config";
import ProductCard from "@/components/shop/ProductCard";
import AppleSidebar from "@/components/shop/AppleSidebar";
import { getCategories, getFeatured, getStoreContext, REVALIDATE_SECONDS } from "@/lib/catalog";
import { imageUrl } from "@/lib/images";

/** Banner propio que viaja con el repo. Se usa si `store_config.banner_path` está vacío. */
const DEFAULT_BANNER = "/banner.webp";

export const revalidate = 60;

export default async function HomePage() {
  // Las tres consultas son independientes: van en paralelo para no encadenar
  // tres viajes a São Paulo.
  const [{ config, rate }, categories, featured] = await Promise.all([
    getStoreContext(),
    getCategories(),
    getFeatured(6),
  ]);

  const usdRate = rate.value;
  const storeName = config?.store_name || brand.name;
  const bannerSrc = imageUrl(config?.banner_path) ?? DEFAULT_BANNER;
  const notes = {
    warranty: config?.warranty_note || brand.notes.warranty,
    shipping: config?.shipping_note || brand.notes.shipping,
    payment: config?.payment_note || brand.notes.payment,
  };

  return (
    <>
      {/* Nuevo Hero: título gigante sobre fondo naranja + imagen del iPhone */}
      <section className="mt-6">
        <div className="rounded-2xl overflow-hidden">
          <div className="hero-top bg-hero-orange flex items-center justify-center py-12 px-4">
            <h1 className="hero-title text-center">ENCONTRÁ EL QUE VA CON VOS</h1>
          </div>

          <div className="hero-card bg-white p-6 md:p-10 flex flex-col md:flex-row items-start gap-6">
            <div className="md:flex-2 flex-1 flex items-center justify-center">
              <Image
                src="/productos/iphone-17-pro-max-1.webp"
                alt="iPhone 17 Pro Max (naranja) - vista trasera"
                width={560}
                height={420}
                className="hero-image object-contain floating"
                priority
              />
            </div>

            <div className="md:flex-1 flex-1 text-center md:text-left">
              <p className="mb-4 text-lg font-semibold text-hero-accent">Lo último en potencia y color.</p>
              <p className="mb-6 text-sm text-muted">Fondo blanco con detalles naranjas y botón destacado para ver todo el catálogo.</p>
              <Link href="/productos" className="hero-cta inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-md">
                Ver catálogo
              </Link>
            </div>

            <aside className="w-full md:w-72">
              <AppleSidebar />
            </aside>
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-paper">Categorías</h2>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/productos?cat=${c.slug}`}
                  className="category-link flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface p-3 text-center transition-transform hover:scale-105"
                >
                  <div className="category-badge mb-1">
                    <span aria-hidden className="category-icon">{c.icon}</span>
                  </div>
                  <span className="category-name text-sm leading-tight text-paper">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Destacados — scroll horizontal contenido en la fila, nunca en la página */}
      {featured.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-paper">Destacados</h2>
            <Link href="/productos" className="tap text-sm text-accent">
              Ver todo
            </Link>
          </div>

          <ul className="rail mt-3 -mx-4 px-4">
            {featured.map((p, i) => (
              <li key={p.id} className="w-40">
                <ProductCard product={p} usdRate={usdRate} priority={i < 2} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Franja de confianza */}
      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <ul className="space-y-3 text-sm">
          {[notes.warranty, notes.shipping, notes.payment].map((n) => (
            <li key={n} className="flex items-start gap-2.5">
              <span aria-hidden className="mt-0.5 text-ok">
                ✓
              </span>
              <span className="text-paper">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Estado de error: la base no respondió. Decir qué pasa y qué hacer. */}
      {!config && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm text-paper">
            No pudimos cargar los precios en este momento.
          </p>
          <p className="mt-1 text-sm text-muted">
            Escribinos por WhatsApp y te pasamos la lista actualizada.
          </p>
        </section>
      )}

      <p className="sr-only">
        {storeName} · catálogo actualizado con revalidación cada {REVALIDATE_SECONDS}{" "}
        segundos
      </p>
    </>
  );
}
