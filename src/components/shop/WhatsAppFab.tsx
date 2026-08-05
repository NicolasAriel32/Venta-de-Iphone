"use client";

import { usePathname } from "next/navigation";
import brand from "@/brand.config";
import { WhatsAppIcon } from "@/components/ui/icons";
import { trackWhatsApp } from "@/lib/analytics";

/**
 * Botón flotante de WhatsApp — FC-5 de SPEC.md.
 *
 * 56 px, abajo a la izquierda, dentro de la zona del pulgar y por encima del
 * safe-area del iPhone. Es la salida de emergencia del comprador que no
 * quiere navegar: en este rubro, muchos prefieren preguntar.
 *
 * Va a la izquierda porque el widget de Retell se ancla a la derecha con
 * `bottom: 24px; right: 24px; z-index: 999999` y ahí también aparece su
 * burbuja de aviso. Apilarlo arriba no sirve: la burbuja usa `bottom: 90px`
 * en móvil, justo donde caería este botón.
 *
 * El z-index alto no es capricho. Retell envuelve su botón en un
 * `_fabWrapBase` de ancho completo (345 px en un viewport de 375) que
 * reactiva `pointer-events: auto` sobre el `pointer-events: none` de su
 * contenedor. Esa franja invisible se traga los toques de todo el borde
 * inferior, así que hay que quedar por encima de sus 999999 o el botón
 * se ve pero no responde.
 *
 * El número sale de store_config para que el dueño lo cambie desde el panel
 * sin tocar código; brand.config.ts es solo el fallback.
 */

/** `/productos/algo` sí; `/productos` no. */
const PRODUCT_DETAIL = /^\/productos\/[^/]+$/;

export default function WhatsAppFab({ whatsapp }: { whatsapp?: string }) {
  const pathname = usePathname();

  // En la ficha de producto no se dibuja: esa pantalla ya tiene su propia
  // barra fija con un botón de WhatsApp, y esa barra tiene que quedar por
  // encima de Retell para que "Agregar al carrito" responda al toque
  // (decisión 51). Con las dos cosas, el flotante quedaba tapado y
  // duplicado. Una sola salida a WhatsApp por pantalla.
  if (PRODUCT_DETAIL.test(pathname)) return null;

  const number = whatsapp || brand.whatsapp.number;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(brand.whatsapp.defaultMessage)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      // El evento sale por `sendBeacon`, que sobrevive a que el navegador se
      // vaya a la app de WhatsApp en el mismo gesto.
      onClick={() => trackWhatsApp("fab")}
      className="fixed left-4 z-[1000000] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition-transform active:scale-95"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <WhatsAppIcon />
    </a>
  );
}
