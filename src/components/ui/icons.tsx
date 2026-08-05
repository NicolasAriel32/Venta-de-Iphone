/**
 * Íconos como SVG inline.
 *
 * No se instala una librería de íconos (CLAUDE.md §0, regla 4): son cuatro
 * trazos y cada paquete de íconos que entra al bundle se paga en el
 * presupuesto de 500 KB de la carga inicial.
 *
 * Todos heredan el color con `currentColor` y el tamaño con `em`.
 */

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: "1.25em",
  height: "1.25em",
  "aria-hidden": true,
  focusable: false,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.55L21 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

/** WhatsApp: relleno sólido, no trazo. */
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1.5em"
      height="1.5em"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.3-1.96 1.34-.5.04-.98.22-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.13-.14-.19-1.12-1.49-1.12-2.84 0-1.35.71-2.02.96-2.29a1 1 0 0 1 .73-.34h.52c.17 0 .4-.06.62.47.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.14-.3.3-.13.59.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.65-.14.26.09 1.66.78 1.94.93.29.14.48.21.55.33.07.12.07.69-.17 1.37Z" />
    </svg>
  );
}

export function WarrantyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2c-.6 0-2 .5-4 1.2C6 4 4.5 4.6 3.6 5.1 2.6 5.7 2 6.9 2 8.3v3.4c0 4.2 3.1 8 8 9 4.9-1 8-4.8 8-9V8.3c0-1.4-.6-2.6-1.6-3.2-.9-.5-2.4-1.1-4.4-1.1z" />
      <path d="M9.5 12.5l1.8 1.8L15 11" strokeWidth={1.5} />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7h11v7H3z" />
      <path d="M14 9h4l3 3v2" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="18.5" cy="16.5" r="1.5" />
    </svg>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M2 10h20" strokeWidth={1.5} />
    </svg>
  );
}
