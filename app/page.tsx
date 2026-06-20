import Link from "next/link";
import Image from "next/image";
import { Archivo_Black } from "next/font/google";
import { ArrowRight, Package, Truck, Star, Zap } from "lucide-react";
import { formatPrice } from "@/lib/products";
import fs from "fs";
import path from "path";

const archivo = Archivo_Black({ weight: ["400"], subsets: ["latin"] });

async function getPopularProducts(limit = 3) {
  const apiKey = process.env.GELATO_API_KEY;
  const storeId = process.env.GELATO_STORE_ID;
  if (!apiKey || !storeId) return [];

  let localProducts: any[] = [];
  try {
    const lp = path.resolve(process.cwd(), ".local-products.json");
    if (fs.existsSync(lp)) {
      localProducts = JSON.parse(fs.readFileSync(lp, "utf-8") || "[]");
    }
  } catch { /* ignore */ }

  function mergeLocalData(gelatoId: string, slug: string) {
    const match = localProducts.find(
      (l: any) => l.gelatoProductId === gelatoId || l.slug === slug
    );
    if (!match) return { price: 0, localImages: [] as string[] };
    const vp: Record<string, number> = match.variantPrices ?? {};
    const vals = Object.values(vp) as number[];
    return {
      price: vals.length > 0 ? Math.min(...vals) : (match.price ?? 0),
      localImages: (match.images ?? []) as string[],
    };
  }

  try {
    const res = await fetch(
      `https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products?limit=${limit}&order=desc&orderBy=createdAt`,
      {
        headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list: any[] = Array.isArray(data.products) ? data.products.slice(0, limit) : [];

    return list.map((p: any) => {
      const name = p.title ?? p.name ?? "Untitled product";
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { price, localImages } = mergeLocalData(p.id, slug);
      const apiThumbnail = p.previewUrl ?? p.externalPreviewUrl ?? p.externalThumbnailUrl ?? null;
      return {
        id: p.id,
        slug,
        name,
        description: (p.description ?? "").replace(/<[^>]+>/g, ""),
        price,
        images: localImages.length > 0 ? localImages : apiThumbnail ? [apiThumbnail] : ["/shokoshoplogo.svg"],
        category: p.productVariantOptions?.map((o: any) => o.name).join(" / ") || "Apparel",
      };
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getPopularProducts(3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-[#e70a9b] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-2xl">
            <h1 className={`${archivo.className} text-4xl sm:text-5xl lg:text-7xl uppercase font-extrabold leading-tight tracking-tight mb-6`}>
              Our Designs, <br />
              <span className="text-yellow-300 lg:text-8xl"><span className="lg:text-[7.2rem]">Made To</span> <span className="lg:text-7xl"> Wear & Hang.</span></span>
            </h1>
            <p className="text-lg sm:text-xl text-pink-100 mb-10 leading-relaxed">
              Upload your artwork, choose a T-shirt or wall art product, and we&apos;ll
              produce and ship it straight to your door. High-quality apparel and
              wall art made easy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#e70a9b] font-semibold px-8 py-4 rounded-full hover:bg-pink-50 transition-colors text-base shadow-lg"
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
                    icon: <Star className="h-6 w-6 text-brand" />,
                    title: "Premium Quality",
                    desc: "Gallery-quality materials and finishes",
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
              className="hidden sm:flex items-center gap-1 text-brand font-medium hover:text-brand-dark transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                <div className="relative h-56 bg-gray-100 overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg group-hover:text-brand transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <span className="text-xl font-bold text-gray-900">
                      {product.price > 0 ? `From ${formatPrice(product.price)}` : "View options"}
                    </span>
                    <span className="text-sm font-medium text-brand group-hover:underline">
                      Shop now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-brand font-medium"
            >
              View all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand text-white py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to create something amazing?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of customers who trust ShokoShop for custom T-shirts and wall art.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-brand-dark font-semibold px-10 py-4 rounded-full hover:bg-blue-50 transition-colors text-base shadow-lg"
          >
            Start Creating <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
