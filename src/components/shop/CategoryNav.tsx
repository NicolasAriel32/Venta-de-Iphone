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
    <nav aria-label="Categorías" className="catnav">
      <ul className="rail catnav-rail">
        {categories.map((c) => {
          const isActive = active === c.slug;
          return (
            <li key={c.id}>
              <Link
                href={`/productos?cat=${c.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`chip tap catnav-chip ${isActive ? "is-active" : ""}`}
              >
                <span aria-hidden className="catnav-icon">
                  {c.icon}
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
