"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Wand2, Upload, X, ImageIcon, Download, FileImage, CheckCircle2, ArrowUp } from "lucide-react";
import { CATEGORIES, detectCategory } from "@/lib/categories";

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

interface GelatoVariant {
  id: string;
  title: string;
  productUid: string;
  connectionStatus: string;
}

interface GelatoProduct {
  id: string;
  title: string;
  description: string;
  status: string;
  previewUrl?: string;
  variants: GelatoVariant[];
  productVariantOptions: { name: string; values: string[] }[];
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<GelatoProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [variantPrices, setVariantPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillStatus, setAutoFillStatus] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [designFilename, setDesignFilename] = useState<string | null>(null);
  const [designUploading, setDesignUploading] = useState(false);
  const [designUploadError, setDesignUploadError] = useState<string | null>(null);
  const [fetchingDesign, setFetchingDesign] = useState(false);
  const [fetchDesignMsg, setFetchDesignMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/gelato/store-products/${id}`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        setProduct(data);

        // Pre-fill existing prices and custom images from local store
        let hasPrices = false;
        let hasImages = false;
        const localRes = await fetch("/api/gelato/local-products");
        if (localRes.ok) {
          const localList: any[] = await localRes.json();
          const match = localList.find((l: any) => l.gelatoProductId === id);
          if (match?.variantPrices && Object.keys(match.variantPrices).length > 0) {
            hasPrices = true;
            const pre: Record<string, string> = {};
            for (const [k, v] of Object.entries(match.variantPrices)) {
              pre[k] = String((v as number) / 100);
            }
            setVariantPrices(pre);
          }
          if (match?.category) setCategory(match.category);
          if (match?.images?.length) { hasImages = true; setCustomImages(match.images); }
          if (match?.designFilename) setDesignFilename(match.designFilename);
        }

        // Auto-fill prices from Gelato when none are saved yet
        if (!hasPrices && data.variants?.length) {
          try {
            const priceRes = await fetch("/api/gelato/variant-prices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: id, variants: data.variants.map((v: any) => ({ id: v.id })) }),
            });
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              const gelatoPrices: Record<string, number> = priceData.prices ?? {};
              const newPrices: Record<string, string> = {};
              const newPricesPence: Record<string, number> = {};
              for (const v of data.variants) {
                const p = gelatoPrices[v.id];
                if (p && p > 0) {
                  newPrices[v.id] = String((p / 100).toFixed(2));
                  newPricesPence[v.id] = p;
                }
              }
              if (Object.keys(newPrices).length > 0) {
                setVariantPrices(newPrices);
                // Persist so the storefront picks them up
                await fetch("/api/gelato/local-products", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ gelatoProductId: id, variantPrices: newPricesPence }),
                });
              }
            }
          } catch { /* non-fatal — admin can fill manually */ }
        }

        // Auto-import Gelato mockup images when none are saved yet
        if (!hasImages) {
          try {
            const imgRes = await fetch("/api/admin/product-images", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: id }),
            });
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              if (imgData.images?.length) setCustomImages(imgData.images);
            }
          } catch { /* non-fatal */ }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoadingProduct(false);
      }
    }
    load();
  }, [id]);

  function handlePriceChange(variantId: string, value: string) {
    setVariantPrices((prev) => ({ ...prev, [variantId]: value }));
  }

  async function autoFillPrices() {
    if (!product) return;
    setAutoFilling(true);
    setAutoFillStatus(null);
    try {
      const res = await fetch("/api/gelato/variant-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variants: product.variants.map((v) => ({ id: v.id })),
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch prices from Gelato");
      const data = await res.json();
      const gelatoPrices: Record<string, number> = data.prices ?? {};

      let filled = 0;
      const newPrices: Record<string, string> = { ...variantPrices };
      for (const v of product.variants) {
        const price = gelatoPrices[v.id];
        if (price && price > 0) {
          newPrices[v.id] = String((price / 100).toFixed(2));
          filled++;
        }
      }

      if (filled > 0) {
        setVariantPrices(newPrices);
        const note = data.eurToGbp ? ` (converted at EUR→GBP ${data.eurToGbp.toFixed(4)})` : "";
        setAutoFillStatus(`✓ Filled prices for ${filled} variant${filled > 1 ? "s" : ""}${note} — adjust your margin before saving`);
      } else {
        setAutoFillStatus("No prices returned. Enter prices manually.");
      }
    } catch (err) {
      setAutoFillStatus(err instanceof Error ? err.message : "Auto-fill failed");
    } finally {
      setAutoFilling(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      for (const file of files) form.append("file", file);
      form.append("productId", id);
      const res = await fetch("/api/admin/product-images", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setCustomImages(data.images);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleImportFromGelato() {
    setImporting(true);
    setUploadError(null);
    try {
      const res = await fetch("/api/admin/product-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setCustomImages(data.images);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleImageDelete(url: string) {
    try {
      const res = await fetch("/api/admin/product-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setCustomImages(data.images);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleImageMoveFirst(url: string) {
    const reordered = [url, ...customImages.filter((u) => u !== url)];
    setCustomImages(reordered);
    try {
      await fetch("/api/admin/product-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, images: reordered }),
      });
    } catch { /* ignore — optimistic update already applied */ }
  }

  async function handleDesignUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDesignUploading(true);
    setDesignUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", id);
      const res = await fetch("/api/admin/design-file", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDesignFilename(data.designFilename);
    } catch (err) {
      setDesignUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setDesignUploading(false);
      e.target.value = "";
    }
  }

  async function handleDesignDelete() {
    try {
      const res = await fetch("/api/admin/design-file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setDesignFilename(null);
    } catch (err) {
      setDesignUploadError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleFetchDesignFromGelato() {
    setFetchingDesign(true);
    setFetchDesignMsg(null);
    setDesignUploadError(null);
    try {
      const res = await fetch("/api/admin/sync-designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      const data = await res.json();
      if (data.success && data.designFilename) {
        setDesignFilename(data.designFilename);
        setFetchDesignMsg("Design fetched and saved from Gelato.");
      } else {
        setFetchDesignMsg(data.message ?? data.error ?? "No design file available from Gelato.");
      }
    } catch (err: any) {
      setFetchDesignMsg(`Error: ${err.message}`);
    } finally {
      setFetchingDesign(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError(null);

    const vp: Record<string, number> = {};
    for (const [k, v] of Object.entries(variantPrices)) {
      const parsed = parseFloat(v);
      if (!isNaN(parsed) && parsed > 0) vp[k] = Math.round(parsed * 100);
    }

    try {
      const res = await fetch("/api/gelato/local-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gelatoProductId: product.id, variantPrices: vp, category: category || undefined }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => router.push("/admin/products"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">{error ?? "Product not found."}</p>
        <Link href="/admin/products" className="text-brand hover:underline mt-4 block">
          Back to products
        </Link>
      </div>
    );
  }

  const vpPence = Object.values(variantPrices)
    .map((v) => Math.round(parseFloat(v) * 100))
    .filter((v) => !isNaN(v) && v > 0);
  const fromPrice = vpPence.length > 0 ? Math.min(...vpPence) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/products"
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set Variant Prices</h1>
          <p className="text-sm text-gray-500 truncate max-w-xs">{product.title}</p>
        </div>
      </div>

      {/* Product preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-4">
        {product.previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.previewUrl} alt={product.title} className="h-20 w-20 rounded-xl object-cover bg-gray-100" />
        )}
        <div>
          <p className="font-semibold text-gray-900">{product.title}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{product.id}</p>
          <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {product.status}
          </span>
          {fromPrice > 0 && (
            <p className="text-sm text-brand font-semibold mt-1">From {formatPrice(fromPrice)}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Design file for print fulfillment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-semibold text-gray-900">Design File</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Optional override. When not set, Gelato uses the design already saved in the product template — including the neck label for inner-label products.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFetchDesignFromGelato}
                disabled={fetchingDesign || designUploading}
                className={`flex items-center gap-1.5 text-sm font-medium border px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 ${fetchingDesign ? "border-gray-200 text-gray-400" : "border-brand text-brand hover:bg-brand-light"}`}
              >
                {fetchingDesign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {fetchingDesign ? "Fetching…" : "Fetch from Gelato"}
              </button>
              <label className={`flex items-center gap-1.5 text-sm font-medium text-white bg-brand px-3 py-1.5 rounded-xl hover:bg-brand-dark transition-colors cursor-pointer ${designUploading ? "opacity-60 pointer-events-none" : ""}`}>
                {designUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {designUploading ? "Uploading…" : designFilename ? "Replace" : "Upload override"}
                <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={handleDesignUpload} disabled={designUploading} />
              </label>
            </div>
          </div>
          {(designUploadError || fetchDesignMsg) && (
            <p className={`text-sm rounded-xl px-3 py-2 mt-3 border ${(designUploadError ?? fetchDesignMsg ?? "").startsWith("Error") || designUploadError ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
              {designUploadError ?? fetchDesignMsg}
            </p>
          )}
          {designFilename ? (
            <div className="mt-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">Design file set</p>
                <p className="text-xs text-green-600 font-mono truncate">{designFilename}</p>
              </div>
              <button type="button" onClick={handleDesignDelete} className="text-green-500 hover:text-red-500 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700">Using Gelato template design — main print file and neck label are provided automatically from the product template.</p>
            </div>
          )}
        </div>

