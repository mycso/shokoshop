// Every ISO country code Stripe Checkout can collect a shipping address for
// (its `AllowedCountry` union), minus "ZZ" (Stripe's non-shippable "rest of
// world" placeholder — Gelato needs a real destination to quote/fulfil).
// Keep in sync with the `AllowedCountry` type in stripe's Checkout.Sessions
// types if Stripe adds/removes supported countries.
export const SHIPPING_COUNTRIES = [
  "AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO",
  "CR", "CV", "CW", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER",
  "ES", "ET", "FI", "FJ", "FK", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL",
  "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID",
  "IE", "IL", "IM", "IN", "IO", "IQ", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI",
  "KM", "KN", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV",
  "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MK", "ML", "MM", "MN", "MO", "MQ", "MR", "MS", "MT",
  "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
  "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PY", "QA",
  "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL",
  "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SZ", "TA", "TC", "TD", "TF", "TG", "TH", "TJ",
  "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VA",
  "VC", "VE", "VG", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export type ShippingCountryCode = (typeof SHIPPING_COUNTRIES)[number];

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function countryName(code: string): string {
  return regionNames?.of(code) ?? code;
}

// Countries with no national postal/ZIP code system (sourced from UPU
// addressing guidance, cross-checked against worldpopulationreview's country
// rankings), filtered to the codes Stripe actually supports above.
const NO_POSTCODE_COUNTRIES = new Set<string>([
  "AE", "AG", "AO", "AW", "BF", "BI", "BJ", "BO", "BS", "BW", "BZ", "CD", "CF", "CG", "CI", "CK",
  "CM", "CW", "DJ", "DM", "ER", "FJ", "GA", "GD", "GM", "GQ", "GY", "HK", "JM", "KI", "KM", "LY",
  "ML", "MO", "MR", "NR", "NU", "QA", "RW", "SB", "SC", "SL", "SR", "SS", "ST", "SX", "TD", "TF",
  "TG", "TK", "TL", "TO", "TV", "UG", "VU", "YE", "ZW",
]);

export function requiresPostcode(code: string): boolean {
  return !NO_POSTCODE_COUNTRIES.has(code);
}

/** Full { code, name } list sorted alphabetically by display name, for <select> options. */
export const SHIPPING_COUNTRY_OPTIONS = SHIPPING_COUNTRIES.map((code) => ({
  code,
  name: countryName(code),
})).sort((a, b) => a.name.localeCompare(b.name));
