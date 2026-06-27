"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { Product, ProductVariantOption } from "@/types";
import type { Review } from "@/lib/reviews";

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

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={onChange ? "button" : undefined}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={onChange ? `Rate ${i} star${i > 1 ? "s" : ""}` : undefined}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              i <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 0, text: "" });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) { setFormError("Please select a star rating"); return; }
    if (!form.name.trim() || !form.text.trim()) { setFormError("Name and review text are required"); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      setReviews((prev) => [...prev, data.review]);
      setSubmitted(true);
      setShowForm(false);
      setForm({ name: "", rating: 0, text: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={Math.round(avg)} />
              <span className="text-sm text-gray-500">
                {avg.toFixed(1)} out of 5 · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-semibold text-brand border border-brand px-4 py-2 rounded-xl hover:bg-brand-light transition-colors"
          >
            Write a review
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-4">
          <h3 className="font-semibold text-gray-900">Your Review</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={80}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="e.g. Sarah M."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              maxLength={1000}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              placeholder="What did you think of this product?"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-brand text-white font-semibold py-2.5 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors text-sm"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-8 text-sm text-green-700 font-medium">
          Thanks for your review!
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet — be the first!</p>
      ) : (
        <div className="space-y-6">
          {[...reviews].reverse().map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <StarRating value={r.rating} />
                <span className="font-semibold text-gray-900 text-sm">{r.name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  "white": "#FFFFFF", "black": "#111111", "navy": "#1B2A4A", "navy blue": "#1B2A4A",
  "red": "#CC0000", "royal blue": "#2B64B8", "blue": "#2B64B8",
  "forest green": "#2D6A2D", "green": "#2D6A2D", "kelly green": "#4CBB17",
  "grey": "#9E9E9E", "gray": "#9E9E9E", "heather grey": "#B2B2B2", "heather gray": "#B2B2B2",
  "sport grey": "#C0C0C0", "sport gray": "#C0C0C0", "ash": "#B2BEB5", "charcoal": "#36454F",
  "dark grey": "#555555", "dark gray": "#555555", "slate": "#708090",
  "maroon": "#800000", "burgundy": "#800020", "purple": "#6A0DAD", "lavender": "#E6E6FA",
  "yellow": "#FFD700", "gold": "#C9A800", "orange": "#FF6600", "coral": "#FF6B6B",
  "pink": "#FF69B4", "blush": "#DE5D83", "hot pink": "#FF1493",
  "light blue": "#87CEEB", "sky blue": "#87CEEB", "carolina blue": "#56A0D3",
  "teal": "#008080", "aqua": "#00CED1", "mint": "#98FF98",
  "sand": "#F4E2C0", "natural": "#F5F5DC", "cream": "#FFFDD0", "off white": "#FAF9F6",
  "beige": "#F5F5DC", "stone": "#8A8070", "brown": "#8B4513", "tan": "#D2B48C",
  "olive": "#808000", "vintage white": "#F5F5F0",
};

function colorHex(name: string): string | null {
  return COLOR_MAP[name.toLowerCase()] ?? null;
}

export default function ProductView({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [added, setAdded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

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
    // Gelato per-colour mockups first — the poster for the selected colour
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
    // Then product-level images (Gelato poster + any custom uploaded photos)
    for (const url of product.images ?? []) {
      const key = imageKey(url);
      if (!seen.has(key)) { seen.add(key); out.push(url); }
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

  const productId = product.gelatoProductId ?? product.id;

  return (
    <div>
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
          {options.map((opt) => {
            const isColorOpt = opt.name.toLowerCase() === "color" || opt.name.toLowerCase() === "colour";
            return (
              <div key={opt.name}>
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  {opt.name}
                  {isColorOpt && selection[opt.name] && (
                    <span className="font-normal text-gray-500 ml-1.5">— {selection[opt.name]}</span>
                  )}
                </span>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((val) => {
                    const isSelected = selection[opt.name] === val;
                    const price = hasPrices ? priceForValue(opt.name, val) : null;
                    const hex = isColorOpt ? colorHex(val) : null;

                    if (hex) {
                      const isLight = ["#FFFFFF", "#FAF9F6", "#FFFDD0", "#F5F5DC", "#F5F5F0", "#F4E2C0", "#E6E6FA"].includes(hex);
                      return (
                        <button
                          key={val}
                          type="button"
                          title={val}
                          onClick={() => setSelection((s) => ({ ...s, [opt.name]: val }))}
                          className={`relative w-9 h-9 rounded-full transition-all ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-brand scale-110"
                              : "hover:scale-105"
                          } ${isLight ? "border border-gray-300" : ""}`}
                          style={{ backgroundColor: hex }}
                        >
                          {isSelected && (
                            <span
                              className="absolute inset-0 flex items-center justify-center text-xs"
                              style={{ color: isLight ? "#111" : "#fff" }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    }

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
            );
          })}
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
    <ReviewsSection productId={productId} />
    </div>
  );
}
