import Link from "next/link";
import Image from "next/image";
import { Archivo_Black } from "next/font/google";
import { ArrowRight, Package, Truck, Star, Zap } from "lucide-react";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { StarRating } from "@/components/ui/StarRating";
import { getGelatoProducts } from "@/lib/gelato-data";
import { getReviewsSummary } from "@/lib/reviews";
import { getAllOrders } from "@/lib/orders";
import { colorHex, isLightColor } from "@/lib/colors";
import { CATEGORIES } from "@/lib/categories";

const archivo = Archivo_Black({ weight: ["400"], subsets: ["latin"] });

const BANNER_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80",
    alt: "Wall art print",
    rotate: "rotate-6",
    z: "z-10",
    pos: "top-10 right-0",
    showDesign: false,
  },
  {
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    alt: "Custom t-shirt",
    rotate: "-rotate-3",
    z: "z-20",
    pos: "top-2 right-28",
    showDesign: true,
  },
  {
    src: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80",
    alt: "Art poster",
    rotate: "rotate-1",
    z: "z-30",
    pos: "top-20 right-56",
    showDesign: false,
  },
];

async function getPopularProducts(limit = 20) {
  const apiKey = process.env.GELATO_API_KEY;
  const storeId = process.env.GELATO_STORE_ID;
  if (!apiKey || !storeId) return [];

  // Count units sold per productId from fulfilled orders
  const salesByProductId: Record<string, number> = {};
  try {
    const orders = await getAllOrders();
    for (const order of orders) {
      if (order.status === "pending" || order.status === "cancelled") continue;
      for (const item of order.items) {
        if (item.productId) {
          salesByProductId[item.productId] = (salesByProductId[item.productId] ?? 0) + item.quantity;
        }
      }
    }
  } catch { /* ignore */ }

  let localProducts: any[] = [];
  try {
    localProducts = await getGelatoProducts();
  } catch { /* ignore */ }

  function mergeLocalData(gelatoId: string, slug: string, apiPriceEur = 0) {
    const match = localProducts.find(
      (l: any) => l.gelatoProductId === gelatoId || l.slug === slug
    );
    if (match) {
      const vp: Record<string, number> = match.variantPrices ?? {};
      const vals = Object.values(vp) as number[];
      return {
        price: vals.length > 0 ? Math.min(...vals) : (match.price ?? 0),
        localImages: (match.images ?? []) as string[],
      };
    }
    const fallback = apiPriceEur > 0 ? Math.round(apiPriceEur * 0.86 * 100) : 0;
    return { price: fallback, localImages: [] as string[] };
  }

  try {
    const res = await fetch(
      `https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products?limit=100&order=desc&orderBy=createdAt`,
      {
        headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list: any[] = Array.isArray(data.products) ? data.products : [];

    const mapped = list.map((p: any) => {
      const name = p.title ?? p.name ?? "Untitled product";
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const variantEurPrices: number[] = (p.variants ?? [])
        .map((v: any) => v.price ?? v.retailPrice ?? 0)
        .filter((n: number) => n > 0);
      const apiPriceEur = variantEurPrices.length > 0
        ? Math.min(...variantEurPrices)
        : (p.price ?? p.retailPrice ?? 0);
      const { price, localImages } = mergeLocalData(p.id, slug, apiPriceEur);
      const apiThumbnail = p.previewUrl ?? p.externalPreviewUrl ?? p.externalThumbnailUrl ?? null;
      return {
        id: p.id,
        slug,
        name,
        description: (p.description ?? "").replace(/<[^>]+>/g, ""),
        price,
        images: localImages.length > 0 ? localImages : apiThumbnail ? [apiThumbnail] : ["/shokoshoplogo.svg"],
        category: p.productVariantOptions?.map((o: any) => o.name).join(" / ") || "Apparel",
        productVariantOptions: p.productVariantOptions ?? [],
        sales: salesByProductId[p.id] ?? 0,
      };
    });

    // Sort by units sold descending, then newest first as tiebreaker
    mapped.sort((a, b) => b.sales - a.sales);
    return mapped.slice(0, limit);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getPopularProducts(20);
  const reviewSummary = await getReviewsSummary(featured.map((p) => p.id));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-accent text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="relative z-10">
              <h1 className={`${archivo.className} text-4xl sm:text-5xl lg:text-6xl uppercase font-extrabold leading-tight tracking-tight mb-6`}>
                Our Designs,{" "}
                <span className="text-yellow-300">Made To<br />Wear &amp; Hang.</span>
              </h1>
              <p className="text-lg sm:text-xl text-pink-100 mb-10 leading-relaxed max-w-lg">
                Premium T-shirts and wall art featuring exclusive designs delivered straight to your door.
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

            {/* Right: stacked product images */}
            <div className="relative h-[520px] hidden lg:block">
              {BANNER_IMAGES.map((img) => (
                <div
                  key={img.alt}
                  className={`absolute ${img.pos} ${img.rotate} ${img.z} w-90 h-100 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                  {img.showDesign && (
                    <div className="absolute inset-0 flex items-start justify-center pt-14">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/shokoshoplogo.svg"
                        alt="ShokoShop design"
                        className="w-20 h-20 object-contain drop-shadow-lg"
                        style={{ mixBlendMode: "multiply" }}
                      />
                    </div>
                  )}
                </div>
              ))}
              {/* subtle glow behind the stack */}
              <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl scale-75 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* background blobs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-300 blur-3xl" />
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Popular Products</h2>
              <p className="text-gray-500 mt-1">Start with our bestsellers</p>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-1 text-brand font-medium hover:text-brand-dark transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                <div className={`relative h-64 overflow-hidden ${
                  /shirt|tee|hoodie|sweatshirt|apparel/i.test(product.name) || product.category === "Apparel"
                    ? "bg-gray-300"
                    : "bg-gray-100"
                }`}>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg group-hover:text-brand transition-colors">
                    {product.name}
                  </h3>
                  {reviewSummary[product.id] && (
                    <div className="mt-1">
                      <StarRating avg={reviewSummary[product.id].avg} count={reviewSummary[product.id].count} />
                    </div>
                  )}
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
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
                    <span className="text-xl font-bold text-gray-900">
                      {product.price > 0
                        ? <><span className="text-sm font-normal">From </span><PriceDisplay pence={product.price} /></>
                        : "View options"}
                    </span>
                    <span className="text-sm font-medium text-brand group-hover:underline">Shop now →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="inline-flex items-center gap-1 text-brand font-medium">
              View all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Shop by Category</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${encodeURIComponent(cat.label)}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-full whitespace-nowrap hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium text-sm shrink-0 shadow-sm"
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6 text-yellow-500" />,
                title: "Exclusive Designs",
                desc: "Unique artwork you won't find anywhere else",
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
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white hover:shadow-md transition-shadow"
              >
                <div className="mb-4 p-3 bg-gray-50 rounded-xl shadow-sm">
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to create something amazing?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of customers who trust ShokoShop for premium T-shirts and wall art.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-brand-dark font-semibold px-10 py-4 rounded-full hover:bg-blue-50 transition-colors text-base shadow-lg"
          >
            Check it out! <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
