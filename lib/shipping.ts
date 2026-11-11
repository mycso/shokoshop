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
  return `Standard Shipping — £${gbp} (${transitLabel(country)} in transit)`;
}

// Delivery zones and transit times, from https://www.gelato.com/shipping-and-delivery.
// Transit is business days once the order has been produced and shipped.
export type ShippingZone = "hub" | "europe" | "world";

const EU_HUBS = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

// Local production hubs: USA, Canada, UK, EU, Australia, Brazil, Japan, India.
const HUBS = new Set(["US", "CA", "GB", "AU", "BR", "JP", "IN"]);

// Europe & EFTA destinations without local production.
const EUROPE_NON_HUB = new Set([
  "CH", "NO", "IS", "LI", "AD", "AL", "AX", "BA", "BY", "FO", "GG", "GI", "IM", "JE", "MC",
  "MD", "ME", "MK", "RS", "SJ", "SM", "UA", "VA", "XK",
]);

export function shippingZone(country: string): ShippingZone {
  if (HUBS.has(country) || EU_HUBS.has(country)) return "hub";
  if (EUROPE_NON_HUB.has(country)) return "europe";
  return "world";
}

export const TRANSIT_DAYS: Record<ShippingZone, {
  standard: [number, number];
  express: [number, number];
}> = {
  hub: { standard: [2, 4], express: [1, 3] },
  europe: { standard: [4, 6], express: [2, 5] },
  world: { standard: [7, 15], express: [3, 5] },
};

export function transitLabel(country: string, method: "standard" | "express" = "standard"): string {
  const [min, max] = TRANSIT_DAYS[shippingZone(country)][method];
  return `${min}–${max} business days`;
}
