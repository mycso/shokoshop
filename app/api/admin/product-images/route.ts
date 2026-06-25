import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { getOverrides, setOverride } from "@/lib/gelato-overrides";
import { revalidateTag } from "next/cache";
import { GELATO_PRODUCTS_TAG } from "@/lib/gelato-data";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 20 * 1024 * 1024;

// POST /api/admin/product-images — upload an image and attach it to a product
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file || !productId) {
    return NextResponse.json({ error: "file and productId are required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP are accepted" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Max file size is 20MB" }, { status: 400 });
  }

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const pathname = `product-images/${productId}/${randomUUID()}.${ext}`;

  const blob = await put(pathname, file, { access: "public", allowOverwrite: false });

  // Append URL to the product's override images list
  const overrides = await getOverrides();
  const existing = overrides.find((o) => o.gelatoProductId === productId);
  const images = [...(existing?.images ?? []), blob.url];
  await setOverride({ gelatoProductId: productId, images });

  revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

  return NextResponse.json({ url: blob.url, images });
}

// DELETE /api/admin/product-images — remove an image from a product
export async function DELETE(request: Request) {
  const { productId, url } = await request.json();
  if (!productId || !url) {
    return NextResponse.json({ error: "productId and url are required" }, { status: 400 });
  }

  // Remove from blob
  try { await del(url); } catch { /* already gone */ }

  // Remove from override images list
  const overrides = await getOverrides();
  const existing = overrides.find((o) => o.gelatoProductId === productId);
  const images = (existing?.images ?? []).filter((u) => u !== url);
  await setOverride({ gelatoProductId: productId, images });

  revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

  return NextResponse.json({ ok: true, images });
}
