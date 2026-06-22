"use client";

import { useCurrency, CURRENCIES, CurrencyCode } from "@/lib/currency-context";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      className="text-xs text-gray-600 bg-transparent border border-gray-200 rounded-lg px-2 py-1.5 cursor-pointer hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
      aria-label="Select currency"
    >
      {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
        <option key={code} value={code}>
          {CURRENCIES[code].label}
        </option>
      ))}
    </select>
  );
}
