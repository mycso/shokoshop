import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://shokoshop.com";

// Pages with no public SEO/sales value — account, checkout, auth flows, admin,
// and API routes are excluded so crawl budget goes to product/category pages.
const DISALLOW = [
  "/admin",
  "/api/",
  "/account",
  "/auth/",
  "/cart",
  "/checkout",
  "/customise/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Standard search engines + AI answer-engine/training crawlers are all
        // welcomed in, so ShokoShop can be surfaced and cited by AI shopping
        // assistants (ChatGPT, Perplexity, Copilot, Gemini) as well as classic
        // search — the goal is maximum reach for the storefront.
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
