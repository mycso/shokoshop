import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { StarRating } from "@/components/ui/StarRating";
import { getGelatoProducts } from "@/lib/gelato-data";
import { getReviewsSummary } from "@/lib/reviews";
import { colorHex, isLightColor } from "@/lib/colors";
import { CATEGORIES } from "@/lib/categories";

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
      category: localProducts.find((l: any) => l.gelatoProductId === p.id || l.slug === slug)?.category ?? "",
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

export const metadata = {
  title: "Products – ShokoShop",
  description: "Browse our collection of custom printed products.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const allProducts: any[] = await getProducts();
  const reviewSummary = await getReviewsSummary(allProducts.map((p: any) => p.id));

  const products = allProducts.filter((p: any) => {
    if (category && p.category !== category) return false;
    if (q) {
      const query = q.toLowerCase();
      if (
        !p.name.toLowerCase().includes(query) &&
        !p.description.toLowerCase().includes(query)
      ) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          All Products
        </h1>
        <p className="text-gray-500">
          Browse our collection and pick your favourite.
        </p>
      </div>

      {/* Search */}
      <form action="/products" method="GET" className="relative mb-6 max-w-md">
        {category && <input type="hidden" name="category" value={category} />}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </form>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href={q ? `/products?q=${encodeURIComponent(q)}` : "/products"}
          className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
            !category ? "bg-brand text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-brand"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${encodeURIComponent(cat.label)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
              category === cat.label
                ? "bg-brand text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:border-brand"
            }`}
          >
            {cat.emoji} {cat.label}
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-gray-500 py-16 text-center">
          No products match your search.{" "}
          <Link href="/products" className="text-brand underline">
            Clear filters
          </Link>
        </p>
      )}

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {products.map((product: any) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
          >
            <div className={`relative h-52 overflow-hidden ${
              /shirt|tee|hoodie|sweatshirt|apparel/i.test(product.name) || product.category === "Apparel"
                ? "bg-gray-300"
                : "bg-gray-100"
            }`}>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                {product.name}
              </h3>
              {reviewSummary[product.id] && (
                <div className="mt-1">
                  <StarRating avg={reviewSummary[product.id].avg} count={reviewSummary[product.id].count} />
                </div>
              )}
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                {product.description}
              </p>
              {/* Color swatches */}
              {(() => {
                const colorOpt = (product.productVariantOptions ?? []).find(
                  (o: any) => o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour"
                );
                if (!colorOpt || colorOpt.values.length === 0) return null;
                const MAX = 8;
                const shown: string[] = colorOpt.values.slice(0, MAX);
                const extra = colorOpt.values.length - MAX;
                return (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {shown.map((val: string) => {
                      const hex = colorHex(val);
                      const light = isLightColor(hex);
                      return (
                        <span
                          key={val}
                          title={val}
                          className={`w-4 h-4 rounded-full inline-block shrink-0 ${light ? "border border-gray-300" : ""}`}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                    {extra > 0 && (
                      <span className="text-xs text-gray-400 ml-0.5">+{extra}</span>
                    )}
                  </div>
                );
              })()}
              <div className="flex items-center justify-between mt-auto pt-3">
                <span className="text-lg font-bold text-gray-900">
                  {product.price > 0
                    ? <><span className="text-sm font-normal">From </span><PriceDisplay pence={product.price} /></>
                    : "View options"}
                </span>
                <span className="text-xs font-medium text-brand border border-brand px-2 py-1 rounded-full group-hover:bg-brand group-hover:text-white transition-colors">
                  Shop now
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
