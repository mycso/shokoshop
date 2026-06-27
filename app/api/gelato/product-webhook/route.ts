import { revalidateTag } from "next/cache";
import { verifyGelatoSignature } from "@/lib/gelato-webhook";
import { GELATO_PRODUCTS_TAG, getGelatoProducts } from "@/lib/gelato-data";
import { assignExtraImagesToAllVariants } from "@/lib/gelato-sync.mjs";

const WEBHOOK_SECRET = process.env.GELATO_WEBHOOK_SECRET;
const API_KEY = process.env.GELATO_API_KEY!;
const STORE_ID = process.env.GELATO_STORE_ID!;

/**
 * Fires whenever a product is edited in the Gelato dashboard. Invalidates
 * the cache immediately, auto-assigns any extra mockup images to all variants
 * (Gelato resets these on every save), then re-warms the cache.
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();

    if (!verifyGelatoSignature(body, request.headers.get("x-gelato-secret"), WEBHOOK_SECRET)) {
      console.warn("Gelato product webhook: invalid secret");
      return Response.json({ error: "Invalid secret" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const productId = payload.storeProductId ?? payload.productId ?? payload.product?.id;

    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    (async () => {
      try {
        if (productId) {
          await assignExtraImagesToAllVariants({ apiKey: API_KEY, storeId: STORE_ID, productId });
        }
        await getGelatoProducts();
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
