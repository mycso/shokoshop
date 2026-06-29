import { revalidateTag } from "next/cache";
import { verifyGelatoSignature } from "@/lib/gelato-webhook";
import { GELATO_PRODUCTS_TAG, getGelatoProducts } from "@/lib/gelato-data";
import { assignExtraImagesToAllVariants, persistImageToBlob } from "@/lib/gelato-sync.mjs";
import { getOverrides, setOverride } from "@/lib/gelato-overrides";

const WEBHOOK_SECRET = process.env.GELATO_WEBHOOK_SECRET;
const API_KEY = process.env.GELATO_API_KEY!;
const STORE_ID = process.env.GELATO_STORE_ID!;
const BASE = `https://ecommerce.gelatoapis.com/v1/stores/${STORE_ID}`;
const HEADERS = { "X-API-KEY": API_KEY, "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" };

/**
 * Fires whenever a product is created or edited in the Gelato dashboard.
 * Responds immediately, then in the background:
 *   1. Assigns all extra mockup images to every variant (Gelato resets this on save)
 *   2. Fetches variant prices from Gelato and persists them to the overrides store
 *   3. Imports all product mockup images into the overrides store (blob-hosted)
 *   4. Re-warms the Next.js cache
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();

    if (!verifyGelatoSignature(body, request.headers.get("x-gelato-secret"), WEBHOOK_SECRET)) {
      console.warn("Gelato product webhook: invalid secret");
      return Response.json({ error: "Invalid secret" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const productId: string | undefined = payload.storeProductId ?? payload.productId ?? payload.product?.id;

    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    (async () => {
      try {
        if (!productId) { await getGelatoProducts(); return; }

        // 1. Re-assign extra images to all variants
        await assignExtraImagesToAllVariants({ apiKey: API_KEY, storeId: STORE_ID, productId });

        // 2. Fetch product detail to get variants and images
        const detailRes = await fetch(`${BASE}/products/${productId}`, { headers: HEADERS });
        if (!detailRes.ok) { await getGelatoProducts(); return; }
        const detail = await detailRes.json();
        const variants: { id: string }[] = detail.variants ?? [];

        // 3. Auto-fetch and persist variant prices (EUR → GBP pence)
        let eurToGbp = 0.86;
        try {
          const rateData = await fetch("https://api.exchangerate-api.com/v4/latest/EUR").then((r) => r.json());
          eurToGbp = rateData.rates?.GBP ?? 0.86;
        } catch { /* use fallback */ }

        const variantPrices: Record<string, number> = {};
        await Promise.all(variants.map(async (v) => {
          try {
            const res = await fetch(`${BASE}/products/${productId}/variants/${v.id}`, { headers: HEADERS });
            if (!res.ok) return;
            const vdata = await res.json();
            const raw: number = vdata.price ?? vdata.retailPrice ?? 0;
            if (raw <= 0) return;
            const currency = (vdata.currency ?? "EUR").toUpperCase();
            variantPrices[v.id] = currency === "GBP"
              ? Math.round(raw * 100)
              : Math.round(raw * eurToGbp * 100);
          } catch { /* ignore */ }
        }));

        // 4. Import Gelato product images into the overrides store
        const gelatoUrls: string[] = [];
        const seenUrls = new Set<string>();
        function addUrl(u: unknown) {
          if (typeof u === "string" && u.length > 0 && !seenUrls.has(u)) { seenUrls.add(u); gelatoUrls.push(u); }
        }
        addUrl(detail.previewUrl);
        addUrl(detail.externalPreviewUrl);
        for (const img of detail.productImages ?? []) addUrl(img.fileUrl ?? img.url ?? img.previewUrl);
        for (const v of variants) addUrl((v as any).previewUrl ?? (v as any).preview);

        const importedUrls: string[] = [];
        for (const url of gelatoUrls) {
          try {
            const blobUrl = await persistImageToBlob(url);
            if (!importedUrls.includes(blobUrl)) importedUrls.push(blobUrl);
          } catch { /* skip */ }
        }

        // Persist prices and images — don't overwrite existing admin-set images
        const overrides = await getOverrides();
        const existing = overrides.find((o) => o.gelatoProductId === productId);
        const existingImages = existing?.images ?? [];
        const mergedImages = [...existingImages];
        for (const url of importedUrls) {
          if (!mergedImages.includes(url)) mergedImages.push(url);
        }

        const update: Parameters<typeof setOverride>[0] = { gelatoProductId: productId };
        if (Object.keys(variantPrices).length > 0) update.variantPrices = variantPrices;
        if (mergedImages.length > 0) update.images = mergedImages;
        await setOverride(update);

        revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });
        await getGelatoProducts();
        console.log(`[product-webhook] synced product ${productId}: ${Object.keys(variantPrices).length} prices, ${importedUrls.length} images`);
      } catch (err) {
        console.error("Gelato product webhook: post-processing failed", err);
      }
    })();

    return Response.json({ received: true });
  } catch (err) {
    console.error("Gelato product webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
