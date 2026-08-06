"use client";

import { useRef } from "react";

/**
 * Cáscara con inclinación 3D y brillo especular que sigue al puntero.
 *
 * Es lo ÚNICO que corre en el navegador de la card: el precio, la imagen y el
 * texto se renderizan en el servidor y entran acá como `children`. Así el
 * efecto cuesta ~40 líneas de bundle en vez de arrastrar `pricing.ts` y
 * `next/image` al cliente por una card.
 *
 * No se activa en touch. Se comprueba con `(hover: hover) and (pointer: fine)`
 * en el momento del evento, no al montar: un teléfono nunca dispara
 * `mousemove`, pero un híbrido con mouse y pantalla táctil sí, y ahí conviene
 * que funcione.
 *
 * El transform se escribe por DOM y no por estado: sesenta `setState` por
 * segundo mientras se mueve el mouse re-renderizarían la card entera.
 */
export default function Tilt({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 7}deg) rotateX(${
      (0.5 - y) * 7
    }deg) translateY(-4px)`;
  }

  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt ${className}`}
    >
      {children}
    </div>
  );
}
