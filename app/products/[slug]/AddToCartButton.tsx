"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]
  );

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: selectedVariant?.price ?? product.price,
      quantity: 1,
      image: product.images[0],
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
        added
          ? "bg-green-500 text-white"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" /> Added!
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> Add to Cart
        </>
      )}
    </button>
  );
}
