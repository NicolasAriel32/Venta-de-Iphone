import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import brand from "@/brand.config";
import ProductVariants from "@/components/shop/ProductVariants";
import Track from "@/components/shop/Track";
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
  const whatsapp = config?.whatsapp_number || brand.whatsapp.number;
  const specs = Object.entries(product.specs ?? {});

  // Los tres textos de confianza salen de la config, con el fallback de
  // `brand.config.ts`. Antes la franja de esta ficha los tenía escritos a
  // mano, así que editarlos desde el panel no cambiaba nada acá.
  const notes = {
    warranty: config?.warranty_note || brand.notes.warranty,
    shipping: config?.shipping_note || brand.notes.shipping,
    payment: config?.payment_note || brand.notes.payment,
  };
  const paymentNote = notes.payment;

  return (
    <article className="content-wrap pb-20">
      {/* Registra QUÉ producto se miró. La visita en sí ya la cuenta el
          <Track /> del layout: son dos métricas distintas del panel. */}
      <Track productId={product.id} />
      <div className="detail-hero reveal">
        <nav>
          <Link href={`/productos?cat=${product.category_slug}`} className="detail-back tap">
            <ChevronLeftIcon className="h-4 w-4" />
            {product.category_name}
          </Link>
        </nav>

        <p className="eyebrow detail-sku">
          {product.brand} <span className="mono">· SKU {product.sku}</span>
        </p>
        <h1 className="detail-title">{product.name}</h1>
      </div>

      {/*
        Esta tarjeta NO lleva animación de entrada, a propósito.

        Adentro vive la barra de acción fija con "Agregar al carrito". Un
        ancestro animado la rompe de dos maneras: `transform` lo vuelve el
        bloque contenedor del `fixed` (la barra dejaba de estar pegada al
        borde de la pantalla y quedaba al final de la ficha, fuera de la zona
        del pulgar), y una animación de `opacity` con `fill-mode: both` crea
        un contexto de apilamiento permanente que encierra el z-index de la
        barra por debajo del widget de Retell — con lo que el botón se veía
        pero no respondía al toque (CLAUDE.md §9, decisión 51).

        La entrada escalonada la sigue haciendo el encabezado de arriba.
      */}
      <div className="detail-panel">
        <ProductVariants
          product={product}
          usdRate={usdRate}
          paymentNote={paymentNote}
          whatsappNumber={whatsapp}
        />
      </div>

      {product.description && (
        <section className="detail-sec">
          <h2 className="detail-h2">Descripción</h2>
          <p className="product-description">{product.description}</p>
        </section>
      )}

      {specs.length > 0 && (
        <section className="detail-sec">
          <h2 className="detail-h2">Especificaciones</h2>
          <dl className="specs">
            {specs.map(([k, v]) => (
              <div key={k} className="spec-row">
                <dt className="spec-k">{k}</dt>
                <dd className="spec-v mono">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="detail-sec">
        <ul className="trust">
          <li>
            <WarrantyIcon className="text-ok" />
            <div>
              <p className="trust-k">Garantía</p>
              <p className="trust-v">{notes.warranty}</p>
            </div>
          </li>
          <li>
            <TruckIcon className="text-amber" />
            <div>
              <p className="trust-k">Envíos</p>
              <p className="trust-v">{notes.shipping}</p>
            </div>
          </li>
          <li>
            <CardIcon className="text-amber" />
            <div>
              <p className="trust-k">Medios de pago</p>
              <p className="trust-v">{notes.payment}</p>
            </div>
          </li>
        </ul>
      </section>

      {/* Transparencia sobre de dónde sale el precio en pesos. */}
      {usdRate > 0 && (
        <p className="rate-note">
          <span className="mono">{rateLabel(rate)}</span>
          <span className="mono rate-note-v">
            1 USD = {new Intl.NumberFormat("es-AR").format(usdRate)}
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
