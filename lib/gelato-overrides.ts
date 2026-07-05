import { get, put, head, BlobPreconditionFailedError } from "@vercel/blob";
import { categorySlugFromLabel } from "@/lib/categories";

const OVERRIDES_PATH = "gelato-data/overrides.json";

/**
 * A locally-stored product entry: either an override merged onto a live
 * Gelato product (matched by gelatoProductId), or a standalone manual
 * product with no corresponding Gelato product at all.
 */
export interface LocalProductOverride {
  gelatoProductId: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  variantPrices?: Record<string, number>;
  images?: string[];
  categories?: string[];
  /** @deprecated legacy single-label field from before multi-category support; read-only migration path */
  category?: string;
  inStock?: boolean;
  variants?: unknown[];
  id?: string;
  /** Filename of the print-ready design file stored in Vercel Blob under product-designs/ */
  designFilename?: string;
}

/**
 * Admin-entered data has no source of truth to refetch from (unlike prices
 * and images, which come live from Gelato), so it's the one piece of
 * product data that still needs real persistent storage. Stored as a small
 * private JSON blob — same store already used for preview images.
 */
export async function getOverrides(): Promise<LocalProductOverride[]> {
  const { overrides } = await readOverrides();
  return overrides;
}

async function readOverrides(): Promise<{ overrides: LocalProductOverride[]; etag?: string }> {
  // useCache: false — this file is read-modify-written from several routes
  // (design uploads, webhooks, price/category sync); a CDN-cached read here
  // would defeat the ifMatch check below and let concurrent writers stomp
  // each other's changes.
  //
  // The etag for ifMatch comes from head(), not get(): get() returns a weak
  // etag (W/"..."), but put()'s ifMatch does a strong comparison and a weak
  // etag never satisfies it — every conditional write would fail even with
  // zero contention. head() returns the strong form.
  const [result, headResult] = await Promise.all([
    get(OVERRIDES_PATH, { access: "private", useCache: false }).catch(() => null),
    head(OVERRIDES_PATH).catch(() => null),
  ]);
  if (!result?.stream) return { overrides: [] };
  try {
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text || "[]");
    return { overrides: Array.isArray(parsed) ? parsed : [], etag: headResult?.etag };
  } catch {
    return { overrides: [], etag: headResult?.etag };
  }
}

// Alongside `BlobPreconditionFailedError` (our own ifMatch failing), the
// store can also reject two simultaneous writes to the same pathname with a
// plain "conflicting operation" error that the SDK doesn't give its own
// error class — it surfaces as a generic BlobError. Both mean the same
// thing here: someone else touched this blob, retry against fresh data.
function isRetryableWriteConflict(err: unknown): boolean {
  if (err instanceof BlobPreconditionFailedError) return true;
  return err instanceof Error && /conflicting operation|precondition|etag mismatch/i.test(err.message);
}

function fieldsMatch(stored: LocalProductOverride | undefined, entry: LocalProductOverride): boolean {
  if (!stored) return false;
  return (Object.keys(entry) as (keyof LocalProductOverride)[]).every(
    (key) => JSON.stringify(stored[key]) === JSON.stringify(entry[key])
  );
}

/**
 * Read-modify-write with optimistic concurrency: several routes (design
 * uploads, the Gelato webhook, price/category sync) can write this same
 * blob around the same time. Without a conditional write, whichever request
 * reads last-and-writes-last silently overwrites the others' changes —
 * which is how a just-uploaded design file could vanish after a webhook
 * fired moments later. `ifMatch` makes a stale write fail instead of
 * clobbering, and we retry against the fresh copy.
 *
 * A conditional write can still report success and lose the race in a tiny
 * window right after (the store's own consistency, not something ifMatch
 * can catch) — so after writing, we read back and confirm our fields
 * actually stuck, retrying the whole cycle if they didn't.
 */
export async function setOverride(entry: LocalProductOverride): Promise<void> {
  const MAX_ATTEMPTS = 20;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { overrides, etag } = await readOverrides();
    const idx = overrides.findIndex((o) => o.gelatoProductId === entry.gelatoProductId);
    if (idx >= 0) overrides[idx] = { ...overrides[idx], ...entry };
    else overrides.push(entry);

    try {
      await put(OVERRIDES_PATH, JSON.stringify(overrides, null, 2), {
        access: "private",
        contentType: "application/json",
        allowOverwrite: true,
        ...(etag ? { ifMatch: etag } : {}),
      });
    } catch (err) {
      if (isRetryableWriteConflict(err) && attempt < MAX_ATTEMPTS) {
        // Back off with jitter so retries don't all collide again at once.
        await new Promise((r) => setTimeout(r, 20 * attempt + Math.random() * 50));
        continue;
      }
      throw err;
    }

    const verify = await getOverrides();
    const stored = verify.find((o) => o.gelatoProductId === entry.gelatoProductId);
    if (fieldsMatch(stored, entry)) return;
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 20 * attempt + Math.random() * 50));
      continue;
    }
    throw new Error(`setOverride: write for ${entry.gelatoProductId} did not stick after ${MAX_ATTEMPTS} attempts`);
  }
}

/**
 * Merges admin overrides onto live Gelato products: a matching override's
 * variantPrices/images win over the Gelato-derived values; an override with
 * no matching product is appended as a standalone manual entry.
 */
export function mergeOverrides<T extends { gelatoProductId?: string; variantPrices?: Record<string, number>; price?: number; images?: string[]; categories?: string[] }>(
  products: T[],
  overrides: LocalProductOverride[]
): T[] {
  const result = products.map((p) => {
    const o = overrides.find((o) => o.gelatoProductId === p.gelatoProductId);
    if (!o) return p;

    const variantPrices = { ...p.variantPrices, ...o.variantPrices };
    const priceValues = Object.values(variantPrices) as number[];
    const price = priceValues.length > 0 ? Math.min(...priceValues) : o.price ?? p.price;

    // Admin images come first (in the order saved), then any Gelato images not already included
    const gelatoImages = p.images ?? [];
    const adminImages = o.images ?? [];
    const gelatoExtras = gelatoImages.filter((u) => !adminImages.includes(u));
    const images = adminImages.length > 0
      ? [...adminImages, ...gelatoExtras].filter(Boolean) as string[]
      : gelatoImages;

    // Legacy overrides only ever stored a single label (e.g. "Films") — map it to its slug once.
    const legacyCategories = o.category ? [categorySlugFromLabel(o.category)].filter((s): s is string => !!s) : undefined;
    const categories = o.categories ?? legacyCategories ?? p.categories;
    return { ...p, variantPrices, price, images, ...(categories ? { categories } : {}) };
  });

  for (const o of overrides) {
    if (!result.some((p) => p.gelatoProductId === o.gelatoProductId)) {
      result.push(o as unknown as T);
    }
  }

  return result;
}
