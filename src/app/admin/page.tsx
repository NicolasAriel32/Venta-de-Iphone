import Link from "next/link";
import brand from "@/brand.config";
import { signOut } from "./actions";
import MetricTiles from "@/components/admin/MetricTiles";
import VisitsChart from "@/components/admin/VisitsChart";
import RateCard from "@/components/admin/RateCard";
import PriceEditor from "@/components/admin/PriceEditor";
import { getAdminProducts, getMetrics, parseRange, METRIC_RANGES } from "@/lib/admin";
import { getStoreContext } from "@/lib/catalog";
import { rateLabel } from "@/lib/exchange";

/**
 * Panel — métricas arriba, precios abajo, en una sola pantalla.
 *
 * Es deliberado que sea una sola: el dueño entra al panel para mirar cómo
 * viene el día y de paso corregir un precio. Repartir eso en dos pantallas
 * agrega navegación a la tarea más frecuente del sistema.
 *
 * Todo en columna única, pensado para el pulgar (§6 F5). Nada de tablas
 * anchas: en un celular no entran y no son ni claras ni lindas.
 */

export const metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

/** Lee la sesión de las cookies y escribe: nunca se cachea. */
export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;
  const range = parseRange(r);

  // En paralelo: son tres viajes a São Paulo y encadenarlos se nota en el
  // celular. El proxy de auth ya garantizó que hay sesión.
  const [metrics, products, { config, rate }] = await Promise.all([
    getMetrics(range),
    getAdminProducts(),
    getStoreContext(),
  ]);

  const isEmpty =
    metrics !== null &&
    metrics.totals.visits === 0 &&
    metrics.totals.product_views === 0 &&
    metrics.totals.whatsapp_clicks === 0 &&
    metrics.totals.agent_queries === 0;

  return (
    <div className="space-y-6 pb-16">
      <header className="admin-reveal flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold tracking-tight text-paper uppercase">
            {config?.store_name || brand.name}
          </p>
          <p className="text-xs text-muted">Panel</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="tap flex h-11 items-center rounded-lg border border-line px-3 text-sm text-muted"
          >
            Ver tienda
          </Link>
          {/* Un form y no un link: cerrar sesión cambia estado del servidor. */}
          <form action={signOut}>
            <button
              type="submit"
              className="tap flex h-11 items-center rounded-lg border border-line px-3 text-sm text-muted"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      {/* ---------------------------------------------------- métricas --- */}
      {/* Un solo revelado orquestado al abrir, como en la tienda (decisión
          45). Las 42 tarjetas de precio quedan afuera a propósito: un
          escalonado ahí se vuelve una cascada que estorba. */}
      <section className="admin-reveal admin-reveal-1 space-y-3">
        <div className="flex gap-2" role="group" aria-label="Período">
          {METRIC_RANGES.map((value) => (
            <Link
              key={value}
              href={`/admin?r=${value}`}
              // `scroll={false}` para que cambiar de período no devuelva al
              // dueño al tope si estaba mirando la lista de precios.
              scroll={false}
              aria-current={range === value ? "page" : undefined}
              className={`tap flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold ${
                range === value
                  ? "border-accent bg-accent/10 text-paper"
                  : "border-line text-muted"
              }`}
            >
              {value === 1 ? "Hoy" : `${value} días`}
            </Link>
          ))}
        </div>

        {metrics === null ? (
          <p className="rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
            No pudimos leer las métricas. Recargá la página; si sigue igual,
            revisá que la base esté despierta.
          </p>
        ) : (
          <>
            <MetricTiles
              totals={metrics.totals}
              previous={metrics.previous}
              days={metrics.days}
            />

            {isEmpty && (
              <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
                Todavía no entró nadie en este período. Compartí el link de la
                tienda por Instagram o WhatsApp y los números aparecen solos.
              </p>
            )}

            <VisitsChart series={metrics.series} />

            {metrics.top.length > 0 && (
              <section className="rounded-2xl border border-line bg-surface p-4">
                <h2 className="text-[11px] tracking-wider text-muted uppercase">
                  Más mirados
                </h2>
                <ol className="mt-3 space-y-2">
                  {metrics.top.map((item) => (
                    <li key={item.id} className="flex items-baseline gap-3">
                      <Link
                        href={`/productos/${item.slug}`}
                        className="min-w-0 flex-1 truncate text-sm text-paper"
                      >
                        {item.name}
                      </Link>
                      <span className="usd-value shrink-0 text-xs text-muted">
                        {item.views} {item.views === 1 ? "vista" : "vistas"}
                        {item.clicks > 0 && ` · ${item.clicks} wsp`}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </section>

      {/* -------------------------------------------------- cotización --- */}
      <div className="admin-reveal admin-reveal-2">
        <RateCard
          mode={config?.rate_mode ?? "auto"}
          manualRate={Number(config?.usd_rate ?? 0)}
          resolvedRate={rate.value}
          originLabel={rateLabel(rate)}
        />
      </div>

      {/* ------------------------------------------------------ precios --- */}
      {/* Sin `.admin-reveal`, a propósito: adentro vive el buscador
          `position: sticky` y un ancestro con `transform` —que es lo que deja
          la animación con `fill-mode: both`— se vuelve su bloque contenedor y
          lo despega del borde. Es la misma trampa que la decisión 51, esta
          vez con sticky en lugar de fixed. */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-paper">
            Precios
          </h2>
          {/* Recordatorio permanente de la regla dura: se carga en dólares.
              Es lo primero que un dueño nuevo intenta hacer mal. */}
          <span className="text-[11px] text-muted">
            se cargan en USD · el peso se calcula solo
          </span>
        </div>
        {products.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
            No pudimos leer el catálogo. Recargá la página.
          </p>
        ) : (
          <PriceEditor products={products} usdRate={rate.value} />
        )}
      </section>
    </div>
  );
}
