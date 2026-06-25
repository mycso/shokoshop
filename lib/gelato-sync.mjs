/**
 * Shared Gelato fetch + image-persistence core, used by both the live
 * Next.js data layer (lib/gelato-data.ts) and the standalone build-time
 * pre-warm script (scripts/sync-prices.mjs). Plain JS so both can import it
 * without a build step.
 */

import crypto from "crypto";
import { put, get } from "@vercel/blob";

export function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function getGbpRate() {
  try {
    const data = await fetch("https://api.exchangerate-api.com/v4/latest/EUR").then((r) => r.json());
    return data.rates.GBP ?? 0.864;
  } catch {
    return 0.864;
  }
}

export function isBlobUrl(url) {
  return typeof url === "string" && url.startsWith("/api/blob-image?path=");
}

// Gelato's preview images live in an ephemeral S3 cache (signed URLs that can
// 404 well before they expire) — derive a stable name from the underlying
// object id so re-uploads are idempotent and identical images aren't duplicated.
function stableImageName(url) {
  const base = url.split("?")[0];
  const match = base.match(/store_product_image\/([a-f0-9-]+)/i);
  if (match) return match[1];
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 32);
}

const blobCache = new Map(); // sourceKey → permanent proxy URL (dedup within this run)

// Gelato renders one default mockup per variant (`preview`). Extra angles
// saved from the dashboard's "Mockup style" picker show up separately, as
// entries in the product detail's `productImages` array — each tagged with
// the `productVariantIds` it applies to (handled in the main loop below,
// since attributing those to the right colour needs that id list, not just
// the URL). This pulls every other known single-image field plus any array
// field that looks like a generic list of mockups, so other angles keep
// showing up if Gelato exposes them through a different field later.
const IMAGE_URL_FIELDS = ["preview", "previewUrl", "externalPreviewUrl", "externalThumbnailUrl"];
const IMAGE_LIST_FIELDS = ["media", "images", "previews", "mockups"];

