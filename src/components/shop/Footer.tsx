import Link from "next/link";
import brand from "@/brand.config";
import type { Category } from "@/lib/supabase/types";

export default function Footer({
  categories = [],
  storeName,
  notes,
}: {
  categories?: Category[];
  storeName?: string;
  notes?: { warranty: string; shipping: string; payment: string };
}) {
  const year = new Date().getFullYear();
  const name = storeName || brand.name;
  const n = notes ?? brand.notes;

  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="font-display text-lg font-bold tracking-tight text-paper">{name}</p>
        <p className="mt-1 text-sm text-muted">{brand.tagline}</p>

        {categories.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/productos?cat=${c.slug}`}
                className="tap py-1 text-sm text-muted hover:text-paper"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <ul className="mt-6 space-y-1.5 text-sm text-muted">
          <li>{n.warranty}</li>
          <li>{n.shipping}</li>
          <li>{n.payment}</li>
        </ul>

        {brand.social.instagram && (
          <a
            href={brand.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="tap mt-6 inline-flex h-11 items-center text-sm text-accent"
          >
            Seguinos en Instagram
          </a>
        )}

        <p className="mt-8 border-t border-line pt-4 text-xs text-muted">
          © {year} {name}. Las imágenes son ilustrativas. Los precios pueden variar sin
          previo aviso.
        </p>
      </div>
    </footer>
  );
}
