/**
 * Franja de marcas en movimiento.
 *
 * CSS puro: un `translateX(-50%)` sobre la lista duplicada. Sin JS, sin
 * `requestAnimationFrame` y sin librería — se pausa al pasar el mouse con
 * `animation-play-state` y desaparece entera con `prefers-reduced-motion`.
 *
 * Las marcas salen del catálogo real (`getBrands()`), no de una lista escrita
 * a mano: una franja que anuncia marcas que no se venden es publicidad falsa
 * en la home.
 */
export default function BrandMarquee({ brands }: { brands: string[] }) {
  // Con menos de cuatro marcas el bucle se nota y queda peor que no tenerlo.
  if (brands.length < 4) return null;

  return (
    <div className="strip" aria-label="Marcas que trabajamos">
      {/* El listado accesible va una sola vez; el duplicado es puro decorado. */}
      <ul className="sr-only">
        {brands.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <div className="marquee-track" aria-hidden>
        {[...brands, ...brands].map((b, i) => (
          <span key={`${b}-${i}`}>{b}</span>
        ))}
      </div>
    </div>
  );
}
