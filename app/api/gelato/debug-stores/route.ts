const GELATO_API_KEY = process.env.GELATO_API_KEY;

// GET /api/gelato/debug-stores — lists all stores on your Gelato account
export async function GET() {
  if (!GELATO_API_KEY) {
    return Response.json({ error: "Missing GELATO_API_KEY" }, { status: 400 });
  }

  const res = await fetch("https://ecommerce.gelatoapis.com/v1/stores", {
    headers: { "X-API-KEY": GELATO_API_KEY, "Content-Type": "application/json" },
  });

  const body = res.ok ? await res.json() : await res.text();
  return Response.json({ status: res.status, configuredStoreId: process.env.GELATO_STORE_ID, body });
}
