import { NextResponse } from 'next/server';

const GELATO_API_KEY = process.env.GELATO_API_KEY;

// Candidate endpoints we try (same list used by client products page)
const CANDIDATE_ENDPOINTS = [
  "https://order.gelatoapis.com/v4/products",
  "https://catalog.gelatoapis.com/v1/products",
  "https://api.gelato.com/v1/products",
  "https://api.gelato.com/v2/products",
  "https://order.gelatoapis.com/v4/product-catalog/products",
  // additional permutations sometimes seen in accounts
  "https://catalog.gelatoapis.com/v1/product-catalog/products",
  "https://order.gelatoapis.com/v4/products?limit=100",
];

export async function GET(request: Request) {
  if (!GELATO_API_KEY) {
    return NextResponse.json({ error: 'GELATO_API_KEY not configured' }, { status: 400 });
  }

  const results: Record<string, any> = {};

  // If a store query param is provided, try store-scoped endpoints first
  const url = new URL(request.url);
  const storeId = url.searchParams.get("store");

  const endpoints = [];
  if (storeId) {
    endpoints.push(
      `https://catalog.gelatoapis.com/v1/stores/${storeId}/products`,
      `https://order.gelatoapis.com/v4/stores/${storeId}/products`,
      `https://api.gelato.com/v1/stores/${storeId}/products`,
      `https://api.gelato.com/v2/stores/${storeId}/products`,
      `https://order.gelatoapis.com/v4/stores/${storeId}/product-catalog/products`
    );
  }

  // then candidate endpoints
  endpoints.push(...CANDIDATE_ENDPOINTS);

  // Try each endpoint with X-API-KEY header first, then with Authorization: Bearer
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { 'X-API-KEY': GELATO_API_KEY },
      });

      results[endpoint] = {
        status: res.status,
        headerTried: 'X-API-KEY',
      };

      if (res.ok) {
        const json = await res.json();
        results[endpoint].body = json;
        return NextResponse.json({ endpoint, header: 'X-API-KEY', body: json });
      }
    } catch (err) {
      results[endpoint] = { error: (err instanceof Error) ? err.message : String(err), headerTried: 'X-API-KEY' };
    }

    // try again with Bearer authorization (some Gelato keys are accepted this way)
    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${GELATO_API_KEY}` },
      });

      results[endpoint + ' (bearer)'] = {
        status: res.status,
        headerTried: 'Authorization: Bearer',
      };

      if (res.ok) {
        const json = await res.json();
        results[endpoint + ' (bearer)'].body = json;
        return NextResponse.json({ endpoint, header: 'Authorization: Bearer', body: json });
      }
    } catch (err) {
      results[endpoint + ' (bearer)'] = { error: (err instanceof Error) ? err.message : String(err), headerTried: 'Authorization: Bearer' };
    }
  }

  // If we get here, none succeeded; return the per-endpoint results for debugging
  return NextResponse.json({ error: 'no endpoint returned OK', results }, { status: 502 });
}
