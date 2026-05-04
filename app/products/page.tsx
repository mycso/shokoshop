import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal } from "lucide-react";
import { MOCK_PRODUCTS, formatPrice } from "@/lib/products";

export const metadata = {
  title: "Products – ShokoShop",
  description: "Browse our full range of custom print-on-demand products.",
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  // Note: In Next.js 15+ searchParams is a Promise on server components
  // We'll handle it synchronously for simplicity here via a client approach
  const categories = Array.from(
    new Set(MOCK_PRODUCTS.map((p) => p.category))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          All Products
        </h1>
        <p className="text-gray-500">
          Choose a product and upload your custom design.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Category:</span>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/products"
              className="text-sm px-3 py-1.5 rounded-full bg-indigo-600 text-white font-medium"
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${encodeURIComponent(cat)}`}
                className="text-sm px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-indigo-400 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="relative h-52 bg-gray-100 overflow-hidden">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full border border-gray-200">
                  {product.category}
                </span>
              </div>
              {!product.inStock && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs font-medium text-indigo-600 border border-indigo-200 px-2 py-1 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  Customise
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
