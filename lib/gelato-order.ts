import { Order } from "@/types";
import { updateOrder } from "@/lib/orders";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

/**
 * Submits a paid order to Gelato via the ecommerce store orders API.
 * Store products already have artwork linked in Gelato — no print file needed.
 * Uses storeProductVariantId (the variant UUID from the store) not the
 * catalog productUid, which would require a separate print file upload.
 */
export async function submitGelatoOrder(order: Order): Promise<{ gelatoOrderId: string }> {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) {
    updateOrder(order.id, { status: "processing" });
    throw new Error("GELATO_API_KEY or GELATO_STORE_ID not configured");
  }

  const [firstName, ...rest] = order.shippingAddress.name.split(" ");
  const lastName = rest.join(" ") || firstName;

  const items = order.items.map((item, i) => ({
    id: item.id ?? `item_${i}`,
    // variantId is the Gelato store variant UUID (set at add-to-cart time)
    storeProductVariantId: item.variantId ?? item.gelatoProductId ?? item.productId,
    quantity: item.quantity,
  }));

  const payload = {
    orderType: "order",
    id: order.id,
    channel: "api",
    currency: "GBP",
    items,
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
  };

  const res = await fetch(
    `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": GELATO_API_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gelato API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const gelatoOrderId = data.id ?? data.orderId ?? data.orderReferenceId;
  await updateOrder(order.id, { status: "processing", gelatoOrderId });
  return { gelatoOrderId };
}
