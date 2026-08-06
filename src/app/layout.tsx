import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Bricolage_Grotesque } from "next/font/google";
import brand from "@/brand.config";
import "./globals.css";

/* Body neutral y técnico — legible en precios largos y specs. Variable (100-700). */
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--ff-body",
  display: "swap",
});

/**
 * Display — el elemento tipográfico protagonista (CLAUDE.md §3).
 * Variable font de peso alto: los precios y títulos usan extremos de peso
 * (800/900), nunca un 500 tibio. Reemplaza a Playfair: una serif editorial
 * no comunica "precio claro" en una tienda de tecnología.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--ff-display",
  display: "swap",
});

/**
 * Mono — la voz de "pizarra" (decisión 61).
 *
 * Todo número del sitio (cotización, precios, capacidades, contadores) sale
 * en esta fuente con `tabular-nums`, así al actualizarse no corre el layout
 * ni un pixel. Es lo que hace que la pizarra se lea como una lista de local
 * y no como una tabla web.
 *
 * A diferencia de las otras dos, IBM Plex Mono NO es variable: hay que
 * declarar los pesos o next/font no sabe cuáles bajar. Es la excepción a la
 * decisión 20, no una contradicción — son tres archivos de ~14 KB cada uno.
 */
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} · ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: brand.name,
    title: `${brand.name} · ${brand.tagline}`,
    description: brand.description,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: brand.colors.theme,
  width: "device-width",
  initialScale: 1,
  /* Sin maximumScale: bloquear el zoom es una falla de accesibilidad. */
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-AR"
      className={`${body.variable} ${display.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
