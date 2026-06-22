"use client";

import { useCurrency } from "@/lib/currency-context";

export function PriceDisplay({ pence, prefix = "" }: { pence: number; prefix?: string }) {
  const { formatPrice } = useCurrency();
  return (
    <>
      {prefix}
      {formatPrice(pence)}
    </>
  );
}
