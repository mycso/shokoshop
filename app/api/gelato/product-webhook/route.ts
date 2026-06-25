import { revalidateTag } from "next/cache";
import { verifyGelatoSignature } from "@/lib/gelato-webhook";
import { GELATO_PRODUCTS_TAG, getGelatoProducts } from "@/lib/gelato-data";

const WEBHOOK_SECRET = process.env.GELATO_WEBHOOK_SECRET;

/**
 * Fires whenever a product is edited in the Gelato dashboard (e.g.
 * store_product_template_updated / store_product_updated / created) —
 * register this URL for those events in Gelato's Developer > Webhooks
 * settings. Invalidates the cached catalog immediately so the next visitor
 * sees the change, then proactively re-warms it so nobody has to wait.
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();

    if (!verifyGelatoSignature(body, request.headers.get("x-gelato-signature"), WEBHOOK_SECRET)) {
      console.warn("Gelato product webhook: invalid signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });
    getGelatoProducts().catch((err) => {
      console.error("Gelato product webhook: re-warm failed", err);
    });

    return Response.json({ received: true });
  } catch (err) {
    console.error("Gelato product webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
