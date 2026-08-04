import Link from "next/link";
import brand from "@/brand.config";
import ProductCard from "@/components/shop/ProductCard";
import { getCategories, getFeatured, getStoreContext, REVALIDATE_SECONDS } from "@/lib/catalog";

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
  const notes = {
    warranty: config?.warranty_note || brand.notes.warranty,
    shipping: config?.shipping_note || brand.notes.shipping,
    payment: config?.payment_note || brand.notes.payment,
  };

  return (
    <>
      {/* Hero — banner único, no carrusel (decisión 04) */}
      <section className="mt-4">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-line/50 via-surface to-ink" />
          <div className="absolute inset-0 flex flex-col justify-end gap-3 p-5">
            <h1 className="font-display text-2xl leading-tight font-bold text-paper">
              {config?.banner_title || brand.tagline}
            </h1>
            <p className="max-w-[28ch] text-sm text-muted">{brand.description}</p>
            <Link
              href="/productos"
              className="tap inline-flex h-11 w-fit items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-paper">Categorías</h2>
          <ul className="mt-3 grid grid-cols-3 gap-2.5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/productos?cat=${c.slug}`}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-surface p-2 text-center transition-colors hover:border-accent"
                >
                  <span aria-hidden className="text-2xl">
                    {c.icon}
                  </span>
                  <span className="text-[11px] leading-tight text-muted">{c.name}</span>
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
              <li key={p.id} className="w-[160px]">
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
