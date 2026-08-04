import Link from "next/link";
import type { Category } from "@/lib/supabase/types";

/**
 * Fila de categorías con scroll horizontal.
 *
 * El scroll horizontal está permitido SOLO acá dentro (utilidad `rail`).
 * La página nunca scrollea de costado — CLAUDE.md §1.
 */
export default function CategoryNav({
  categories,
  active,
}: {
  categories: Category[];
  active?: string;
}) {
  if (!categories.length) return null;

  return (
    <nav aria-label="Categorías" className="border-b border-line bg-ink">
      <ul className="rail mx-auto max-w-5xl px-4 py-2.5">
        {categories.map((c) => {
          const isActive = active === c.slug;
          return (
            <li key={c.id}>
              <Link
                href={`/productos?cat=${c.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`tap flex h-9 items-center rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-accent bg-accent/10 text-paper"
                    : "border-line text-muted hover:border-accent hover:text-paper"
                }`}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
