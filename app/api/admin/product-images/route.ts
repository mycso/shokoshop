import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { getOverrides, setOverride } from "@/lib/gelato-overrides";
import { revalidateTag, unstable_noStore } from "next/cache";
import { GELATO_PRODUCTS_TAG } from "@/lib/gelato-data";
import { persistImageToBlob } from "@/lib/gelato-sync.mjs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 20 * 1024 * 1024;

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://shokoshop.com";

/** Push a publicly-accessible image URL to Gelato's product images API. */
async function pushImageToGelato(productId: string, publicUrl: string): Promise<void> {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) return;
  const res = await fetch(
    `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/products/${productId}/images`,
    {
      method: "POST",
      headers: { "X-API-KEY": GELATO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: publicUrl, isPrimary: false, productVariantIds: [], skipPublishing: false }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[product-images] Gelato image push failed ${res.status}: ${text}`);
  }
}

// POST /api/admin/product-images — upload one or more images and attach to a product
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const productId = formData.get("productId") as string | null;
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const files = formData.getAll("file") as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: "at least one file is required" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `${file.name}: only JPEG, PNG, and WebP are accepted` }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `${file.name}: max file size is 20 MB` }, { status: 400 });
      }

      const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
      const pathname = `product-images/${productId}/${randomUUID()}.${ext}`;

      const blob = await put(pathname, file, {
        access: "private",
        allowOverwrite: true,
        contentType: file.type,
      });
      // Store as proxy URL so the private blob is served through our /api/blob-image route
      uploadedUrls.push(`/api/blob-image?path=${blob.pathname}`);

      // Push to Gelato so the image appears on the product in Gelato's platform
      const publicUrl = `${BASE_URL}/api/blob-image?path=${encodeURIComponent(blob.pathname)}`;
      await pushImageToGelato(productId, publicUrl);
    }

    const overrides = await getOverrides();
    const existing = overrides.find((o) => o.gelatoProductId === productId);
    const images = [...(existing?.images ?? []), ...uploadedUrls];
    await setOverride({ gelatoProductId: productId, images });

    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    return NextResponse.json({ urls: uploadedUrls, images });
  } catch (err) {
    console.error("[product-images POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/product-images — import Gelato mockup images into the product's custom images
export async function PUT(request: Request) {
  try {
    unstable_noStore();
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const apiKey = process.env.GELATO_API_KEY;
    const storeId = process.env.GELATO_STORE_ID;
    if (!apiKey || !storeId) {
      return NextResponse.json({ error: "Gelato API not configured" }, { status: 500 });
    }

    const headers = { "X-API-KEY": apiKey, "User-Agent": "Mozilla/5.0", "Content-Type": "application/json" };
    const base = `https://ecommerce.gelatoapis.com/v1/stores/${storeId}`;

    // Fetch product detail from Gelato for fresh image list
    const res = await fetch(`${base}/products/${productId}`, { headers });
    if (!res.ok) return NextResponse.json({ error: `Gelato returned ${res.status}` }, { status: 502 });
    const detail = await res.json();

    // Collect unique Gelato image URLs: product-level preview + all productImages entries
    const gelatoUrls: string[] = [];
    const seen = new Set<string>();
    function addUrl(u: unknown) {
      if (typeof u === "string" && u.length > 0 && !seen.has(u)) {
        seen.add(u); gelatoUrls.push(u);
      }
    }

    addUrl(detail.previewUrl);
    addUrl(detail.externalPreviewUrl);
    for (const img of detail.productImages ?? []) {
      addUrl(img.fileUrl ?? img.url ?? img.previewUrl);
    }
    // One preview per variant (already deduplicated by seen set, so same-colour/different-size collapse)
    for (const v of detail.variants ?? []) {
      addUrl(v.previewUrl ?? v.preview);
    }

    // Persist each Gelato URL to private blob storage (idempotent — skips if already cached)
    const importedUrls: string[] = [];
    for (const url of gelatoUrls) {
      try {
        const blobUrl = await persistImageToBlob(url);
        if (!importedUrls.includes(blobUrl)) importedUrls.push(blobUrl);
      } catch (err) {
        console.warn("[product-images import] skipping", url, (err as Error).message);
      }
    }

    // Merge with existing override images (keep existing custom images, append new ones)
    const overrides = await getOverrides();
    const existing = overrides.find((o) => o.gelatoProductId === productId);
    const merged = [...(existing?.images ?? [])];
    for (const url of importedUrls) {
      if (!merged.includes(url)) merged.push(url);
    }

    await setOverride({ gelatoProductId: productId, images: merged });
    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    return NextResponse.json({ imported: importedUrls.length, images: merged });
  } catch (err) {
    console.error("[product-images PUT]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import failed" }, { status: 500 });
  }
}

// PATCH /api/admin/product-images — save a new image order for a product
export async function PATCH(request: Request) {
  try {
    const { productId, images } = await request.json();
    if (!productId || !Array.isArray(images)) {
      return NextResponse.json({ error: "productId and images array are required" }, { status: 400 });
    }
    await setOverride({ gelatoProductId: productId, images });
    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });
    return NextResponse.json({ ok: true, images });
  } catch (err) {
    console.error("[product-images PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Reorder failed" }, { status: 500 });
  }
}

// DELETE /api/admin/product-images — remove an image from a product
export async function DELETE(request: Request) {
  try {
    const { productId, url } = await request.json();
    if (!productId || !url) {
      return NextResponse.json({ error: "productId and url are required" }, { status: 400 });
    }

    // url is stored as /api/blob-image?path=<pathname> — extract the pathname for del
    try {
      const blobPathname = new URL(url, "http://localhost").searchParams.get("path") ?? url;
      await del(blobPathname);
    } catch { /* already gone */ }

    const overrides = await getOverrides();
    const existing = overrides.find((o) => o.gelatoProductId === productId);
    const images = (existing?.images ?? []).filter((u) => u !== url);
    await setOverride({ gelatoProductId: productId, images });

    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    return NextResponse.json({ ok: true, images });
  } catch (err) {
    console.error("[product-images DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
