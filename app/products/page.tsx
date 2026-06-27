import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { getGelatoProducts } from "@/lib/gelato-data";
import { CATEGORIES } from "@/lib/categories";

async function getProducts() {
  const apiKey = process.env.GELATO_API_KEY!;
  const storeId = process.env.GELATO_STORE_ID!;

  // Load live-cached prices/images (Gelato + admin overrides)
  let localProducts: any[] = [];
  try {
    localProducts = await getGelatoProducts();
  } catch { /* ignore */ }

  function mergePrice(gelatoId: string, slug: string): { price: number; variantPrices: Record<string, number>; localImages: string[] } {
    const match = localProducts.find(
      (l: any) => l.gelatoProductId === gelatoId || l.slug === slug
    );
    if (!match) return { price: 0, variantPrices: {}, localImages: [] };
    const vp: Record<string, number> = match.variantPrices ?? {};
    const vpValues = Object.values(vp) as number[];
    const price = vpValues.length > 0 ? Math.min(...vpValues) : (match.price ?? 0);
    return { price, variantPrices: vp, localImages: match.images ?? [] };
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
    const { price, variantPrices, localImages } = mergePrice(p.id, slug);
    const apiThumbnail = p.previewUrl ?? p.externalPreviewUrl ?? p.externalThumbnailUrl ?? null;
    const images = localImages.length > 0 ? localImages : apiThumbnail ? [apiThumbnail] : ["/shokoshoplogo.svg"];

    return {
      id: p.id,
      slug,
      name,
      description: (p.description ?? "").replace(/<[^>]+>/g, ""),
      price,
      variantPrices,
      images,
      category: localProducts.find((l: any) => l.gelatoProductId === p.id || l.slug === slug)?.category ?? "",
      inStock: true,
      variants: (p.variants ?? []).map((v: any) => ({
        id: v.id,
        name: v.title,
        price: variantPrices[v.id] ?? price,
        sku: v.productUid ?? v.id,
        productUid: v.productUid,
      })),
      productVariantOptions: p.productVariantOptions ?? [],
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
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                {product.description}
              </p>
              {(product.productVariantOptions ?? []).map((opt: any) => (
                <div key={opt.name} className="flex flex-wrap gap-1 mt-2">
                  {opt.values.map((val: string) => (
                    <span key={val} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      {val}
                    </span>
                  ))}
                </div>
              ))}
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
