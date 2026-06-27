"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackageX, CheckCircle } from "lucide-react";

const REASONS = [
  { value: "damaged", label: "Item arrived damaged" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "not_as_described", label: "Not as described" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
];

const RESOLUTIONS = [
  { value: "refund", label: "Full refund" },
  { value: "exchange", label: "Exchange for same item" },
  { value: "store_credit", label: "Store credit" },
];

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  variantName?: string;
}

interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  customerEmail: string;
}

export default function ReturnRequestPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("damaged");
  const [resolution, setResolution] = useState("refund");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedItems.size === 0) {
      setError("Please select at least one item to return.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const items = order!.items
      .filter((i) => selectedItems.has(i.id))
      .map((i) => ({ itemId: i.id, name: i.name, quantity: i.quantity }));

    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, items, reason, resolution, description }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Order not found.</p>
        <Link href="/account/orders" className="text-brand hover:underline mt-4 block">
          Back to orders
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Return request submitted</h1>
        <p className="text-gray-500 mb-8">
          We&apos;ve received your request for order{" "}
          <span className="font-mono font-semibold">#{orderId.slice(-8).toUpperCase()}</span>.
          Our team will review it and get back to you within 2 business days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/returns"
            className="inline-flex items-center justify-center gap-2 bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
          >
            View my returns
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/account/orders" className="hover:text-gray-700">My Orders</Link>
        <span>/</span>
        <Link href={`/account/orders/${orderId}`} className="hover:text-gray-700">
          #{orderId.slice(-8).toUpperCase()}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Request Return</span>
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-red-50 rounded-xl">
          <PackageX className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request a Return</h1>
          <p className="text-gray-500 text-sm">Order #{orderId.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item selection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Which items are you returning?</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedItems.has(item.id)
                    ? "border-brand bg-brand-light/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-brand w-4 h-4 shrink-0"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  {item.variantName && (
                    <p className="text-xs text-gray-500">{item.variantName}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 shrink-0">Qty: {item.quantity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Reason for return</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                  reason === r.value
                    ? "border-brand bg-brand-light/30 text-gray-900 font-medium"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-brand"
                />
                {r.label}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional details <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell us more about the issue…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light resize-none"
            />
          </div>
        </div>

        {/* Resolution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Preferred resolution</h2>
          <div className="space-y-2">
            {RESOLUTIONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                  resolution === r.value
                    ? "border-brand bg-brand-light/30 text-gray-900 font-medium"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="resolution"
                  value={r.value}
                  checked={resolution === r.value}
                  onChange={() => setResolution(r.value)}
                  className="accent-brand"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Return Request"}
          </button>
          <Link
            href={`/account/orders/${orderId}`}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
