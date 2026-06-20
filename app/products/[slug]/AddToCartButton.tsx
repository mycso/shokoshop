"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Product, ProductVariantOption } from "@/types";

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const options: ProductVariantOption[] = product.productVariantOptions ?? [];
  const variants = product.variants ?? [];
  const variantPrices: Record<string, number> = product.variantPrices ?? {};

  // Build initial selection: first value of each option
  const initialSelection: Record<string, string> = {};
  for (const opt of options) {
    if (opt.values.length > 0) initialSelection[opt.name] = opt.values[0];
  }
  const [selection, setSelection] = useState<Record<string, string>>(initialSelection);

  /** Find the variant whose title contains ALL values from a given selection map */
  function findVariant(sel: Record<string, string>) {
    if (variants.length === 0) return null;
    if (options.length === 0) return variants[0];
    return (
      variants.find((v) =>
        Object.values(sel).every((val) => (v.name ?? "").includes(val))
      ) ?? variants[0]
    );
  }

  const selectedVariant = useMemo(() => findVariant(selection), [selection]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPrice = useMemo(() => {
    if (selectedVariant && variantPrices[selectedVariant.id]) {
      return variantPrices[selectedVariant.id];
    }
    return product.price;
  }, [selectedVariant, variantPrices, product.price]);

  /** Get the price for a hypothetical selection where optionName = val */
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
      image: product.images[0],
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
    <div className="space-y-5">
      {/* Variant pickers with per-value prices */}
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

      {/* Selected total price */}
      {selectedPrice > 0 && (
        <div className="flex items-baseline gap-2 pt-1 border-t border-gray-100">
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
          added
            ? "bg-green-500 text-white"
            : "bg-brand text-white hover:bg-brand-dark"
        }`}
      >
        {added ? (
          <>
            <Check className="h-5 w-5" /> Added to cart!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" /> Add to Cart
          </>
        )}
      </button>
    </div>
  );
}

