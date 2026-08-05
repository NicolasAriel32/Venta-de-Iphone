"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * Dispara un evento de tráfico cuando se pinta la pantalla.
 *
 * Dos usos:
 *
 *   <Track />                      en el layout de la tienda → `page_view`
 *   <Track productId={producto.id} /> en la ficha            → `product_view`
 *
 * En una ficha corren los dos, que es lo correcto: la visita cuenta como
 * pantalla vista, y además queda registrado qué producto se miró.
 *
 * No renderiza nada. Es un efecto con forma de componente para poder
 * colgarlo de un Server Component sin convertirlo en cliente.
 */
export default function Track({ productId }: { productId?: string }) {
  const pathname = usePathname();
  // La clave del último evento mandado. Sin esto, el doble montaje del modo
  // estricto en desarrollo duplica cada visita y los números del panel
  // arrancan mintiendo.
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const key = `${productId ?? "page"}:${pathname}`;
    if (sent.current === key) return;
    sent.current = key;

    if (productId) {
      track("product_view", { productId });
    } else {
      track("page_view");
    }
  }, [pathname, productId]);

  return null;
}
