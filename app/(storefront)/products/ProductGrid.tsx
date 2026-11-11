"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { StarRating } from "@/components/ui/StarRating";
import { colorHex, isLightColor } from "@/lib/colors";

const PAGE_SIZE = 12;

export type GridProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categories: string[];
  inStock: boolean;
  productVariantOptions: { name: string; values: string[] }[];
};

export function ProductGrid({
  products,
  reviewSummary,
}: {
  products: GridProduct[];
  reviewSummary: Record<string, { avg: number; count: number }>;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < products.length;

  // Reset when the filtered list changes (category / search)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [products]);

  // Re-attach after every batch so a sentinel that is still in view loads the next one
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, products.length));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, hasMore, products.length]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.slice(0, visibleCount).map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col"
          >
            <div className={`relative h-52 overflow-hidden ${
              /shirt|tee|hoodie|sweatshirt|apparel/i.test(product.name) || product.categories?.includes("Apparel")
                ? "bg-gray-300 dark:bg-gray-700"
                : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {!product.inStock ? (
                <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Out of Stock
                  </span>
                </div>
              ) : product.price === 0 ? (
                <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-brand animate-spin" />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Syncing…</span>
                </div>
              ) : null}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                {product.name}
              </h3>
              {reviewSummary[product.id] && (
                <div className="mt-1">
                  <StarRating avg={reviewSummary[product.id].avg} count={reviewSummary[product.id].count} />
                </div>
              )}
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 line-clamp-2">
                {product.description}
              </p>
              {/* Color swatches */}
              {(() => {
                const colorOpt = (product.productVariantOptions ?? []).find(
                  (o) => o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour"
                );
                if (!colorOpt || colorOpt.values.length === 0) return null;
                const MAX = 8;
                const shown: string[] = colorOpt.values.slice(0, MAX);
                const extra = colorOpt.values.length - MAX;
                return (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {shown.map((val) => {
                      const hex = colorHex(val);
                      const light = isLightColor(hex);
                      return (
                        <span
                          key={val}
                          title={val}
                          className={`w-4 h-4 rounded-full inline-block shrink-0 ${light ? "border border-gray-300 dark:border-gray-600" : ""}`}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                    {extra > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-0.5">+{extra}</span>
                    )}
                  </div>
                );
              })()}
              <div className="flex items-center justify-between mt-auto pt-3">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {product.price > 0 ? (
                    <><span className="text-sm font-normal">From </span><PriceDisplay pence={product.price} /></>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                      <span className="h-3 w-3 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-brand animate-spin" />
                      Syncing…
                    </span>
                  )}
                </span>
                <span className="text-xs font-medium text-brand border border-brand px-2 py-1 rounded-full group-hover:bg-brand group-hover:text-white transition-colors">
                  Shop now
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-10">
          <div className="h-6 w-6 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-brand animate-spin" />
        </div>
      )}
    </>
  );
}
