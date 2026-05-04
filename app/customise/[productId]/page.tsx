"use client";

import { useState, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
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
import { use } from "react";
import { getProductById, formatPrice } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

export default function CustomisePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const product = getProductById(productId);
  const router = useRouter();
  const { addItem } = useCart();

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!product) notFound();

  // TypeScript guard after notFound()
  const p = product!;

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

  function handleAddToCart() {
    addItem({
      productId: p.id,
      name: p.name,
      price: selectedVariant?.price ?? p.price,
      quantity,
      image: uploadedImage ?? p.images[0],
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      customDesignUrl: uploadedImage ?? undefined,
    });
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
        <Link href={`/products/${p.slug}`} className="hover:text-gray-700">
          {p.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Customise</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Customise Your {p.name}
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
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
            print quality.
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
                src={p.images[0]}
                alt={p.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{p.name}</p>
              <p className="text-sm text-gray-500">{p.category}</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">
                {formatPrice(selectedVariant?.price ?? p.price)}
              </p>
            </div>
          </div>

          {/* Variant picker */}
          {p.variants && p.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Options
              </label>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
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
                {quantity} × {formatPrice(selectedVariant?.price ?? p.price)}
              </span>
              <span className="font-semibold text-gray-900">
                {formatPrice((selectedVariant?.price ?? p.price) * quantity)}
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
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-indigo-700 transition-colors text-base"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>

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
