import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import brand from "@/brand.config";
import ProductVariants from "@/components/shop/ProductVariants";
import { ChevronLeftIcon, WarrantyIcon, TruckIcon, CardIcon } from "@/components/ui/icons";
import { getAllProductSlugs, getProductBySlug, getStoreContext } from "@/lib/catalog";
import { absoluteImageUrl } from "@/lib/images";
import { formatCapacity, usdToArs } from "@/lib/pricing";
import { rateLabel } from "@/lib/exchange";

export const revalidate = 60;

/** Pre-genera las 42 fichas en el build. Después el ISR las refresca. */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

/**
 * Ojo: esta página NO lee `searchParams`.
 *
 * Leerlos en el servidor la volvería dinámica y perdería el ISR: cada
 * visita sería un viaje a São Paulo, en contra del objetivo de 3 s con
 * datos móviles. El color y la capacidad de la URL los lee el componente
 * cliente al montarse, que para eso ya corre en el navegador.
 */
type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Producto no encontrado" };

  const title = `${product.name} — ${product.brand}`;
  const description =
    product.description ||
    `${product.name} con precio actualizado y stock real. Consultá por WhatsApp.`;

  // El canal del rubro es WhatsApp: el link pegado en un chat tiene que
  // mostrar la foto del producto, no un rectángulo vacío.
  const og = absoluteImageUrl(product.images[0]?.storage_path, brand.url);

  return {
    title,
    description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/productos/${product.slug}`,
      images: og ? [{ url: og, width: 1200, height: 1200, alt: title }] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;

  const [product, { config, rate }] = await Promise.all([
    getProductBySlug(slug),
    getStoreContext(),
  ]);

  if (!product) notFound();

  const usdRate = rate.value;
  const paymentNote = config?.payment_note || brand.notes.payment;
  const whatsapp = config?.whatsapp_number || brand.whatsapp.number;
  const specs = Object.entries(product.specs ?? {});

  return (
    <article className="pb-20">
      <div className="product-page-hero theme-orange rounded-2xl p-4 mb-6">
        <nav className="mt-3 flex items-center gap-1 text-sm">
        <Link
          href={`/productos?cat=${product.category_slug}`}
          className="tap flex h-11 items-center gap-1 text-muted hover:text-paper"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {product.category_name}
        </Link>
      </nav>

        <p className="text-[11px] tracking-wider text-muted uppercase mt-3">
          {product.brand} · SKU {product.sku}
        </p>
        <h1 className="mt-1 font-display text-2xl leading-tight font-bold text-white">
          {product.name}
        </h1>
      </div>

      <div className="product-card-white rounded-2xl bg-white p-5">
        <ProductVariants
          product={product}
          usdRate={usdRate}
          paymentNote={paymentNote}
          whatsappNumber={whatsapp}
        />
      </div>

      {product.description && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-paper">Descripción</h2>
          <p className="mt-2 product-description">{product.description}</p>
        </section>
      )}

      {specs.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-paper">Especificaciones</h2>
          <dl className="mt-3 divide-y divide-line rounded-xl border border-line">
            {specs.map(([k, v]) => (
              <div key={k} className="flex gap-4 px-4 py-3 text-sm">
                <dt className="w-2/5 shrink-0 text-muted">{k}</dt>
                <dd className="text-paper">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-3">
            <WarrantyIcon className="text-emerald-400" />
            <div>
              <div className="text-sm text-paper font-medium">Garantía</div>
              <div className="text-xs text-muted">6 meses de garantía</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TruckIcon className="text-paper" />
            <div>
              <div className="text-sm text-paper font-medium">Envíos</div>
              <div className="text-xs text-muted">Envíos a todo el país</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CardIcon className="text-paper" />
            <div>
              <div className="text-sm text-paper font-medium">Medios de pago</div>
              <div className="text-xs text-muted">Crédito en cuotas y tarjetas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparencia sobre de dónde sale el precio en pesos. */}
      {usdRate > 0 && (
        <p className="mt-4">
          <span className="usd-rate" aria-hidden>
            {rateLabel(rate)} · 1 USD = <span className="usd-value">{new Intl.NumberFormat("es-AR").format(usdRate)}</span>
          </span>
        </p>
      )}

      <ProductJsonLd
        product={product}
        usdRate={usdRate}
        url={`${brand.url}/productos/${product.slug}`}
      />
    </article>
  );
}

/**
 * JSON-LD de Product con una `offer` por capacidad.
 *
 * Google necesita una oferta por variante para poder mostrar el rango de
 * precios en los resultados. Con una sola oferta, un producto que va de
 * USD 899 a USD 1.279 se muestra mal.
 *
 * La moneda es **ARS**, igual que el precio que se ve en pantalla. Publicar
 * structured data en una moneda distinta a la mostrada es exactamente el
 * tipo de inconsistencia que Google marca como error.
 */
function ProductJsonLd({
  product,
  usdRate,
  url,
}: {
  product: Awaited<ReturnType<typeof getProductBySlug>>;
  usdRate: number;
  url: string;
}) {
  // Sin cotización no hay precio en pesos, y una oferta sin precio es peor
  // que no publicar structured data.
  if (!product || !usdRate) return null;

  const availability = (s: string) =>
    s === "in_stock"
      ? "https://schema.org/InStock"
      : s === "on_demand"
        ? "https://schema.org/BackOrder"
        : "https://schema.org/OutOfStock";

  const offers = product.capacities.length
    ? product.capacities.map((c) => ({
        "@type": "Offer",
        name: formatCapacity(c.capacity_gb),
        price: usdToArs(c.price_usd, usdRate),
        priceCurrency: "ARS",
        availability: availability(c.stock_status),
        url,
      }))
    : [
        {
          "@type": "Offer",
          price: usdToArs(product.min_price_usd, usdRate),
          priceCurrency: "ARS",
          availability: availability(product.stock_status),
          url,
        },
      ];

  const images = product.images
    .map((i) => absoluteImageUrl(i.storage_path, brand.url))
    .filter((u): u is string => Boolean(u));

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    category: product.category_name,
    color: product.allColors.map((c) => c.name).join(", ") || undefined,
    image: images.length ? images : undefined,
    offers,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
