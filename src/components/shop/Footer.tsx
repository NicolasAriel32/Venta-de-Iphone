import Link from "next/link";
import brand from "@/brand.config";
import type { Category } from "@/lib/supabase/types";

/**
 * Pie del sitio.
 *
 * Los datos de contacto salen de `brand.config.ts` (decisión 07). Antes había
 * un teléfono y dos correos escritos a mano acá, con un número que ni siquiera
 * era el del WhatsApp de la tienda: cambiar de marca dejaba el pie mintiendo.
 */
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

  // `54 9 11 2246 3840` a partir de los dígitos de brand.config.
  const phone = brand.whatsapp.number;
  const phonePretty = `+${phone.slice(0, 2)} ${phone.slice(2, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 9)} ${phone.slice(9)}`;

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p className="brand-lockup footer-brand">{name}</p>
          <p className="footer-tagline">{brand.tagline}</p>
          <ul className="footer-notes">
            <li>{n.warranty}</li>
            <li>{n.shipping}</li>
            <li>{n.payment}</li>
          </ul>
        </div>

        <div>
          <h2 className="footer-h">Contacto</h2>
          <a href={`tel:+${phone}`} className="footer-link mono">
            {phonePretty}
          </a>
          {brand.social.instagram && (
            <a
              href={brand.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Instagram
            </a>
          )}
        </div>

        {categories.length > 0 && (
          <div>
            <h2 className="footer-h">Catálogo</h2>
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/productos?cat=${c.slug}`} className="footer-link">
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="footer-legal mono">
        <span>
          © {year} {name}
        </span>
        <span>Imágenes ilustrativas · Precios sujetos a cotización</span>
      </div>
    </footer>
  );
}
