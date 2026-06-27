import { NextRequest } from "next/server";

const COUNTRY_CURRENCY: Record<string, string> = {
  GB: "GBP",
  US: "USD", CA: "CAD", AU: "AUD",
  AE: "AED",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR",
  NL: "EUR", AT: "EUR", BE: "EUR", PT: "EUR",
  IE: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
};

export async function GET(request: NextRequest) {
  // Vercel injects this header automatically in production
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");

  if (country && COUNTRY_CURRENCY[country]) {
    return Response.json({ country, currency: COUNTRY_CURRENCY[country] });
  }

  // Fallback: IP lookup for other environments
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");

  if (ip && ip !== "127.0.0.1" && ip !== "::1") {
    try {
      const data = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: { "User-Agent": "ShokoShop/1.0" },
        next: { revalidate: 3600 },
      }).then((r) => r.json());
      const detected = COUNTRY_CURRENCY[data.country_code as string] ?? "GBP";
      return Response.json({ country: data.country_code, currency: detected });
    } catch {}
  }

  return Response.json({ country: "GB", currency: "GBP" });
}
