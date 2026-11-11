"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SHIPPING_COUNTRY_OPTIONS } from "@/lib/countries";
import { shippingCostPence } from "@/lib/shipping";
import { COUNTRY_CURRENCY, useCurrency } from "@/lib/currency-context";
import { CurrencySelector } from "@/components/ui/CurrencySelector";

const DELIVERY = "3–7 business days";
const DELIVERY_INTL = "5–14 business days";
const FAST_COUNTRIES = new Set(["GB", "US", "CA", "AU", "AE", "DE", "FR", "ES", "IT", "NL"]);

export default function ShippingRates() {
  const { formatPrice, currency } = useCurrency();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SHIPPING_COUNTRY_OPTIONS.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q
    );
  }, [query]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Rates by country
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country"
              aria-label="Search country"
              className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <CurrencySelector />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Local currency</th>
                <th className="px-4 py-3 font-medium">T-shirts ({currency})</th>
                <th className="px-4 py-3 font-medium">Hanging items ({currency})</th>
                <th className="px-4 py-3 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {rows.map(({ code, name }) => {
                const price = formatPrice(shippingCostPence(code));
                return (
                  <tr key={code}>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{name}</td>
                    <td className="px-4 py-2.5">{COUNTRY_CURRENCY[code] ?? "—"}</td>
                    <td className="px-4 py-2.5">{price}</td>
                    <td className="px-4 py-2.5">{price}</td>
                    <td className="px-4 py-2.5">
                      {FAST_COUNTRIES.has(code) ? DELIVERY : DELIVERY_INTL}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No countries match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
