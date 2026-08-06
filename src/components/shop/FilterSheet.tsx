"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CloseIcon } from "@/components/ui/icons";
import type { Category } from "@/lib/supabase/types";

/**
 * Filtros en HOJA INFERIOR, no en barra lateral.
 *
 * La trampa de F3 (CLAUDE.md §6): una barra lateral de filtros no entra a
 * 390 px. Se abre desde abajo, ocupa como mucho el 85% del alto y se cierra
 * con Escape, con la X o tocando el fondo.
 */

const SORTS = [
  { value: "relevance", label: "Destacados" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "newest", label: "Más nuevos" },
] as const;

export default function FilterSheet({
  categories,
  brands,
  activeCount,
}: {
  categories: Category[];
  brands: string[];
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const cat = params.get("cat") ?? "";
  const marca = params.get("marca") ?? "";
  const sort = params.get("sort") ?? "relevance";

  // Bloquea el scroll del fondo mientras la hoja está abierta.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    // Cualquier cambio de filtro vuelve a la página 1: quedarse en la 3
    // de un resultado que ahora tiene 1 página es un callejón sin salida.
    next.delete("page");
    router.push(`/productos?${next.toString()}`);
  }

  function clearAll() {
    router.push("/productos");
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost tap shrink-0">
        Filtros
        {activeCount > 0 && (
          <span className="filter-badge mono">{activeCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="sheet"
          >
            <div className="sheet-head">
              <h2 className="sheet-title">Filtros</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="tap flex h-11 w-11 items-center justify-center rounded-lg text-muted"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-6 px-4 py-5">
              <Group title="Ordenar por">
                {SORTS.map((s) => (
                  <Chip
                    key={s.value}
                    active={sort === s.value}
                    onClick={() => apply({ sort: s.value === "relevance" ? "" : s.value })}
                  >
                    {s.label}
                  </Chip>
                ))}
              </Group>

              <Group title="Categoría">
                <Chip active={!cat} onClick={() => apply({ cat: "" })}>
                  Todas
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    active={cat === c.slug}
                    onClick={() => apply({ cat: cat === c.slug ? "" : c.slug })}
                  >
                    {c.name}
                  </Chip>
                ))}
              </Group>

              {brands.length > 0 && (
                <Group title="Marca">
                  <Chip active={!marca} onClick={() => apply({ marca: "" })}>
                    Todas
                  </Chip>
                  {brands.map((b) => (
                    <Chip
                      key={b}
                      active={marca === b}
                      onClick={() => apply({ marca: marca === b ? "" : b })}
                    >
                      {b}
                    </Chip>
                  ))}
                </Group>
              )}
            </div>

            {/* Acciones al fondo: zona del pulgar */}
            <div
              className="sheet-foot"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <button type="button" onClick={clearAll} className="btn-ghost tap flex-1">
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-amber tap flex-[2]"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="variant-label">{title}</h3>
      <div className="variant-row">{children}</div>
    </div>
  );
}

/** Misma píldora que las capacidades del detalle y los chips de la home. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}