function extractImageUrls(obj) {
  const seen = new Set();
  const urls = [];
  function add(url) {
    if (typeof url === "string" && url.length > 0 && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  for (const field of IMAGE_URL_FIELDS) add(obj[field]);

  for (const field of IMAGE_LIST_FIELDS) {
    const list = obj[field];
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (typeof entry === "string") add(entry);
      else if (entry && typeof entry === "object") add(entry.url ?? entry.fileUrl ?? entry.previewUrl ?? entry.src);
    }
  }

  return urls;
}

/**
 * `productImages` entries with a non-empty `productVariantIds` are extra
 * mockups saved for one colour (e.g. a back/side angle) — every size of
 * that colour shares the same id list. Entries with no ids are global
 * (e.g. the primary listing photo, already covered by `previewUrl`) and
 * are ignored here to avoid leaking a single colour's extra shot into
 * every other colour's gallery.
 */
function groupScopedImagesByVariant(detail) {
  const byVariant = {};
  for (const img of detail.productImages ?? []) {
    const url = img.fileUrl ?? img.url ?? img.previewUrl;
    if (typeof url !== "string" || url.length === 0) continue;
    for (const variantId of img.productVariantIds ?? []) {
      (byVariant[variantId] ??= []).push(url);
    }
  }
  return byVariant;
}

/**
 * Downloads a Gelato preview image and re-hosts it on private Blob storage,
 * returning a stable same-origin proxy URL (/api/blob-image). Skips the
 * download+upload round trip if we already have this exact image cached —
 * content-type is served from Blob's own metadata, not from the filename,
 * so a fixed extension here is safe even if the underlying file isn't a JPEG.
 */
export async function persistImageToBlob(url) {
  const sourceKey = stableImageName(url);
  if (blobCache.has(sourceKey)) return blobCache.get(sourceKey);

  const pathname = `gelato-previews/${sourceKey}.jpg`;

  const existing = await get(pathname, { access: "private" }).catch(() => null);
  if (existing) {
    const proxyUrl = `/api/blob-image?path=${encodeURIComponent(pathname)}`;
    blobCache.set(sourceKey, proxyUrl);
    return proxyUrl;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image (${res.status}): ${url}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());

  await put(pathname, buffer, {
    access: "private",
    contentType,
    allowOverwrite: true,
  });

  const proxyUrl = `/api/blob-image?path=${encodeURIComponent(pathname)}`;
  blobCache.set(sourceKey, proxyUrl);
  return proxyUrl;
}

/**
 * Fetches every store product, its variants, retail prices (converted to
 * GBP pence), and per-colour preview images (durably re-hosted on Blob).
 * A failure on one image or one variant's price is logged and skipped
 * rather than aborting the whole fetch.
 *
 * @param {{ apiKey: string, storeId: string, onLog?: (msg: string) => void }} params
 */
export async function fetchAllProductsWithPricesAndImages({ apiKey, storeId, onLog = () => {} }) {
  const log = onLog;
  const headers = { "X-API-KEY": apiKey, "Content-Type": "application/json" };
  const base = `https://ecommerce.gelatoapis.com/v1/stores/${storeId}`;

  async function get_(url) {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${await res.text()}`);
    return res.json();
  }

  const gbpRate = await getGbpRate();
  const { products = [] } = await get_(`${base}/products?limit=100`);
  log(`Found ${products.length} product(s) in store.`);

  const results = [];

  for (const product of products) {
    const pid = product.id;
    const name = product.title ?? product.name ?? "Untitled";
    const slug = toSlug(name);
    log(`📦  ${name}`);

    const detail = await get_(`${base}/products/${pid}`);
    const variants = detail.variants ?? [];

    const images = [];
    for (const url of extractImageUrls(detail)) {
      try {
        const blobUrl = await persistImageToBlob(url);
        if (!images.includes(blobUrl)) images.push(blobUrl);
      } catch (err) {
        log(`  ⚠️  Skipping product image: ${err.message}`);
      }
    }

    const scopedImagesByVariant = groupScopedImagesByVariant(detail);

    const variantPrices = {};
    const variantImages = {};
    for (const v of variants) {
      let vdata;
      try {
        vdata = await get_(`${base}/products/${pid}/variants/${v.id}`);
      } catch (err) {
        log(`  ⚠️  Skipping variant ${v.title ?? v.id}: ${err.message}`);
        continue;
      }

      const priceEur = vdata.price ?? 0;
      const priceGbpPence = Math.round(priceEur * gbpRate * 100);
      log(`  ${vdata.title ?? v.id}: EUR ${priceEur} → ${priceGbpPence}p (£${(priceGbpPence / 100).toFixed(2)})`);
      variantPrices[v.id] = priceGbpPence;

      // Per-colour mockups: the variant's own default preview, plus any
      // extra angles (back/side/etc.) scoped to it via productImages above.
      const candidateUrls = [...extractImageUrls(vdata), ...(scopedImagesByVariant[v.id] ?? [])];
      const persisted = [];
      const seenBlobUrls = new Set();
      for (const url of candidateUrls) {
        try {
          const blobUrl = await persistImageToBlob(url);
          if (!seenBlobUrls.has(blobUrl)) {
            seenBlobUrls.add(blobUrl);
            persisted.push(blobUrl);
          }
        } catch (err) {
          log(`  ⚠️  Skipping image for ${vdata.title ?? v.id}: ${err.message}`);
        }
      }
      if (persisted.length > 0) variantImages[v.id] = persisted;
    }

    const priceValues = Object.values(variantPrices);
    const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;

    results.push({
      gelatoProductId: pid,
      name,
      slug,
      price: minPrice,
      variantPrices,
      variantImages,
      images,
    });
    log(`  → From £${(minPrice / 100).toFixed(2)}`);
  }

  return results;
}
