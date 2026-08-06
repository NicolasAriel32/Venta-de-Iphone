import Reveal from "@/components/ui/Reveal";

/**
 * Franja de promesas, a lo ancho de la pantalla.
 *
 * Las tres son verificables hoy. Del demo se cayeron "24 provincias" y el
 * retiro en Ezeiza: la operación real es Buenos Aires y GBA, y una promesa de
 * logística que después no se cumple se paga en el primer pedido de Salta.
 */
const PROMISES = [
  {
    big: "6 meses",
    text: "Garantía escrita sobre cada equipo, con número de serie en la factura.",
  },
  {
    big: "Buenos Aires y GBA",
    text: "Entrega coordinada en el día o a convenir, donde te quede cómodo.",
  },
  {
    big: "24 h · 7 días",
    text: "Bart, nuestro asistente de IA integrado, te responde con información actualizada cualquier día de la semana.",
  },
];

export default function Promises() {
  return (
    <section className="promise">
      <div className="promise-grid">
        {PROMISES.map((p, i) => (
          <Reveal key={p.big} className="promise-item" delay={i * 120}>
            <p className="promise-big">{p.big}</p>
            <p className="promise-text">{p.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
