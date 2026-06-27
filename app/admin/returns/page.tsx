"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageX, Check, X, RefreshCw } from "lucide-react";
import { ReturnRequest } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  refunded: "bg-green-100 text-green-700",
};

const REASON_LABELS: Record<string, string> = {
  damaged:          "Damaged",
  wrong_item:       "Wrong item",
  not_as_described: "Not as described",
  changed_mind:     "Changed mind",
  other:            "Other",
};

const RESOLUTION_LABELS: Record<string, string> = {
  refund:       "Refund",
  exchange:     "Exchange",
  store_credit: "Store credit",
};

function formatPrice(pence?: number) {
  if (!pence) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/returns");
    const data = await res.json();
    setReturns(data.returns ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handle(id: string, action: "approve" | "reject") {
    setActing(id + action);
    setError(null);
    const res = await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      await load();
    }
    setActing(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <PackageX className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Returns &amp; Refunds</h1>
            <p className="text-sm text-gray-500">Approve to trigger an automatic Stripe refund</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : returns.length === 0 ? (
        <div className="text-center py-20">
          <PackageX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No return requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Left: details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-gray-500">
                      #{r.id.slice(-8).toUpperCase()}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                    <Link
                      href={`/admin/orders/${r.orderId}`}
                      className="text-xs text-brand hover:underline"
                    >
                      Order #{r.orderId.slice(-8).toUpperCase()} →
                    </Link>
                  </div>

                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{r.customerEmail}</span>
                    <span className="text-gray-400 mx-1.5">·</span>
                    {REASON_LABELS[r.reason] ?? r.reason}
                    <span className="text-gray-400 mx-1.5">·</span>
                    {RESOLUTION_LABELS[r.resolution] ?? r.resolution}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {r.items.map((item) => (
                      <span key={item.itemId} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>

                  {r.description && (
                    <p className="text-xs text-gray-500 italic">&ldquo;{r.description}&rdquo;</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      Refund amount: <span className="font-semibold text-gray-700">{formatPrice(r.refundAmount)}</span>
                    </span>
                    {r.stripePaymentIntentId ? (
                      <span className="text-green-600 font-medium">✓ Stripe PI linked</span>
                    ) : (
                      <span className="text-orange-500">No Stripe PI — manual refund needed</span>
                    )}
                    {r.stripeRefundId && (
                      <span className="font-mono text-gray-500">Refund: {r.stripeRefundId}</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">
                    Submitted {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                {/* Right: actions */}
                {r.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handle(r.id, "approve")}
                      disabled={!!acting}
                      className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      {acting === r.id + "approve" ? "Processing…" : "Approve & Refund"}
                    </button>
                    <button
                      onClick={() => handle(r.id, "reject")}
                      disabled={!!acting}
                      className="flex items-center gap-1.5 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      {acting === r.id + "reject" ? "Rejecting…" : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
