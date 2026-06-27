// Flat-rate shipping costs in GBP pence by destination country.
// Adjust these to match your actual Gelato fulfilment costs.
const RATES: Record<string, number> = {
  GB: 399,   // £3.99
  US: 999,   // £9.99
  CA: 999,   // £9.99
  AU: 1099,  // £10.99
  AE: 999,   // £9.99
  DE: 699,   // £6.99
  FR: 699,
  ES: 699,
  IT: 699,
  NL: 699,
};

const DEFAULT_RATE = 1299; // £12.99

export function shippingCostPence(country: string): number {
  return RATES[country] ?? DEFAULT_RATE;
}

export function shippingLabel(country: string): string {
  const cost = shippingCostPence(country);
  const gbp = (cost / 100).toFixed(2);
  return `Standard Shipping — £${gbp} (3–7 business days)`;
}
