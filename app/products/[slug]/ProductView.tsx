"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { Product, ProductVariantOption } from "@/types";

// Images are served via /api/blob-image?path=<blob pathname>, so the
// distinguishing part lives in the query string, not the route path — unwrap
// it before comparing. Falls back to stripping any query string for other
// URLs (e.g. a raw, re-signed Gelato URL, where the path alone identifies it).
function imageKey(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.pathname === "/api/blob-image") {
      const inner = parsed.searchParams.get("path");
      if (inner) return inner;
    }
    return parsed.pathname;
  } catch {
    return url.split("?")[0];
  }
}

function Gallery({
  images,
  name,
  activeIndex,
  onSelect,
}: {
  images: string[];
  name: string;
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  function prev() {
    onSelect(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  }
  function next() {
    onSelect(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  }

  // console.log("Gallery images:", images);

  return (
    <div className="space-y-3">
      <div className="relative h-96 lg:h-[570px] rounded-2xl overflow-hidden bg-gray-100 group">
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${name} – image ${activeIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          priority
          unoptimized
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === activeIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`relative h-20 rounded-xl overflow-hidden bg-gray-100 border-2 transition-colors ${
                i === activeIndex
                  ? "border-brand"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductView({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [added, setAdded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  console.log("ProductView product:", product);

  const options: ProductVariantOption[] = product.productVariantOptions ?? [];
  const variants = product.variants ?? [];
  const variantPrices: Record<string, number> = product.variantPrices ?? {};
  const variantImages: Record<string, string[]> = product.variantImages ?? {};

  // Initial selection: first value of each option
  const initialSelection: Record<string, string> = {};
  for (const opt of options) {
    if (opt.values.length > 0) initialSelection[opt.name] = opt.values[0];
  }
  const [selection, setSelection] = useState<Record<string, string>>(initialSelection);

  /** Find the variant whose variantOptions match ALL selected values */
  function findVariant(sel: Record<string, string>) {
    if (variants.length === 0) return null;
    if (options.length === 0) return variants[0];
    return (
      variants.find((v) => {
        const vopts: Record<string, string> = (v as any).variantOptions ?? {};
        // Match via structured variantOptions if available
        if (Object.keys(vopts).length > 0) {
          return Object.entries(sel).every(([k, val]) => vopts[k] === val);
        }
        // Fallback: check title contains all selected values
        return Object.values(sel).every((val) => (v.name ?? "").includes(val));
      }) ?? variants[0]
    );
  }

  const selectedVariant = useMemo(() => findVariant(selection), [selection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Images for the selected colour only, gathered across all its sizes (a
  // size missing its own preview still shows the colour via a sibling size).
  // Falls back to the generic product image(s) if this colour has none yet.
  const selectedColor = selection["Color"];
  const colorImages: string[] = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    // Custom admin-uploaded images always appear first
    for (const url of product.images ?? []) {
      const key = imageKey(url);
      if (!seen.has(key)) { seen.add(key); out.push(url); }
    }
    // Then Gelato per-colour mockups
    if (selectedColor) {
      for (const v of variants) {
        const vopts = v.variantOptions ?? {};
        if (vopts.Color !== selectedColor) continue;
        for (const url of variantImages[v.id] ?? []) {
          const key = imageKey(url);
          if (!seen.has(key)) { seen.add(key); out.push(url); }
        }
      }
    }
    return out.length > 0 ? out : ["/shokoshoplogo.svg"];
  }, [selectedColor, variants, variantImages, product.images]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Reset to the first image whenever the selected colour changes
  const [lastColor, setLastColor] = useState(selectedColor);
  if (selectedColor !== lastColor) {
    setLastColor(selectedColor);
    setActiveIndex(0);
  }

  const displayIndex = Math.min(activeIndex, colorImages.length - 1);

  const selectedPrice = useMemo(() => {
    if (selectedVariant && variantPrices[selectedVariant.id]) {
      return variantPrices[selectedVariant.id];
    }
    return product.price;
  }, [selectedVariant, variantPrices, product.price]);

  function priceForValue(optionName: string, val: string): number | null {
    const hypothetical = { ...selection, [optionName]: val };
    const v = findVariant(hypothetical);
    if (!v) return null;
    return variantPrices[v.id] ?? product.price ?? null;
  }

  function handleAdd() {
    if (!selectedVariant && variants.length > 0) return;
    addItem({
      productId: product.gelatoProductId ?? product.id,
      name: product.name,
      price: selectedPrice,
      quantity: 1,
      image: colorImages[displayIndex] ?? product.images[0],
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      // sku holds the Gelato productUid needed for print ordering
      gelatoProductId: selectedVariant?.sku ?? product.gelatoProductId,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const hasPrices = Object.keys(variantPrices).length > 0 || product.price > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Gallery — driven by selected variant */}
      <Gallery
        images={colorImages}
        name={product.name}
        activeIndex={displayIndex}
        onSelect={(i) => setActiveIndex(i)}
      />

      {/* Info + variant picker */}
      <div>
        {/* <div className="mb-2">
          <span className="text-sm text-brand font-semibold bg-brand-light px-3 py-1 rounded-full">
            {product.category}
          </span>
        </div> */}
        <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-4">
          {product.name}
        </h1>
        <div className="mb-6">
          <p
            className={`text-gray-600 leading-relaxed ${
              descExpanded ? "" : "line-clamp-6"
            }`}
          >
            {(product.description ?? "").replace(/<[^>]+>/g, "")}
          </p>
          {(product.description ?? "").replace(/<[^>]+>/g, "").length > 160 && (
            <button
              type="button"
              onClick={() => setDescExpanded((e) => !e)}
              className="text-sm font-semibold text-brand hover:text-brand-dark mt-1"
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Variant pickers */}
        <div className="space-y-5 mb-6">
          {options.map((opt) => (
            <div key={opt.name}>
              <span className="block text-sm font-semibold text-gray-700 mb-2">{opt.name}</span>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val) => {
                  const isSelected = selection[opt.name] === val;
                  const price = hasPrices ? priceForValue(opt.name, val) : null;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelection((s) => ({ ...s, [opt.name]: val }))}
                      className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 font-medium transition-all min-w-[64px] ${
                        isSelected
                          ? "border-brand bg-brand-light text-brand-dark"
                          : "border-gray-200 text-gray-700 hover:border-brand"
                      }`}
                    >
                      <span className="text-sm">{val}</span>
                      {price != null && price > 0 && (
                        <span className={`text-xs mt-0.5 ${isSelected ? "text-brand" : "text-gray-400"}`}>
                          {formatPrice(price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected price */}
        {selectedPrice > 0 && (
          <div className="flex items-baseline gap-2 pt-1 border-t border-gray-100 mb-5">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(selectedPrice)}</span>
            {selectedVariant && (
              <span className="text-sm text-gray-500">{selectedVariant.name}</span>
            )}
          </div>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-base transition-all ${
            added ? "bg-green-500 text-white" : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          {added ? (
            <><Check className="h-5 w-5" /> Added to cart!</>
          ) : (
            <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
          )}
        </button>

        {/* Perks */}
        <ul className="space-y-2 mt-8">
          {[
            "Ships in 3–7 business days",
            "Premium print quality",
            "Produced & fulfilled by Gelato",
            "Satisfaction guaranteed",
          ].map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        {/* Trust badges */}
        <div className="mt-6 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" /> Free shipping over £50
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4" /> Produced by Gelato
          </div>
        </div>
      </div>
    </div>
  );
}
