"use client";

import { useEffect, useRef, useState } from "react";

/** Desfase entre carácter y carácter, para que la vuelta lea de izquierda a derecha. */
const STEP_MS = 22;
/** Mitad de la vuelta: con la celda de canto es cuando se cambia el glifo. */
const SWAP_AT_MS = 145;
/** Duración total del giro. Tiene que coincidir con `@keyframes flap`. */
const DONE_MS = 320;

type Align = "left" | "right";

/**
 * Recorta o rellena a un ancho fijo. El ancho fijo es lo que evita el salto
 * de layout: la celda de "$ 1.842.000" y la de "CONSULTAR" ocupan lo mismo.
 */
function pad(value: string, width: number, align: Align): string {
  const raw = value.toUpperCase();
  // Cuando no entra se corta con puntos suspensivos, no a lo bruto: un
  // "MACBOOK AIR 13" M" cortado seco se lee como un bug, y un precio cortado
  // a la mitad es directamente información falsa.
  const text = raw.length > width ? `${raw.slice(0, width - 1)}…` : raw;
  const gap = " ".repeat(Math.max(0, width - text.length));
  return align === "right" ? gap + text : text + gap;
}

/**
 * Espacio duro (U+00A0), no uno normal: un espacio común dentro de un `<span>`
 * se colapsa y el casillero vacío pierde el ancho — que es justo lo único que
 * la pizarra no puede permitirse.
 */
const glyph = (char: string) => (char === " " ? " " : char);

/**
 * Una celda de pizarra split-flap: un carácter por casillero.
 *
 * Lo importante, y lo que el brief marca como el punto del elemento firma:
 * **solo giran los caracteres que efectivamente cambiaron.** Si el blue no se
 * movió, la pizarra queda quieta. Un flip decorativo cada X segundos convierte
 * el dato en decoración y mata el concepto.
 *
 * Por eso los casilleros se pintan una sola vez desde React y después los
 * maneja el efecto por DOM: si el texto viviera en el JSX, cada cambio de
 * prop volvería a renderizar los `<span>` en el medio del giro y cortaría la
 * animación por la mitad.
 */
export default function FlipCells({
  value,
  width,
  align = "left",
  className = "",
}: {
  value: string;
  width: number;
  align?: Align;
  className?: string;
}) {
  const padded = pad(value, width, align);

  // Congelado a propósito: es lo que se renderiza en el servidor y en la
  // primera pintada del cliente. De acá en adelante manda el efecto.
  const [initial] = useState(padded);

  const hostRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(initial);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const prev = prevRef.current;
    if (padded === prev) return;
    prevRef.current = padded;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (let i = 0; i < padded.length; i++) {
      if (padded[i] === prev[i]) continue;

      const cell = host.children[i] as HTMLElement | undefined;
      if (!cell) continue;

      const next = glyph(padded[i]);

      // Sin animación: el número cambia y se acabó. No es una versión
      // degradada, es la correcta para quien pidió no ver movimiento.
      if (reduce) {
        cell.textContent = next;
        continue;
      }

      timersRef.current.push(
        window.setTimeout(() => {
          cell.classList.add("is-flipping");
          timersRef.current.push(
            window.setTimeout(() => {
              cell.textContent = next;
            }, SWAP_AT_MS),
            window.setTimeout(() => {
              cell.classList.remove("is-flipping");
            }, DONE_MS),
          );
        }, i * STEP_MS),
      );
    }
  }, [padded]);

  // Un desmontaje en el medio de un giro dejaría timers escribiendo sobre
  // nodos que ya no existen.
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      {/* El texto real para lectores de pantalla: los casilleros sueltos se
          leerían letra por letra. Este sí lo re-renderiza React. */}
      <span className="sr-only">{value}</span>
      <span ref={hostRef} aria-hidden className={`flip-cells ${className}`}>
        {initial.split("").map((char, i) => (
          <span key={i} className="flip-cell">
            {glyph(char)}
          </span>
        ))}
      </span>
    </>
  );
}
