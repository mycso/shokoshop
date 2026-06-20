import { NextResponse } from "next/server";

const GELATO_API_KEY = process.env.GELATO_API_KEY;

// Test with a known productUid from your store
// GET /api/gelato/debug-prices?uid=apparel_product_gca_t-shirt_...
export async function GET(req: Request) {
  if (!GELATO_API_KEY) {
    return NextResponse.json({ error: "GELATO_API_KEY not configured" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  if (!uid) return NextResponse.json({ error: "Pass ?uid=productUid" }, { status: 400 });

  const endpoints = [
    `https://catalog.gelatoapis.com/v1/products/${encodeURIComponent(uid)}/prices?currency=GBP`,
    `https://catalog.gelatoapis.com/v1/products/${encodeURIComponent(uid)}/prices`,
    `https://catalog.gelatoapis.com/v1/products/${encodeURIComponent(uid)}`,
    `https://catalog.gelatoapis.com/v2/products/${encodeURIComponent(uid)}`,
    `https://order.gelatoapis.com/v4/products/${encodeURIComponent(uid)}`,
  ];

  const results: Record<string, any> = {};

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { "X-API-KEY": GELATO_API_KEY, "Content-Type": "application/json" },
      });
      results[url] = { status: res.status, body: res.ok ? await res.json() : await res.text() };
    } catch (err) {
      results[url] = { error: String(err) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
