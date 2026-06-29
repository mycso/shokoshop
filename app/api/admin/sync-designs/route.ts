import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { getOverrides, setOverride } from "@/lib/gelato-overrides";

const API_KEY = process.env.GELATO_API_KEY!;
const STORE_ID = process.env.GELATO_STORE_ID!;
const BASE = `https://ecommerce.gelatoapis.com/v1/stores/${STORE_ID}`;
const HEADERS = { "X-API-KEY": API_KEY, "Content-Type": "application/json" };

/** Walk any JSON value looking for the first string that looks like a file URL. */
function extractFileUrl(data: unknown, depth = 0): string | null {
  if (depth > 8 || !data) return null;
  if (typeof data === "string") {
    const lower = data.toLowerCase();
    if (
      (lower.startsWith("http") || lower.startsWith("https")) &&
      (lower.includes(".pdf") || lower.includes(".png") || lower.includes(".jpg") ||
       lower.includes(".jpeg") || lower.includes(".zip") || lower.includes("download") ||
       lower.includes("file") || lower.includes("design"))
    ) return data;
    return null;
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = extractFileUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    // Prioritise well-known field names
    const priority = [
      "downloadUrl", "fileUrl", "designUrl", "printFileUrl", "outputUrl",
      "outputFileUrl", "url", "src", "href",
    ];
    for (const key of priority) {
      if (typeof obj[key] === "string") {
        const found = extractFileUrl(obj[key], depth + 1);
        if (found) return found;
      }
    }
    // Then recurse into nested objects/arrays
    const nested = ["templates", "designFiles", "files", "pages", "layers", "assets"];
    for (const key of nested) {
      if (obj[key]) {
        const found = extractFileUrl(obj[key], depth + 1);
        if (found) return found;
      }
    }
  }
  return null;
}

async function fetchDesignUrlForProduct(productId: string): Promise<{ url: string | null; source: string; raw?: unknown }> {
  // 1. Try /templates endpoint
  const templatesRes = await fetch(`${BASE}/products/${productId}/templates`, { headers: HEADERS }).catch(() => null);
  if (templatesRes?.ok) {
    const data = await templatesRes.json().catch(() => null);
    const url = extractFileUrl(data);
    if (url) return { url, source: "templates", raw: data };
  }

  // 2. Try /design-files endpoint
  const dfRes = await fetch(`${BASE}/products/${productId}/design-files`, { headers: HEADERS }).catch(() => null);
  if (dfRes?.ok) {
    const data = await dfRes.json().catch(() => null);
    const url = extractFileUrl(data);
    if (url) return { url, source: "design-files", raw: data };
  }

  // 3. Try product detail with expand=templates
  const expandRes = await fetch(`${BASE}/products/${productId}?expand=templates`, { headers: HEADERS }).catch(() => null);
  if (expandRes?.ok) {
    const data = await expandRes.json().catch(() => null);
    const url = extractFileUrl(data?.templates ?? data);
    if (url) return { url, source: "expand-templates", raw: data?.templates };
  }

  return { url: null, source: "none" };
}

async function downloadAndPersist(url: string, productId: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const blob = await res.blob();
  const rawExt = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "bin";
  const ext = ["pdf", "png", "jpg", "jpeg", "zip"].includes(rawExt) ? rawExt : "bin";
  const filename = `product-designs/${productId}.${ext}`;
  await put(filename, blob, {
    access: "private",
    contentType: blob.type || "application/octet-stream",
    allowOverwrite: true,
  });
  return filename;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const productId = body.productId as string | undefined;

  if (productId) {
    // Single-product sync
    const { url, source } = await fetchDesignUrlForProduct(productId);
    if (!url) {
      return Response.json({
        success: false,
        message: "Gelato did not return a downloadable design file for this product. The product template design is used automatically when orders are placed.",
      });
    }
    try {
      const filename = await downloadAndPersist(url, productId);
      await setOverride({ gelatoProductId: productId, designFilename: filename });
      return Response.json({ success: true, designFilename: filename, source });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Bulk sync — all products
  const listRes = await fetch(`${BASE}/products?limit=100`, { headers: HEADERS });
  if (!listRes.ok) {
    return Response.json({ error: "Failed to fetch product list from Gelato" }, { status: 500 });
  }
  const listData = await listRes.json();
  const products: any[] = listData.products ?? [];

  const results: { productId: string; name: string; success: boolean; designFilename?: string; message?: string }[] = [];

  // Load existing overrides once to skip products that already have a design
  const overrides = await getOverrides();

  for (const p of products) {
    const pid: string = p.id;
    const name: string = p.title ?? p.name ?? pid;
    const existing = overrides.find((o) => o.gelatoProductId === pid);
    if (existing?.designFilename) {
      results.push({ productId: pid, name, success: true, designFilename: existing.designFilename, message: "already set" });
      continue;
    }
    const { url } = await fetchDesignUrlForProduct(pid);
    if (!url) {
      results.push({ productId: pid, name, success: false, message: "No design file found in Gelato" });
      continue;
    }
    try {
      const filename = await downloadAndPersist(url, pid);
      await setOverride({ gelatoProductId: pid, designFilename: filename });
      results.push({ productId: pid, name, success: true, designFilename: filename });
    } catch (err: any) {
      results.push({ productId: pid, name, success: false, message: err.message });
    }
  }

  const succeeded = results.filter((r) => r.success && r.message !== "already set").length;
  const already = results.filter((r) => r.message === "already set").length;
  const failed = results.filter((r) => !r.success).length;

  return Response.json({ results, summary: { succeeded, already, failed, total: products.length } });
}
