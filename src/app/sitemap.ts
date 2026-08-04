import type { MetadataRoute } from "next";
import brand from "@/brand.config";
import { getAllProductSlugs, getCategories } from "@/lib/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getAllProductSlugs(),
    getCategories(),
  ]);

  const now = new Date();

  return [
    { url: brand.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${brand.url}/productos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categories.map((c) => ({
      url: `${brand.url}/productos?cat=${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${brand.url}/productos/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
