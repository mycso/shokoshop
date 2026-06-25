import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAllProductsWithPricesAndImages, assignExtraImagesToAllVariants } from "@/lib/gelato-sync.mjs";
import { GELATO_PRODUCTS_TAG } from "@/lib/gelato-data";

const API_KEY = process.env.GELATO_API_KEY;
const STORE_ID = process.env.GELATO_STORE_ID;

/**
 * Backs the admin "Sync Prices from Gelato" button — forces a fresh fetch,
 * auto-assigns extra mockup images to all variants, then invalidates cache.
 */
export async function POST() {
  if (!API_KEY || !STORE_ID) {
    return NextResponse.json({ error: "Gelato not configured" }, { status: 500 });
  }

  try {
    const log: string[] = [];

    const results = await fetchAllProductsWithPricesAndImages({
      apiKey: API_KEY,
      storeId: STORE_ID,
      onLog: (msg: string) => log.push(msg),
    });

    // Auto-assign extra images to all variants for every product
    for (const product of results) {
      await assignExtraImagesToAllVariants({
        apiKey: API_KEY,
        storeId: STORE_ID,
        productId: product.gelatoProductId,
        onLog: (msg: string) => { log.push(msg); },
      });
    }

    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    return NextResponse.json({ ok: true, synced: results.length, log });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
