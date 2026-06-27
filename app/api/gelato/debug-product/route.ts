import { NextRequest } from "next/server";

const GELATO_API_KEY = process.env.GELATO_API_KEY!;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID!;

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return Response.json({ error: "productId query param required" }, { status: 400 });
  }

  const base = `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/products/${productId}`;
  const headers = { "X-API-KEY": GELATO_API_KEY, "Content-Type": "application/json" };

  const results: Record<string, unknown> = {};

  // Try templates endpoint
  const templatesRes = await fetch(`${base}/templates`, { headers }).catch(() => null);
  if (templatesRes) {
    results.templates = { status: templatesRes.status, body: templatesRes.ok ? await templatesRes.json().catch(() => "parse-error") : await templatesRes.text().catch(() => "read-error") };
  }

  // Try previews endpoint
  const previewsRes = await fetch(`${base}/previews`, { headers }).catch(() => null);
  if (previewsRes) {
    results.previews = { status: previewsRes.status, body: previewsRes.ok ? await previewsRes.json().catch(() => "parse-error") : await previewsRes.text().catch(() => "read-error") };
  }

  // Try product with expand=templates
  const expandRes = await fetch(`${base}?expand=templates`, { headers }).catch(() => null);
  if (expandRes) {
    results.expandTemplates = { status: expandRes.status, body: expandRes.ok ? await expandRes.json().catch(() => "parse-error") : await expandRes.text().catch(() => "read-error") };
  }

  // Try print-files endpoint
  const printFilesRes = await fetch(`${base}/print-files`, { headers }).catch(() => null);
  if (printFilesRes) {
    results.printFiles = { status: printFilesRes.status, body: printFilesRes.ok ? await printFilesRes.json().catch(() => "parse-error") : await printFilesRes.text().catch(() => "read-error") };
  }

  // Try design-files endpoint
  const designFilesRes = await fetch(`${base}/design-files`, { headers }).catch(() => null);
  if (designFilesRes) {
    results.designFiles = { status: designFilesRes.status, body: designFilesRes.ok ? await designFilesRes.json().catch(() => "parse-error") : await designFilesRes.text().catch(() => "read-error") };
  }

  return Response.json({ productId, storeId: GELATO_STORE_ID, results });
}

// Call Gelato's publish endpoint for this product
export async function POST(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return Response.json({ error: "productId query param required" }, { status: 400 });
  }

  const headers = { "X-API-KEY": GELATO_API_KEY, "Content-Type": "application/json" };
  const publishUrl = `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/products/${productId}/publish`;

  const res = await fetch(publishUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      publishScopes: ["product", "variants", "images", "videos", "prices"],
    }),
  });

  const body = res.ok ? await res.json().catch(() => "parse-error") : await res.text().catch(() => "read-error");
  return Response.json({ publishUrl, status: res.status, body });
}
