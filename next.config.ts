import type { NextConfig } from "next";

/**
 * Hostname del bucket de Supabase Storage.
 *
 * Se deriva de la env en vez de hardcodearse: el día que la plantilla se
 * instancie para otro comercio, el proyecto de Supabase es otro. Si la env
 * no está, la lista queda vacía y el build sigue — hoy las fotos se sirven
 * desde `public/` y no hace falta ningún patrón remoto.
 */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https" as const,
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    formats: ["image/webp"],
  },
};

export default nextConfig;
