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
    <div className="page-wrap pt-7">
      <div className="catalog-head">
        <div className="min-w-0">
          <p className="eyebrow">{sp.q ? "Búsqueda" : "Catálogo"}</p>
          <h1 className="catalog-title">{heading}</h1>
          <p className="catalog-count mono">
            {result.total === 0
              ? "Sin resultados"
              : `${result.total} ${result.total === 1 ? "producto" : "productos"}`}
          </p>
        </div>

        <Suspense
          fallback={<div className="h-12 w-28 rounded-full border border-line" />}
        >
          <FilterSheet categories={categories} brands={brands} activeCount={activeCount} />
        </Suspense>
      </div>

      {result.items.length === 0 ? (
        <EmptyState query={sp.q} categories={categories} />
      ) : (
        <>
          <ul className="catalog-grid">
            {result.items.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} usdRate={usdRate} priority={i < 4} />
              </li>
            ))}
          </ul>

          <Pagination page={result.page} totalPages={result.totalPages} searchParams={sp} />
        </>
      )}
    </div>
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
    <div className="empty-state">
      <h2 className="empty-title">
        {query
          ? `Sin resultados para «${query}»`
          : "No encontramos productos con esos filtros"}
      </h2>
      <p className="empty-text">
        Probá con otra categoría, o escribinos por WhatsApp y lo buscamos por vos.
      </p>

      <ul className="cats justify-center">
        {categories.slice(0, 4).map((c) => (
          <li key={c.id}>
            <Link href={`/productos?cat=${c.slug}`} className="cat-chip tap">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/productos" className="btn-amber tap mt-7">
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
    <nav aria-label="Paginación" className="pager">
      {page > 1 ? (
        <Link href={build(page - 1)} className="btn-ghost tap">
          Anterior
        </Link>
      ) : (
        <span />
      )}

      <span className="pager-count mono">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={build(page + 1)} className="btn-ghost tap">
          Siguiente
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
