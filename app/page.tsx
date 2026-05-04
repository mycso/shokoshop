import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Truck, Star, Zap } from "lucide-react";
import { MOCK_PRODUCTS, formatPrice } from "@/lib/products";

export default function HomePage() {
  const featured = MOCK_PRODUCTS.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Your Design, <br />
              <span className="text-yellow-300">Printed Perfectly.</span>
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100 mb-10 leading-relaxed">
              Upload your artwork, choose your product, and we&apos;ll print and
              ship it straight to your door. Premium print-on-demand, made
              simple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-4 rounded-full hover:bg-indigo-50 transition-colors text-base shadow-lg"
              >
                Browse Products
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-base"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-300 blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6 text-yellow-500" />,
                title: "Instant Customisation",
                desc: "Upload your design in seconds",
              },
              {
                icon: <Star className="h-6 w-6 text-indigo-500" />,
                title: "Premium Quality",
                desc: "Professional-grade printing",
              },
              {
                icon: <Truck className="h-6 w-6 text-green-500" />,
                title: "Fast Shipping",
                desc: "Delivered in 3–7 business days",
              },
              {
                icon: <Package className="h-6 w-6 text-purple-500" />,
                title: "100+ Products",
                desc: "T-shirts, mugs, posters & more",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 p-3 bg-white rounded-xl shadow-sm">
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Popular Products
              </h2>
              <p className="text-gray-500 mt-1">
                Start with our bestsellers
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-56 bg-gray-100 overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm font-medium text-indigo-600 group-hover:underline">
                      Customise →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-indigo-600 font-medium"
            >
              View all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to create something amazing?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Join thousands of creators who trust ShokoShop for their custom
            print needs.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-10 py-4 rounded-full hover:bg-indigo-50 transition-colors text-base shadow-lg"
          >
            Start Creating <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
