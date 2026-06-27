import { Order } from "@/types";
import { updateOrder } from "@/lib/orders";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_API_BASE = "https://order.gelatoapis.com";

/**
 * Submits a paid order to Gelato for printing and fulfilment.
 * Works with pre-configured Gelato store products — no design file upload needed,
 * Gelato already has the artwork linked to each productUid in the dashboard.
 */
export async function submitGelatoOrder(order: Order): Promise<{ gelatoOrderId: string }> {
  if (!GELATO_API_KEY) {
    updateOrder(order.id, { status: "processing" });
    throw new Error("GELATO_API_KEY not configured");
  }

  const [firstName, ...rest] = order.shippingAddress.name.split(" ");
  const lastName = rest.join(" ") || firstName;

  const items = order.items.map((item, i) => ({
    itemReferenceId: item.id ?? `item_${i}`,
    // gelatoProductId is set to the variant's productUid (SKU) at add-to-cart time
    productUid: item.gelatoProductId ?? item.variantId ?? item.productId,
    quantity: item.quantity,
  }));

  const payload = {
    orderReferenceId: order.id,
    customerReferenceId: order.customerEmail,
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

  const res = await fetch(`${GELATO_API_BASE}/v4/orders`, {
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
  updateOrder(order.id, { status: "processing", gelatoOrderId: data.id });
  return { gelatoOrderId: data.id };
}
