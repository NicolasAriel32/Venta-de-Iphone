/**
 * brand.config.ts — Identidad de la instancia.
 *
 * REGLA DURA (CLAUDE.md §9, decisión 07):
 * Toda la identidad de la tienda vive acá y en ningún otro lado.
 * Si el nombre, el color, el WhatsApp o una red social aparecen escritos
 * a mano dentro de un componente, es un bug.
 *
 * Cambiar de marca = editar este archivo. Nada más.
 *
 * Los valores que el dueño puede editar desde el panel (F5) viven en
 * `store_config` y pisan a estos en runtime. Estos son el fallback:
 * lo que se ve mientras la base todavía no respondió, o si nunca se tocó
 * el panel. Por eso tienen que ser valores presentables, no placeholders.
 */

export const brand = {
  /** Nombre visible. Se renderiza en mayúsculas por CSS, no lo escribas gritando acá. */
  name: "IPHONEX10",

  /** Prefijo de los códigos de pedido: IPX-0142 */
  orderPrefix: "IPX",

  /** Frase corta bajo el logo y en la metadata. Sin signos de exclamación. */
  tagline: "Tecnología con precio claro",

  description:
    "Celulares, notebooks, consolas y accesorios. Precios actualizados, stock real y atención directa por WhatsApp.",

  /**
   * WhatsApp en formato internacional, solo dígitos, sin + ni espacios.
   * Argentina móvil: 54 + 9 + área sin 0 + número sin 15.
   */
  whatsapp: {
    number: "5491122463840",
    /** Se usa en el botón flotante y donde no haya contexto de producto. */
    defaultMessage: "Hola IPHONEX10! Quería hacer una consulta.",
  },

  social: {
    instagram: "https://instagram.com/",
    facebook: "",
    tiktok: "",
  },

  /**
   * Tokens de color. Se reflejan como CSS vars en globals.css.
   *
   * El acento ámbar no es solo estética: además de la tienda, pinta el
   * widget de Retell y la barra de estado de la PWA. Si acá quedara el azul
   * viejo, el chat de Bart seguiría siendo azul sobre una tienda ámbar.
   */
  colors: {
    accent: "#F2B23C",
    /** Color de la barra de estado del navegador y de la PWA. */
    theme: "#070A0E",
  },

  /**
   * Textos de confianza. Editables desde /admin/config en F5.
   * `payment` NO se calcula: es texto. Ver CLAUDE.md §9, decisión 12.
   */
  notes: {
    payment: "Crédito en cuotas y hasta 2 tarjetas",
    shipping: "Envíos a todo el país",
    warranty: "Garantía de 6 meses",
  },

  /**
   * Dominio de producción, sin barra final.
   *
   * Es el canónico: `gestionint.site` responde 308 hacia `www`. Alimenta
   * `metadataBase`, el Open Graph, el sitemap y las URLs que el endpoint
   * del asistente le pasa al chat, así que apuntar al viejo de Netlify
   * mandaba a la nada todo link compartido por WhatsApp.
   */
  url: "https://www.gestionint.site",
} as const;

export type Brand = typeof brand;

/** Arma un link a WhatsApp con el mensaje ya codificado. */
export function whatsappLink(message: string = brand.whatsapp.defaultMessage): string {
  return `https://wa.me/${brand.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export default brand;
