"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, ArrowRight, Home } from "lucide-react";
import { useCart } from "@/lib/cart-context";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? searchParams.get("session_id");
  const { clearCart } = useCart();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!cleared) {
      clearCart();
      setCleared(true);
    }
  }, [clearCart, cleared]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Order Confirmed! 🎉
      </h1>
      <p className="text-lg text-gray-600 mb-2">
        Thank you for your purchase.
      </p>
      <p className="text-gray-500 mb-8">
        Your order has been received and is being prepared for fulfilment. You'll
        receive a confirmation email shortly.
      </p>

      {orderId && (
        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 inline-block text-left w-full">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-1">
            <Package className="h-5 w-5" />
            Order Reference
          </div>
          <p className="text-sm text-gray-600 font-mono break-all">{orderId}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 text-left">
        <h2 className="font-semibold text-gray-900 mb-4">What happens next?</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          {[
              "We send your order to Gelato for production",
              "Your item is produced and quality-checked",
            "Shipped directly to your address",
            "You receive tracking information by email",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderId && (
          <Link
            href={`/account/orders/${orderId}`}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Package className="h-4 w-4" />
            Track Your Order
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-gray-400">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
