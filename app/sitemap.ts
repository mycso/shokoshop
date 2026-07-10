import type { MetadataRoute } from "next";
import { getGelatoProducts } from "@/lib/gelato-data";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://shokoshop.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  // Category landing pages (e.g. /products?category=music) — indexable
  // entry points that match how shoppers and AI assistants search by theme.
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/products?category=${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getGelatoProducts();
    productRoutes = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: p.images?.length ? p.images.slice(0, 5) : undefined,
      }));
  } catch {
    // Gelato unreachable at build time — ship the sitemap without product URLs
    // rather than failing the whole route.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
