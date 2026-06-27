"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, RefreshCw, Wand2 } from "lucide-react";
import { formatPrice } from "@/lib/products";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState<string | null>(null);
  const autoSyncedRef = useRef(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const [storeRes, lpRes] = await Promise.all([
        fetch("/api/gelato/store-products"),
        fetch("/api/gelato/local-products"),
      ]);
      const data = await storeRes.json();
      const list = Array.isArray(data.products) ? data.products : [];
      const localProducts: any[] = await lpRes.json();

      const mapped = list.map((p: any) => {
        const name = p.title ?? p.name ?? "Untitled";
        const slug = toSlug(name);
        const local = localProducts.find((l: any) => l.gelatoProductId === p.id || l.slug === slug);
        const variantPrices: Record<string, number> = local?.variantPrices ?? {};
        const vals = Object.values(variantPrices) as number[];
        let price = vals.length > 0 ? Math.min(...vals) : (local?.price ?? 0);

        // Fallback: derive price from Gelato list-API variant data (EUR → GBP pence)
        if (price === 0) {
          const eurPrices: number[] = (p.variants ?? [])
            .map((v: any) => v.price ?? v.retailPrice ?? 0)
            .filter((n: number) => n > 0);
          const minEur = eurPrices.length > 0 ? Math.min(...eurPrices) : (p.price ?? p.retailPrice ?? 0);
          if (minEur > 0) price = Math.round(minEur * 0.86 * 100);
        }

        return { ...p, name, slug, price, category: local?.category ?? "", thumbnail: p.previewUrl ?? p.externalPreviewUrl ?? p.externalThumbnailUrl ?? null };
      });

      setProducts(mapped);

      // Auto-sync once if any product still has no price after the fallback
      if (!autoSyncedRef.current && mapped.some((p: any) => p.price === 0)) {
        autoSyncedRef.current = true;
        syncPricesInBackground();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function syncPricesInBackground() {
    setSyncing(true);
    try {
      const res = await fetch("/api/gelato/sync-prices", { method: "POST" });
      const data = await res.json();
      setSyncLog(data.log ?? []);
      await loadProducts();
    } catch { /* silent */ } finally {
      setSyncing(false);
    }
  }

  async function syncPrices() {
    setSyncing(true);
    setSyncLog([]);
    try {
      const res = await fetch("/api/gelato/sync-prices", { method: "POST" });
      const data = await res.json();
      setSyncLog(data.log ?? []);
      await loadProducts();
    } catch (e: any) {
      setSyncLog([`Error: ${e.message}`]);
    } finally {
      setSyncing(false);
    }
  }


  async function autoAssignCategories() {
    setAutoAssigning(true);
    setAutoAssignResult(null);
    try {
      const res = await fetch("/api/admin/auto-assign-categories", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAutoAssignResult(`Assigned categories to ${data.assigned} of ${data.total} products.`);
      await loadProducts();
    } catch (e: any) {
      setAutoAssignResult(`Error: ${e.message}`);
    } finally {
      setAutoAssigning(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoAssignCategories}
            disabled={autoAssigning || syncing}
            className="inline-flex items-center gap-1.5 border border-brand text-brand px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-60"
          >
            <Wand2 className={`h-4 w-4 ${autoAssigning ? "animate-pulse" : ""}`} />
            {autoAssigning ? "Assigning…" : "Auto-assign Categories"}
          </button>
          <button
            onClick={syncPrices}
            disabled={syncing || autoAssigning}
            className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Prices from Gelato"}
          </button>
        </div>
      </div>

      {autoAssignResult && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${autoAssignResult.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {autoAssignResult}
        </div>
      )}

      {syncLog.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <p className="font-semibold mb-1">Sync complete:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {syncLog.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading products…</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">From Price</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.thumbnail ? (
                          <Image src={product.thumbnail} alt={product.name} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{product.id}</p>
                        {product.category && (
                          <span className="text-xs text-brand font-medium">{product.category}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      product.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {product.status ?? "unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {product.price > 0
                      ? `From ${formatPrice(product.price)}`
                      : syncing
                        ? <span className="text-gray-400 font-normal text-xs">Syncing…</span>
                        : <span className="text-gray-400 font-normal text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
