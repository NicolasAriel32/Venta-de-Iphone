"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FlipCells from "./FlipCells";
import type { BoardSnapshot } from "@/lib/board";

/** Cada cuánto se pregunta por la cotización. Igual que el ISR del catálogo. */
const POLL_MS = 60_000;

/**
 * Anchos de columna, en caracteres. Son fijos: es lo que hace que al girar
 * un dígito no se mueva ni una fila.
 */
const W = { name: 20, usd: 6, ars: 13, stock: 10 } as const;

/**
 * La pizarra de precios — elemento firma de la home.
 *
 * Los datos llegan renderizados desde el servidor (`initial`) y de ahí en más
 * se refrescan solos contra `/api/rate`, que devuelve los pesos **ya
 * calculados**. Acá no se multiplica nada: si el navegador redondeara por su
 * cuenta, el precio cambiaría solo al hidratar.
 *
 * El giro lo decide `FlipCells` carácter por carácter. Con el blue quieto la
 * pizarra no se mueve, que es todo el punto.
 */
export default function PriceBoard({ initial }: { initial: BoardSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);

  useEffect(() => {
    let alive = true;

    async function pull() {
      // Con la pestaña en segundo plano no se consulta: son datos móviles.
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/rate", { cache: "no-store" });
        if (!res.ok) return; // Se queda con lo último bueno que tuvo.
        const next = (await res.json()) as BoardSnapshot;
        if (alive) setSnapshot(next);
      } catch {
        // La pizarra sigue mostrando el último valor conocido. Vaciarla
        // porque se cayó la red sería peor que quedarse quieta.
      }
    }

    const id = window.setInterval(pull, POLL_MS);
    document.addEventListener("visibilitychange", pull);

    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", pull);
    };
  }, []);

  const { rate, rows } = snapshot;
  const empty = rows.length === 0;

  return (
    <div className="board">
      <div className="board-head">
        <span className="board-title">Pizarra de precios</span>
        <span className="mono">
          {rate.value > 0 ? `${rate.value.toLocaleString("es-AR")} ARS/USD` : "sin cotización"}
        </span>
      </div>

      <div className="board-cols" aria-hidden>
        <span>Modelo</span>
        <span className="board-usd text-right">USD</span>
        <span className="text-right">Contado $</span>
        <span className="board-stock text-right">Estado</span>
      </div>

      <div className="board-body">
        {empty ? (
          // Estado de carga / base sin responder. Guiones parpadeando en el
          // mismo ancho que una fila real: el bloque no cambia de alto, así
          // que cuando lleguen los datos no salta nada.
          <BoardSkeleton />
        ) : (
          rows.map((row) => (
            <Link key={row.slug} href={`/productos/${row.slug}`} className="brow">
              <span className="cells">
                <FlipCells value={row.name} width={W.name} />
              </span>
              <span className="cells board-usd text-right">
                <FlipCells value={String(row.usd)} width={W.usd} align="right" />
              </span>
              <span className="cells board-ars text-right">
                <FlipCells value={row.arsLabel} width={W.ars} align="right" />
              </span>
              <span
                className={`cells board-stock text-right ${
                  row.stock === "in_stock" ? "board-in" : "board-out"
                }`}
              >
                <FlipCells value={row.stockLabel} width={W.stock} align="right" />
              </span>
            </Link>
          ))
        )}
      </div>

      <div className="board-foot">
        {/* Estado de error de cotización: se dice de dónde salió el número.
            Nunca un precio en blanco ni un cero disfrazado de precio. */}
        <span>{rate.label}</span>
        {rows.some((r) => r.fromPrice) && <span>+ desde, según capacidad</span>}
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-live="polite">
      <p className="sr-only">Cargando la lista de precios</p>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="brow" aria-hidden>
          <span className="cells board-loading">{"_".repeat(W.name)}</span>
          <span className="cells board-usd board-loading text-right">{"_".repeat(W.usd)}</span>
          <span className="cells board-loading text-right">{"_".repeat(W.ars)}</span>
          <span className="cells board-stock board-loading text-right">
            {"_".repeat(W.stock)}
          </span>
        </div>
      ))}
    </div>
  );
}
