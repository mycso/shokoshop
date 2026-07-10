"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { shippingCostPence, shippingLabel } from "@/lib/shipping";
import { SHIPPING_COUNTRY_OPTIONS, requiresPostcode } from "@/lib/countries";

interface ShippingQuoteState {
  pricePence: number;
  label: string;
  shipmentMethodUid: string;
  loading: boolean;
}

export default function CheckoutPage() {
  const { cart } = useCart();
  const { currency, rate, formatPrice } = useCurrency();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "GB",
  });

  const [shipping, setShipping] = useState<ShippingQuoteState>({
    pricePence: shippingCostPence("GB"),
    label: shippingLabel("GB"),
    shipmentMethodUid: "standard",
    loading: false,
  });

  // Cart contents rarely change on the checkout screen, so key the quote
  // fetch off a lightweight summary rather than the array reference (which
  // can change identity on every cart-context re-render).
  const cartKey = cart.items.map((i) => `${i.productId}:${i.variantId ?? ""}:${i.quantity}`).join(",");

  // Live shipping quote from Gelato for the entered destination, debounced
  // so it doesn't fire on every keystroke. Falls back to the flat-rate
  // table (via the API route itself) if Gelato can't be reached.
  useEffect(() => {
    if (cart.items.length === 0 || !form.country) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setShipping((s) => ({ ...s, loading: true }));
      try {
        const res = await fetch("/api/checkout/shipping-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.items,
            country: form.country,
            postalCode: form.postalCode,
            state: form.state,
            city: form.city,
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setShipping({
            pricePence: data.pricePence,
            label: data.label,
            shipmentMethodUid: data.shipmentMethodUid,
            loading: false,
          });
        } else if (!cancelled) {
          setShipping((s) => ({ ...s, loading: false }));
        }
      } catch {
        if (!cancelled) setShipping((s) => ({ ...s, loading: false }));
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country, form.postalCode, form.state, form.city, cartKey]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          shippingAddress: form,
          currency,
          rate,
          shipping: {
            shipmentMethodUid: shipping.shipmentMethodUid,
            pricePence: shipping.pricePence,
            label: shipping.label,
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.orderId) {
        router.push(`/checkout/success?orderId=${data.orderId}`);
      } else {
        setError(data.error ?? "Failed to create checkout session.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your cart is empty
        </h1>
        <Link
          href="/products"
          className="text-brand hover:underline font-medium"
        >
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-10 text-sm">
        <Link href="/cart" className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white transition-colors">
          <span className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs font-bold">1</span>
          <span className="hidden sm:inline">Cart</span>
        </Link>
        <div className="flex-1 max-w-[3rem] h-px bg-gray-200 dark:bg-gray-700 mx-2" />
        <div className="flex items-center gap-2 text-brand font-medium">
          <span className="h-6 w-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">2</span>
          <span className="hidden sm:inline">Details</span>
        </div>
        <div className="flex-1 max-w-[3rem] h-px bg-gray-200 dark:bg-gray-700 mx-2" />
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
          <span className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center text-xs font-bold">3</span>
          <span className="hidden sm:inline">Payment</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
          {/* Contact */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  First name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Last name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Address line 1 *
                </label>
                <input
                  type="text"
                  name="line1"
                  required
                  value={form.line1}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Address line 2
                </label>
                <input
                  type="text"
                  name="line2"
                  value={form.line2}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  County / State
                </label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Postcode{requiresPostcode(form.country) ? " *" : ""}
                </label>
                <input
                  type="text"
                  name="postalCode"
                  required={requiresPostcode(form.country)}
                  value={form.postalCode}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Country *
                </label>
                <select
                  name="country"
                  required
                  value={form.country}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {SHIPPING_COUNTRY_OPTIONS.map(({ code, name }) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || shipping.loading}
            className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold py-4 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors text-base"
          >
            {loading ? (
              "Redirecting to payment…"
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Proceed to Payment
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">
              Your Order
            </h2>
            <div className="space-y-4 mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold z-50">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.variantName}</p>
                    )}
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(cart.total)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Shipping</span>
                <span className="font-medium">
                  {shipping.loading ? (
                    <span className="inline-flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                      <span className="h-3 w-3 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-brand animate-spin" />
                      Calculating…
                    </span>
                  ) : (
                    formatPrice(shipping.pricePence)
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1">{shipping.label}</p>
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-1 border-t border-gray-100 dark:border-gray-800">
                <span>Total</span>
                <span>{formatPrice(cart.total + shipping.pricePence)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