        {/* Custom images */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Custom Images</h2>
              <p className="text-sm text-gray-500 mt-0.5">Lifestyle or editorial photos — shown first in the carousel for all colours.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleImportFromGelato}
                disabled={importing || uploading}
                className="flex items-center gap-1.5 text-sm font-medium text-brand border border-brand px-3 py-1.5 rounded-xl hover:bg-brand-light disabled:opacity-50 transition-colors"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {importing ? "Importing…" : "Import from Gelato"}
              </button>
              <label className={`flex items-center gap-1.5 text-sm font-medium text-white bg-brand px-3 py-1.5 rounded-xl hover:bg-brand-dark transition-colors cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>
          {uploadError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{uploadError}</p>
          )}
          {customImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              <ImageIcon className="h-8 w-8 mb-2" />
              <p className="text-sm">No custom images yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {customImages.map((url, idx) => (
                <div key={url} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-24 w-full object-cover rounded-xl bg-gray-100" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-brand text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                      First
                    </span>
                  )}
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx !== 0 && (
                      <button
                        type="button"
                        title="Move to first"
                        onClick={() => handleImageMoveFirst(url)}
                        className="bg-black/60 hover:bg-brand text-white rounded-full p-0.5"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleImageDelete(url)}
                      className="bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">Category</h2>
            <button
              type="button"
              onClick={() => {
                const text = `${product.title} ${product.description ?? ""}`;
                const detected = detectCategory(text);
                if (detected) setCategory(detected);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-brand border border-brand px-2.5 py-1 rounded-lg hover:bg-brand-light transition-colors"
            >
              <Wand2 className="h-3 w-3" /> Auto-assign
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Used for storefront filtering and the homepage category grid.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${!category ? "bg-brand text-white border-brand" : "bg-white border-gray-200 text-gray-600 hover:border-brand"}`}
            >
              None
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.label)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${category === cat.label ? "bg-brand text-white border-brand" : "bg-white border-gray-200 text-gray-600 hover:border-brand"}`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-semibold text-gray-900">Variant Prices</h2>
              <p className="text-sm text-gray-500 mt-1 mb-5">
                Set a price (£) for each variant. The lowest price shows as "From £X" in the store.
              </p>
            </div>
            <button
              type="button"
              onClick={autoFillPrices}
              disabled={autoFilling}
              className="flex items-center gap-1.5 text-sm font-medium text-brand border border-brand px-3 py-1.5 rounded-lg hover:bg-brand-light disabled:opacity-50 transition-colors flex-shrink-0 ml-4"
            >
              {autoFilling ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching…</>
              ) : (
                <><Wand2 className="h-3.5 w-3.5" /> Auto-fill from Gelato</>
              )}
            </button>
          </div>
          {autoFillStatus && (
            <p className={`text-xs mb-4 px-3 py-2 rounded-lg ${autoFillStatus.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              {autoFillStatus}
            </p>
          )}
          <div className="space-y-3">
            {product.variants.map((v) => (
              <div key={v.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{v.title}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{v.productUid}</p>
                </div>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={variantPrices[v.id] ?? ""}
                    onChange={(e) => handlePriceChange(v.id, e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || saved}
            className="flex-1 flex items-center justify-center gap-2 bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : saved ? (
              "Saved!"
            ) : (
              <><Save className="h-4 w-4" /> Save Prices</>
            )}
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

