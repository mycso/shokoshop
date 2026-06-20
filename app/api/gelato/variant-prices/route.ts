import { NextResponse } from "next/server";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

/**
 * POST /api/gelato/variant-prices
 * Body: { productId: string, variants: { id: string }[] }
 * Fetches retail price for each variant from the Gelato Ecommerce variant detail API.
 * Returns: { prices: Record<variantId, number> } — prices in pence GBP.
 */
export async function POST(req: Request) {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) {
    return NextResponse.json({ error: "GELATO_API_KEY or GELATO_STORE_ID not configured" }, { status: 400 });
  }

  const body = await req.json();
  const productId: string = body.productId;
  const variants: { id: string }[] = Array.isArray(body.variants) ? body.variants : [];

  if (!productId || variants.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  // Fetch EUR→GBP rate (fallback to 0.86 if unavailable)
  let eurToGbp = 0.86;
  try {
    const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/EUR", { next: { revalidate: 3600 } });
    if (rateRes.ok) {
      const rateData = await rateRes.json();
      eurToGbp = rateData.rates?.GBP ?? 0.86;
    }
  } catch { /* use fallback */ }

  const prices: Record<string, number> = {};

  await Promise.all(
    variants.map(async ({ id: variantId }) => {
      try {
        const res = await fetch(
          `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/products/${productId}/variants/${variantId}`,
          {
            headers: {
              "X-API-KEY": GELATO_API_KEY!,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();

        // Use retail `price` field (not `cost` which is Gelato's production cost)
        const rawPrice: number | undefined = data.price ?? data.retailPrice ?? undefined;
        if (rawPrice === undefined || rawPrice <= 0) return;

        const currency: string = (data.currency ?? "EUR").toUpperCase();

        let pence: number;
        if (currency === "GBP") {
          pence = Math.round(rawPrice * 100);
        } else if (currency === "EUR") {
          pence = Math.round(rawPrice * eurToGbp * 100);
        } else {
          // Unknown currency — store as-is in pence equivalent
          pence = Math.round(rawPrice * 100);
        }

        prices[variantId] = pence;
      } catch { /* ignore individual failures */ }
    })
  );

  return NextResponse.json({ prices, eurToGbp });
}
