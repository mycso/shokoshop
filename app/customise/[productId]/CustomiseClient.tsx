"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  X,
  Check,
  ImageIcon,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import { formatPrice } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { Product } from "@/types";

export default function CustomiseClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleAddToCart() {
    setUploadError(null);

    if (uploadedFile) {
      setIsUploading(true);
      try {
        const form = new FormData();
        form.append("file", uploadedFile);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "Upload failed");
        }
        const { url } = await res.json() as { url: string };
        addItem({
          productId: product.gelatoProductId ?? product.id,
          name: product.name,
          price: selectedVariant?.price ?? product.price,
          quantity,
          image: url,
          variantId: selectedVariant?.id,
          variantName: selectedVariant?.name,
          customDesignUrl: url,
          // sku holds the Gelato productUid needed for print ordering
          gelatoProductId: selectedVariant?.sku ?? product.gelatoProductId,
        });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else {
      addItem({
        productId: product.gelatoProductId ?? product.id,
        name: product.name,
        price: selectedVariant?.price ?? product.price,
        quantity,
        image: product.images[0],
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name,
        gelatoProductId: selectedVariant?.sku ?? product.gelatoProductId,
      });
    }

    router.push("/cart");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/products" className="hover:text-gray-700">
          Products
        </Link>
        <span>/</span>
        <Link href={`/products/${product.slug}`} className="hover:text-gray-700">
          {product.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Customise</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Customise Your {product.name}
      </h1>
      <p className="text-gray-500 mb-10">
        Upload your design and personalise your order below.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Upload zone */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Your Design
          </h2>

          {uploadedImage ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-400 bg-gray-50 h-80">
              <Image
                src={uploadedImage}
                alt="Your design"
                fill
                className="object-contain p-4"
                unoptimized
              />
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setUploadedFile(null);
                }}
                className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full text-sm font-medium text-green-600 shadow-sm">
                <Check className="h-4 w-4" />
                {uploadedFile?.name ?? "Design uploaded"}
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-1">
                Drag & drop your image here
              </p>
              <p className="text-sm text-gray-400 mb-4">
                PNG, JPG, SVG up to 20MB
              </p>
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Upload className="h-4 w-4" />
                Browse Files
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <p className="text-xs text-gray-400 mt-3">
            Tip: Use high-resolution images (at least 300 DPI) for the best
            product quality.
          </p>
        </div>

        {/* Product options */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Product Options
          </h2>

          {/* Product preview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex gap-4 items-center">
            <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">{product.category}</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">
                {formatPrice(selectedVariant?.price ?? product.price)}
              </p>
            </div>
          </div>

          {/* Variant picker */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Options
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-700 hover:border-indigo-400"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                {quantity} × {formatPrice(selectedVariant?.price ?? product.price)}
              </span>
              <span className="font-semibold text-gray-900">
                {formatPrice((selectedVariant?.price ?? product.price) * quantity)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Calculated at checkout</span>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-indigo-700 transition-colors text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-5 w-5" />
            {isUploading ? "Uploading design…" : "Add to Cart"}
            {!isUploading && <ArrowRight className="h-4 w-4 ml-1" />}
          </button>

          {uploadError && (
            <p className="text-sm text-red-600 text-center mt-3">{uploadError}</p>
          )}

          {!uploadedImage && (
            <p className="text-sm text-amber-600 text-center mt-3">
              ⚠ Upload a design to personalise your product
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
