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
      <ul className="rail mx-auto max-w-5xl px-4 py-3">
        {categories.map((c) => {
          const isActive = active === c.slug;
          return (
            <li key={c.id}>
              <Link
                href={`/productos?cat=${c.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`tap flex h-11 items-center gap-3 rounded-full border px-3.5 text-sm whitespace-nowrap transition-all transform-gpu ${
                  isActive
                    ? "border-accent bg-accent/10 text-paper shadow-accent"
                    : "border-line text-muted hover:border-accent hover:text-paper hover:scale-105"
                }`}
              >
                <span className="inline-flex items-center justify-center category-nav-badge">
                  <span className="text-xl">{c.icon}</span>
                </span>
                <span>{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
