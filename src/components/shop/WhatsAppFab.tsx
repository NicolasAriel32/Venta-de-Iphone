import brand from "@/brand.config";
import { WhatsAppIcon } from "@/components/ui/icons";

/**
 * Botón flotante de WhatsApp — FC-5 de SPEC.md.
 *
 * 56 px, abajo a la derecha, dentro de la zona del pulgar y por encima del
 * safe-area del iPhone. Es la salida de emergencia del comprador que no
 * quiere navegar: en este rubro, muchos prefieren preguntar.
 *
 * El número sale de store_config para que el dueño lo cambie desde el panel
 * sin tocar código; brand.config.ts es solo el fallback.
 */
export default function WhatsAppFab({ whatsapp }: { whatsapp?: string }) {
  const number = whatsapp || brand.whatsapp.number;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(brand.whatsapp.defaultMessage)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition-transform active:scale-95"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <WhatsAppIcon />
    </a>
  );
}
