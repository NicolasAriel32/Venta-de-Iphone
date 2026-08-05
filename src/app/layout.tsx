import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import brand from "@/brand.config";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--ff-body",
  display: "swap",
});

/* Display más profesional para encabezados y títulos grandes. */
const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--ff-display",
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
    <html lang="es-AR" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
