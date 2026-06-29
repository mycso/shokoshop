"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { Product, ProductVariantOption } from "@/types";
import type { Review } from "@/lib/reviews";
import { colorHex, isLightColor } from "@/lib/colors";

// Images are served via /api/blob-image?path=<blob pathname>, so the
// Return a stable identity key for an image URL so that the same underlying
// image is never shown twice in the carousel, regardless of whether it is
// served as a private-blob proxy URL or as a raw signed Gelato CDN URL.
//
// Blob proxy:   /api/blob-image?path=gelato-previews/{uuid}.jpg  → "{uuid}"
// Gelato CDN:   https://…/store_product_image/{uuid}/…?sig=…     → "{uuid}"
// Admin upload: /api/blob-image?path=product-images/…            → full path
// Other:        strip query string, use pathname
function imageKey(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.pathname === "/api/blob-image") {
      const inner = parsed.searchParams.get("path") ?? "";
      const m = inner.match(/gelato-previews\/([a-f0-9-]+)/i);
      if (m) return m[1];
      return inner;
    }
    const m = parsed.pathname.match(/store_product_image\/([a-f0-9-]+)/i);
    if (m) return m[1];
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

export default function ProductView({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [added, setAdded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const isPoster = /print|poster|wall\s*art|canvas|aluminum|aluminium|metal|framed/i.test(product.name);
  const options: ProductVariantOption[] = (product.productVariantOptions ?? [])
    .filter((o) => !(isPoster && (o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour")));
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
  const selectedVariantInStock = selectedVariant ? (selectedVariant.inStock !== false) : true;

  // Images for the selected colour only, gathered across all its sizes (a
  // size missing its own preview still shows the colour via a sibling size).
  // Falls back to the generic product image(s) if this colour has none yet.
  const selectedColor = selection["Color"];
  const colorImages: string[] = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    // Lead with the same image shown on product cards so the carousel is consistent
    const heroImage = product.images?.[0];
    if (heroImage) {
      seen.add(imageKey(heroImage));
      out.push(heroImage);
    }
    // Gelato per-colour mockups next — the poster for the selected colour
    let colorHasImages = false;
    if (selectedColor) {
      for (const v of variants) {
        const vopts = v.variantOptions ?? {};
        if (vopts.Color !== selectedColor) continue;
        for (const url of variantImages[v.id] ?? []) {
          const key = imageKey(url);
          if (!seen.has(key)) { seen.add(key); out.push(url); colorHasImages = true; }
        }
      }
    }
    // If the selected colour has no specific mockups, show all variant images so
    // the carousel is never empty — covers cases where Gelato scoped images to
    // only one colour or the sync hasn't assigned them to every variant yet.
    if (!colorHasImages) {
      for (const imgs of Object.values(variantImages)) {
        for (const url of imgs) {
          const key = imageKey(url);
          if (!seen.has(key)) { seen.add(key); out.push(url); }
        }
      }
    }
    // Then remaining product-level images
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
            // Name of the colour option (used to cross-check availability for other options)
            const colorOptName = options.find(
              (o) => o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour"
            )?.name;
            const selectedColorValue = colorOptName ? selection[colorOptName] : null;

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

                    // For non-colour options, hide values with no available variant for the selected colour
                    if (!isColorOpt && selectedColorValue && colorOptName) {
                      const available = variants.some((v) => {
                        const vopts = (v as any).variantOptions ?? {};
                        return vopts[colorOptName] === selectedColorValue && vopts[opt.name] === val;
                      });
                      if (!available) return null;
                    }

                    if (isColorOpt) {
                      const hex = colorHex(val);
                      const isLight = isLightColor(hex);
                      return (
                        <button
                          key={val}
                          type="button"
                          title={val}
                          onClick={() => {
                            const newSel: Record<string, string> = { ...selection, [opt.name]: val };
                            // Reset other options (e.g. Size) to first available value for the new colour
                            for (const other of options) {
                              if (other.name === opt.name) continue;
                              const currentStillValid = variants.some((vr) => {
                                const vo = (vr as any).variantOptions ?? {};
                                return vo[opt.name] === val && vo[other.name] === selection[other.name];
                              });
                              if (!currentStillValid) {
                                const firstValid = other.values.find((v2) =>
                                  variants.some((vr) => {
                                    const vo = (vr as any).variantOptions ?? {};
                                    return vo[opt.name] === val && vo[other.name] === v2;
                                  })
                                );
                                if (firstValid) newSel[other.name] = firstValid;
                              }
                            }
                            setSelection(newSel);
                          }}
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

                    // Check if this specific option value results in an out-of-stock variant
                    const hypotheticalVariant = findVariant({ ...selection, [opt.name]: val });
                    const optionInStock = hypotheticalVariant ? (hypotheticalVariant.inStock !== false) : true;

                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => optionInStock && setSelection((s) => ({ ...s, [opt.name]: val }))}
                        disabled={!optionInStock}
                        title={!optionInStock ? "Out of stock" : undefined}
                        className={`relative flex flex-col items-center px-4 py-2.5 rounded-xl border-2 font-medium transition-all min-w-[64px] ${
                          !optionInStock
                            ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                            : isSelected
                            ? "border-brand bg-brand-light text-brand-dark"
                            : "border-gray-200 text-gray-700 hover:border-brand"
                        }`}
                      >
                        <span className="text-sm">{val}</span>
                        {!optionInStock ? (
                          <span className="text-xs mt-0.5 text-gray-400">Out of stock</span>
                        ) : price != null && price > 0 ? (
                          <span className={`text-xs mt-0.5 ${isSelected ? "text-brand" : "text-gray-400"}`}>
                            {formatPrice(price)}
                          </span>
                        ) : null}
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
          disabled={!selectedVariantInStock}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-base transition-all ${
            !selectedVariantInStock
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : added
              ? "bg-green-500 text-white"
              : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          {!selectedVariantInStock ? (
            "Out of Stock"
          ) : added ? (
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
