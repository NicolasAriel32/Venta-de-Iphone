import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // F2 agrega acá el hostname del bucket de Supabase Storage.
    remotePatterns: [],
    formats: ["image/webp"],
  },
};

export default nextConfig;
