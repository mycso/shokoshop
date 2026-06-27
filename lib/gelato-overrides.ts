import { get, put } from "@vercel/blob";

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
  category?: string;
  inStock?: boolean;
  variants?: unknown[];
  id?: string;
}

/**
 * Admin-entered data has no source of truth to refetch from (unlike prices
 * and images, which come live from Gelato), so it's the one piece of
 * product data that still needs real persistent storage. Stored as a small
 * private JSON blob — same store already used for preview images.
 */
export async function getOverrides(): Promise<LocalProductOverride[]> {
  const result = await get(OVERRIDES_PATH, { access: "private" }).catch(() => null);
  if (!result?.stream) return [];
  try {
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setOverride(entry: LocalProductOverride): Promise<void> {
  const overrides = await getOverrides();
  const idx = overrides.findIndex((o) => o.gelatoProductId === entry.gelatoProductId);
  if (idx >= 0) overrides[idx] = { ...overrides[idx], ...entry };
  else overrides.push(entry);

  await put(OVERRIDES_PATH, JSON.stringify(overrides, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

/**
 * Merges admin overrides onto live Gelato products: a matching override's
 * variantPrices/images win over the Gelato-derived values; an override with
 * no matching product is appended as a standalone manual entry.
 */
export function mergeOverrides<T extends { gelatoProductId?: string; variantPrices?: Record<string, number>; price?: number; images?: string[]; category?: string }>(
  products: T[],
  overrides: LocalProductOverride[]
): T[] {
  const result = products.map((p) => {
    const o = overrides.find((o) => o.gelatoProductId === p.gelatoProductId);
    if (!o) return p;

    const variantPrices = { ...p.variantPrices, ...o.variantPrices };
    const priceValues = Object.values(variantPrices) as number[];
    const price = priceValues.length > 0 ? Math.min(...priceValues) : o.price ?? p.price;

    // Keep the Gelato primary flatlay first, then admin extras, then remaining Gelato images
    const gelatoImages = p.images ?? [];
    const adminImages = (o.images ?? []).filter((u) => !gelatoImages.includes(u));
    const images = adminImages.length > 0
      ? [gelatoImages[0], ...adminImages, ...gelatoImages.slice(1)].filter(Boolean) as string[]
      : gelatoImages;

    const category = o.category ?? p.category;
    return { ...p, variantPrices, price, images, ...(category ? { category } : {}) };
  });

  for (const o of overrides) {
    if (!result.some((p) => p.gelatoProductId === o.gelatoProductId)) {
      result.push(o as unknown as T);
    }
  }

  return result;
}
