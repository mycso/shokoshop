import { Order } from "@/types";
import { updateOrder } from "@/lib/orders";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

/**
 * Fetches the current variant ID for a product by matching the variant title.
 * Variant IDs change when products are edited in Gelato, so we always resolve
 * the live ID rather than relying on the one stored at add-to-cart time.
 */
async function resolveVariantId(
  productId: string,
  variantName: string | undefined,
  fallback: string,
  apiKey: string,
  storeId: string
): Promise<string> {
  try {
    const res = await fetch(
      `https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products/${productId}`,
      { headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" } }
    );
    if (!res.ok) {
      console.log(`[gelato-order] product lookup failed ${res.status} for productId=${productId}`);
      return fallback;
    }
    const data = await res.json();
    const variants: { id: string; title: string }[] = data.variants ?? [];
    console.log(`[gelato-order] productId=${productId} variantName="${variantName}" variants=`, JSON.stringify(variants.map(v => ({ id: v.id, title: v.title }))));
    if (variantName) {
      const match = variants.find((v) => v.title === variantName);
      if (match) {
        console.log(`[gelato-order] matched variant id=${match.id}`);
        return match.id;
      }
      console.log(`[gelato-order] no title match — falling back to first variant`);
    }
    return variants[0]?.id ?? fallback;
  } catch (err) {
    console.log(`[gelato-order] resolveVariantId error:`, err);
    return fallback;
  }
}

/**
 * Submits a paid order to Gelato for fulfilment.
 * Resolves live variant IDs at order time so stale cart IDs never cause issues.
 */
export async function submitGelatoOrder(order: Order): Promise<{ gelatoOrderId: string }> {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) {
    await updateOrder(order.id, { status: "processing" });
    throw new Error("GELATO_API_KEY or GELATO_STORE_ID not configured");
  }

  const [firstName, ...rest] = order.shippingAddress.name.split(" ");
  const lastName = rest.join(" ") || firstName;

  const items = await Promise.all(
    order.items.map(async (item, i) => {
      const storeProductVariantId = await resolveVariantId(
        item.productId,
        item.variantName,
        item.variantId ?? item.productId,
        GELATO_API_KEY!,
        GELATO_STORE_ID!
      );
      return {
        itemReferenceId: item.id ?? `item_${i}`,
        storeProductVariantId,
        quantity: item.quantity,
      };
    })
  );

  const payload = {
    orderReferenceId: order.id,
    customerReferenceId: order.customerEmail,
    storeId: GELATO_STORE_ID,
    currency: "GBP",
    shipmentMethodUid: "standard",
    shippingAddress: {
      firstName,
      lastName,
      addressLine1: order.shippingAddress.line1,
      addressLine2: order.shippingAddress.line2 ?? "",
      city: order.shippingAddress.city,
      postCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
      email: order.customerEmail,
    },
    items,
  };

  const res = await fetch(`https://order.gelatoapis.com/v4/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": GELATO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gelato API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const gelatoOrderId = data.id ?? data.orderId ?? data.orderReferenceId;
  await updateOrder(order.id, { status: "processing", gelatoOrderId });
  return { gelatoOrderId };
}
