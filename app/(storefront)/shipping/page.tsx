import type { Metadata } from "next";
import Link from "next/link";
import { Package, Globe, Clock, Receipt } from "lucide-react";
import ShippingRates from "./ShippingRates";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "Shipping rates and delivery times for ShokoShop T-shirts and hanging wall art to every country we ship to, shown in your currency.",
};

const FACTS = [
  {
    icon: Globe,
    title: "Ships worldwide",
    text: "T-shirts and hanging wall art are printed locally and shipped to over 200 countries and territories.",
  },
  {
    icon: Package,
    title: "Made to order",
    text: "Every item is printed after you order, so allow production time before it ships.",
  },
  {
    icon: Clock,
    title: "Tracked delivery",
    text: "You get a tracking link by email as soon as your order leaves the print partner.",
  },
  {
    icon: Receipt,
    title: "Duties & taxes",
    text: "Import duties or VAT may apply outside the UK and are the buyer's responsibility.",
  },
];

export default function ShippingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Shipping &amp; Delivery
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-2xl mb-10">
        This page covers our two product types: <strong>T-shirts</strong> and{" "}
        <strong>hanging items</strong> (wall art). Pick your currency and find
        your country below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {FACTS.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex gap-4"
          >
            <Icon className="h-6 w-6 text-brand shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <ShippingRates />

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
        Rates are per order and shown as estimates, converted from GBP at
        current exchange rates. The exact cost and delivery time for your
        address is confirmed at checkout. Questions?{" "}
        <Link href="/account/orders" className="underline hover:text-brand">
          Check your orders
        </Link>
        .
      </p>
    </div>
  );
}
