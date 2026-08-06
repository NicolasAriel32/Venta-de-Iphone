import Reveal from "@/components/ui/Reveal";

/**
 * Los tres pasos para comprar.
 *
 * El hairline que se dibuja arriba de cada paso al entrar en viewport es una
 * transición de `width` disparada por la clase que pone `Reveal`. Cero JS
 * propio más allá del observer que ya existe.
 *
 * ⚠️ El paso 2 dice "con seña", no "24 h". El demo prometía congelar el precio
 * 24 horas y eso no existe en ninguna parte del sistema: ni tabla, ni flag, ni
 * proceso. Lo que sí se cumple hoy es reservar contra seña.
 */
const STEPS = [
  {
    n: "PASO 01",
    title: "Elegís el equipo",
    body: "Modelo, color y capacidad. El precio de transferencia ya está a la vista, no hay que preguntarlo.",
  },
  {
    n: "PASO 02",
    title: "Congelás el precio con seña",
    body: "Dejás una seña y te reservamos la unidad y la cotización del día, aunque el blue se mueva mañana.",
  },
  {
    n: "PASO 03",
    title: "Pagás y coordinás",
    body: "Transferencia o hasta dos tarjetas en cuotas. Entrega coordinada en Buenos Aires y GBA.",
  },
];

export default function Steps() {
  return (
    <section className="sec" id="comprar">
      <Reveal className="sec-head">
        <div>
          <p className="eyebrow">Tres pasos, en orden</p>
          <h2 className="sec-title">Cómo comprar</h2>
        </div>
      </Reveal>

      <ol className="steps">
        {STEPS.map((s, i) => (
          // El Reveal va ADENTRO del <li>: `ol > div > li` no es HTML válido
          // y el lector de pantalla deja de contar los pasos.
          <li key={s.n} className="step">
            <Reveal className="step-inner" delay={i * 120}>
              <p className="step-n mono">{s.n}</p>
              <h3 className="step-h">{s.title}</h3>
              <p className="step-p">{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
