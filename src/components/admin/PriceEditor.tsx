"use client";

import { useMemo, useState } from "react";
import ProductPriceCard from "./ProductPriceCard";
import { SearchIcon } from "@/components/ui/icons";
import type { AdminProduct } from "@/lib/admin";

/**
 * Lista editable de precios.
 *
 * El buscador filtra en el navegador y no contra la base: son ~42 productos,
 * y un viaje a São Paulo por cada tecla en un celular con datos móviles se
 * siente peor que cualquier ganancia teórica.
 *
 * El buscador queda pegado arriba mientras se scrollea porque el dueño no
 * navega la lista: sabe qué modelo viene a tocar y lo escribe.
 */
export default function PriceEditor({
  products,
  usdRate,
}: {
  products: AdminProduct[];
  usdRate: number;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.sku} ${p.brand} ${p.category_name}`
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  return (
    <section>
      <div className="sticky top-0 z-10 -mx-4 bg-ink/95 px-4 py-3 backdrop-blur">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="buscar-producto" className="sr-only">
            Buscar producto
          </label>
          <input
            id="buscar-producto"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por modelo o SKU"
            className="h-12 w-full rounded-lg border border-line bg-surface pr-3 pl-10 text-paper outline-none focus:border-accent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
          No hay ningún producto que coincida con “{query}”. Probá con el
          modelo o el SKU.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => (
            <ProductPriceCard
              key={product.id}
              product={product}
              usdRate={usdRate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
