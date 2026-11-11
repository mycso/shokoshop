import Link from "next/link";
import { ProductGrid } from "./ProductGrid";
import { Search } from "lucide-react";
import { getGelatoProducts } from "@/lib/gelato-data";
import { getReviewsSummary } from "@/lib/reviews";
import { colorHex } from "@/lib/colors";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { jsonLd } from "@/lib/json-ld";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://shokoshop.com";

async function getProducts() {
  const apiKey = process.env.GELATO_API_KEY!;
  const storeId = process.env.GELATO_STORE_ID!;

  // Load live-cached prices/images (Gelato + admin overrides)
  let localProducts: any[] = [];
  try {
    localProducts = await getGelatoProducts();
  } catch { /* ignore */ }

  function mergePrice(gelatoId: string, slug: string, apiPriceEur = 0): { price: number; variantPrices: Record<string, number>; localImages: string[] } {
    const match = localProducts.find(
      (l: any) => l.gelatoProductId === gelatoId || l.slug === slug
    );
    if (match) {
      const vp: Record<string, number> = match.variantPrices ?? {};
      const vpValues = Object.values(vp) as number[];
      const price = vpValues.length > 0 ? Math.min(...vpValues) : (match.price ?? 0);
      return { price, variantPrices: vp, localImages: match.images ?? [] };
    }
    // Fallback: convert the Gelato list-API price from EUR to GBP pence
    const fallback = apiPriceEur > 0 ? Math.round(apiPriceEur * 0.86 * 100) : 0;
    return { price: fallback, variantPrices: {}, localImages: [] };
  }

  const res = await fetch(
    `https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products?limit=100&order=desc&orderBy=createdAt`,
    {
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    console.error("Gelato product list failed:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const list: any[] = Array.isArray(data.products) ? data.products : [];

  return list.map((p: any) => {
    const name = p.title ?? p.name ?? "Untitled product";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // Best-effort price from the list API variants (EUR → GBP pence fallback)
    const variantEurPrices: number[] = (p.variants ?? [])
      .map((v: any) => v.price ?? v.retailPrice ?? 0)
      .filter((n: number) => n > 0);
    const apiPriceEur = variantEurPrices.length > 0
      ? Math.min(...variantEurPrices)
      : (p.price ?? p.retailPrice ?? 0);
    const { price, variantPrices, localImages } = mergePrice(p.id, slug, apiPriceEur);
    const apiThumbnail = p.previewUrl ?? p.externalPreviewUrl ?? p.externalThumbnailUrl ?? null;
    const images = localImages.length > 0 ? localImages : apiThumbnail ? [apiThumbnail] : ["/shokoshoplogo.svg"];
    const rawOpts: any[] = p.productVariantOptions ?? [];
    const hasColorOpt = rawOpts.some(
      (o: any) => o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour"
    );
    const productVariantOptions = hasColorOpt ? rawOpts : (() => {
      const seen = new Set<string>();
      const colorVals: string[] = [];
      for (const v of (p.variants ?? [])) {
        const title: string = v.title ?? v.name ?? "";
        const part = title.split(" - ")[0].trim();
        if (part && !seen.has(part) && colorHex(part) !== "#9E9E9E") {
          seen.add(part);
          colorVals.push(part);
        }
      }
      return colorVals.length > 0
        ? [...rawOpts, { name: "Color", values: colorVals }]
        : rawOpts;
    })();

    return {
      id: p.id,
      slug,
      name,
      description: (p.description ?? "").replace(/<[^>]+>/g, ""),
      price,
      variantPrices,
      images,
      categories: localProducts.find((l: any) => l.gelatoProductId === p.id || l.slug === slug)?.categories ?? [],
      inStock: p.status !== "inactive" && p.status !== "deleted",
      variants: (p.variants ?? []).map((v: any) => ({
        id: v.id,
        name: v.title,
        price: variantPrices[v.id] ?? price,
        sku: v.productUid ?? v.id,
        productUid: v.productUid,
      })),
      productVariantOptions,
      gelatoProductId: p.id,
    };
  });
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  // Category pages act as themed landing pages (e.g. "Music" merch) — give
  // each one its own targeted title/description so it can rank and convert
  // on its own, rather than every filter sharing one generic listing page.
  if (category) {
    const label = categoryLabel(category);
    const title = `${label} T-Shirts, Hoodies & Wall Art`;
    const description = `Shop custom ${label.toLowerCase()}-inspired T-shirts, hoodies and wall art. Exclusive designs, premium print quality, fast UK delivery.`;
    const url = `/products?category=${category}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url },
    };
  }

  // Search-result pages are thin, near-duplicate content — keep them out of
  // the index, but leave crawling open so the links they contain still get
  // followed.
  if (q) {
    return {
      title: `Search results for "${q}"`,
      description: `Products matching "${q}" at ShokoShop.`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: "All Products",
    description:
      "Browse the full ShokoShop collection — custom T-shirts, hoodies, posters and canvas prints across music, film, sports, kids, art and culture themes.",
    alternates: { canonical: "/products" },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const allProducts: any[] = await getProducts();
  const reviewSummary = await getReviewsSummary(allProducts.map((p: any) => p.id));

  const products = allProducts.filter((p: any) => {
    if (category && !p.categories?.includes(category)) return false;
    if (q) {
      const query = q.toLowerCase();
      if (
        !p.name.toLowerCase().includes(query) &&
        !p.description.toLowerCase().includes(query)
      ) return false;
    }
    return true;
  });

  // ItemList structured data so search engines and AI shopping assistants
  // can read the catalogue (name, price, image) directly off this page
  // without needing to crawl every product page individually.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.slice(0, 50).map((p, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE_URL}/products/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListJsonLd) }}
      />
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          All Products
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse our collection and pick your favourite.
        </p>
      </div>

      {/* Search */}
      <form action="/products" method="GET" className="relative mb-6 max-w-md">
        {category && <input type="hidden" name="category" value={category} />}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
        />
      </form>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href={q ? `/products?q=${encodeURIComponent(q)}` : "/products"}
          className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
            !category ? "bg-brand text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-brand"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
              category === cat.slug
                ? "bg-brand text-white"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-brand"
            }`}
          >
            {cat.emoji} {cat.label}
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 py-16 text-center">
          No products match your search.{" "}
          <Link href="/products" className="text-brand underline">
            Clear filters
          </Link>
        </p>
      )}

      {/* Products grid (lazy-loaded in batches) */}
      <ProductGrid
        products={products.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          price: p.price,
          images: p.images,
          categories: p.categories,
          inStock: p.inStock,
          productVariantOptions: p.productVariantOptions,
        }))}
        reviewSummary={reviewSummary}
      />
    </div>
  );
}
