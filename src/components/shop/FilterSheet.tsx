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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm text-paper"
      >
        Filtros
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
            {activeCount}
          </span>
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
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-ink"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-ink px-4 py-3">
              <h2 className="font-display text-lg font-bold text-paper">Filtros</h2>
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
              className="sticky bottom-0 flex gap-2 border-t border-line bg-ink px-4 py-3"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <button
                type="button"
                onClick={clearAll}
                className="tap h-12 flex-1 rounded-lg border border-line text-sm text-paper"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap h-12 flex-[2] rounded-lg bg-accent text-sm font-semibold text-white"
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
      <h3 className="text-xs tracking-wider text-muted uppercase">{title}</h3>
      <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

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
      className={`flex h-11 items-center rounded-full border px-4 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/15 text-paper"
          : "border-line text-muted hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
