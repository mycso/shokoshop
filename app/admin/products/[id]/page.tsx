"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Wand2 } from "lucide-react";

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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/gelato/store-products/${id}`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        setProduct(data);

        // Pre-fill existing prices from local store
        const localRes = await fetch("/api/gelato/local-products");
        if (localRes.ok) {
          const localList: any[] = await localRes.json();
          const match = localList.find((l: any) => l.gelatoProductId === id);
          if (match?.variantPrices) {
            const pre: Record<string, string> = {};
            for (const [k, v] of Object.entries(match.variantPrices)) {
              pre[k] = String((v as number) / 100);
            }
            setVariantPrices(pre);
          }
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
        body: JSON.stringify({ gelatoProductId: product.id, variantPrices: vp }),
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

