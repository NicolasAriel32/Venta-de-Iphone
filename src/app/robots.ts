import type { MetadataRoute } from "next";
import brand from "@/brand.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El panel y la API no tienen nada que hacer en el índice.
      disallow: ["/admin", "/api"],
    },
    sitemap: `${brand.url}/sitemap.xml`,
  };
}
