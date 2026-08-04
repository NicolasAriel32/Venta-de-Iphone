import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/shop/ProductCard";
import FilterSheet from "@/components/shop/FilterSheet";
import {
  getBrands,
  getCategories,
  getCategoryBySlug,
  getProducts,
  getStoreContext,
  type SortOption,
} from "@/lib/catalog";

export const revalidate = 60;

const PER_PAGE = 12;

type SearchParams = Promise<{
  cat?: string;
  marca?: string;
  q?: string;
  sort?: string;
  page?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { cat, q } = await searchParams;

  // Una página de resultados de búsqueda no aporta nada al índice.
  if (q) return { title: `Búsqueda: ${q}`, robots: { index: false } };

  if (cat) {
    const category = await getCategoryBySlug(cat);
    if (category) {
      return {
        title: category.name,
        description: `Comprá ${category.name.toLowerCase()} con precio actualizado y stock real. Consultá por WhatsApp.`,
      };
    }
  }

  return {
    title: "Catálogo",
    description: "Celulares, notebooks, consolas y accesorios con precio actualizado.",
  };
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rate }, categories, brands, result] = await Promise.all([
    getStoreContext(),
    getCategories(),
    getBrands(sp.cat),
    getProducts({
      category: sp.cat,
      brand: sp.marca,
      query: sp.q,
      sort: (sp.sort as SortOption) || "relevance",
      page,
      perPage: PER_PAGE,
    }),
  ]);

  const usdRate = rate.value;
  const activeCount = [sp.cat, sp.marca, sp.sort].filter(Boolean).length;
  const currentCategory = sp.cat ? categories.find((c) => c.slug === sp.cat) : null;

  const heading = sp.q
    ? `Resultados para «${sp.q}»`
    : (currentCategory?.name ?? "Catálogo");

  return (
    <>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-bold text-paper">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {result.total === 0
              ? "Sin resultados"
              : `${result.total} ${result.total === 1 ? "producto" : "productos"}`}
          </p>
        </div>

        <Suspense fallback={<div className="h-11 w-24 rounded-lg border border-line" />}>
          <FilterSheet categories={categories} brands={brands} activeCount={activeCount} />
        </Suspense>
      </div>

      {result.items.length === 0 ? (
        <EmptyState query={sp.q} categories={categories} />
      ) : (
        <>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {result.items.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} usdRate={usdRate} priority={i < 4} />
              </li>
            ))}
          </ul>

          <Pagination page={result.page} totalPages={result.totalPages} searchParams={sp} />
        </>
      )}
    </>
  );
}

/**
 * Estado vacío. Nunca un callejón sin salida: siempre ofrece una salida
 * concreta (SPEC.md §7).
 */
function EmptyState({
  query,
  categories,
}: {
  query?: string;
  categories: { id: string; name: string; slug: string }[];
}) {
  return (
    <div className="py-14 text-center">
      <p className="font-display text-lg font-bold text-paper">
        {query
          ? `Sin resultados para «${query}»`
          : "No encontramos productos con esos filtros"}
      </p>
      <p className="mx-auto mt-2 max-w-[34ch] text-sm text-muted">
        Probá con otra categoría, o escribinos por WhatsApp y lo buscamos por vos.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {categories.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={`/productos?cat=${c.slug}`}
            className="tap flex h-11 items-center rounded-full border border-line px-4 text-sm text-paper"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <Link
        href="/productos"
        className="tap mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white"
      >
        Limpiar filtros
      </Link>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const build = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") next.set(k, v);
    }
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return `/productos${qs ? `?${qs}` : ""}`;
  };

  return (
    <nav aria-label="Paginación" className="mt-8 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link
          href={build(page - 1)}
          className="tap flex h-11 items-center rounded-lg border border-line px-4 text-sm text-paper"
        >
          Anterior
        </Link>
      ) : (
        <span />
      )}

      <span className="text-sm text-muted">
        {page} de {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={build(page + 1)}
          className="tap flex h-11 items-center rounded-lg border border-line px-4 text-sm text-paper"
        >
          Siguiente
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
