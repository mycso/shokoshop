import { unstable_cache } from "next/cache";
import { fetchAllProductsWithPricesAndImages } from "@/lib/gelato-sync.mjs";
import { getOverrides, mergeOverrides } from "@/lib/gelato-overrides";

export const GELATO_PRODUCTS_TAG = "gelato-products";

export interface GelatoLocalProduct {
  gelatoProductId: string;
  name: string;
  slug: string;
  price: number;
  variantPrices: Record<string, number>;
  variantImages: Record<string, string[]>;
  images: string[];
}

/**
 * Canonical read path for storefront pages and admin routes: live Gelato
 * product/price/image data, merged with any admin overrides, cached via
 * Next's Data Cache (works correctly across serverless invocations on
 * Vercel — unlike a local file). Invalidated instantly by the Gelato
 * product webhook (app/api/gelato/product-webhook/route.ts) via
 * revalidateTag(GELATO_PRODUCTS_TAG); the 1h revalidate below is just a
 * fallback in case a webhook is ever missed.
 */
export const getGelatoProducts = unstable_cache(
  async (): Promise<GelatoLocalProduct[]> => {
    const apiKey = process.env.GELATO_API_KEY;
    const storeId = process.env.GELATO_STORE_ID;
    if (!apiKey || !storeId) return [];

    const products = (await fetchAllProductsWithPricesAndImages({ apiKey, storeId })) as GelatoLocalProduct[];
    const overrides = await getOverrides();
    return mergeOverrides(products, overrides);
  },
  ["gelato-products"],
  { tags: [GELATO_PRODUCTS_TAG], revalidate: 3600 }
);
