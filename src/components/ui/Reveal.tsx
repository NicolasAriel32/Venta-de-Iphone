"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Revelado al entrar en viewport, una sola vez.
 *
 * Reemplaza a Framer Motion, que el brief proponía: son 30 líneas contra
 * ~34 KB gzip, y el presupuesto de la home son 500 KB (CLAUDE.md §1, regla 4
 * de §0). El `once: true` que pedía el brief acá es `unobserve` al primer
 * cruce: una sección revelada no se vuelve a animar al scrollear para arriba.
 *
 * El escalonado va por `delay` en milisegundos, no por índice mágico: el que
 * llama sabe qué orden quiere.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Con reduced-motion no se observa nada. Tampoco hace falta tocar el
    // estado: el `@media (prefers-reduced-motion)` de globals.css ya deja el
    // bloque visible. Un observer que solo sirve para que la transición dure
    // 0,01 ms es trabajo al pedo.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Navegador sin IntersectionObserver: el contenido tiene que verse igual.
    // Se escribe la clase en el DOM en lugar de llamar a setState, que dentro
    // del cuerpo de un efecto dispara un render en cascada.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${shown ? "is-in" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
