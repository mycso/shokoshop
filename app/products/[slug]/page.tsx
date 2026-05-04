import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Package, Star, Truck } from "lucide-react";
import { getProductBySlug, formatPrice, MOCK_PRODUCTS } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";

export async function generateStaticParams() {
  return MOCK_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} – ShokoShop`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-700">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-700">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className="relative h-20 rounded-xl overflow-hidden bg-gray-100 cursor-pointer border-2 border-transparent hover:border-indigo-400 transition-colors"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="mb-2">
            <span className="text-sm text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full">
              {product.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-sm text-gray-500">(24 reviews)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">
            {formatPrice(product.price)}
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Options
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <span
                    key={v.id}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Perks */}
          <ul className="space-y-2 mb-8">
            {[
              "Upload your own artwork",
              "Ships in 3-7 business days",
              "Premium print quality",
              "Satisfaction guaranteed",
            ].map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/customise/${product.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Customise & Order
              <ArrowRight className="h-4 w-4" />
            </Link>
            <AddToCartButton product={product} />
          </div>

          {/* Trust */}
          <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4" /> Free shipping over £50
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" /> Printed by Gelato
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
