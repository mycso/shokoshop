import { resolveProductUid } from "@/lib/gelato-order";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

export interface ShippingQuoteItem {
  productId: string; // Gelato store product id (CartItem.productId)
  variantName?: string;
  quantity: number;
}

export interface ShippingQuoteAddress {
  country: string;
  postalCode?: string;
  state?: string;
  city?: string;
}

export interface ShippingQuote {
  shipmentMethodUid: string;
  name: string;
  pricePence: number; // GBP, pence
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
}

interface GelatoShipmentMethod {
  shipmentMethodUid: string;
  name: string;
  price: number;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
}

interface GelatoQuoteGroup {
  itemReferenceIds: string[];
  fulfillmentCountry: string;
  shipmentMethods: GelatoShipmentMethod[];
}

/**
 * Gets a live shipping quote from Gelato's Order API for the given cart
 * contents and destination, so checkout shows the actual carrier cost for
 * that country/product mix rather than a flat estimate. Returns null (rather
 * than throwing) whenever Gelato can't be reached or has no common shipment
 * method across every fulfilment facility for this order — callers should
 * fall back to the static shippingCostPence() table in that case so checkout
 * never blocks on a third-party API.
 */
export async function getGelatoShippingQuote(
  items: ShippingQuoteItem[],
  address: ShippingQuoteAddress
): Promise<ShippingQuote | null> {
  const apiKey = GELATO_API_KEY;
  const storeId = GELATO_STORE_ID;
  if (!apiKey || !storeId || items.length === 0) return null;

  try {
    const products = await Promise.all(
      items.map(async (item, i) => ({
        itemReferenceId: `q_${i}`,
        productUid: await resolveProductUid(
          item.productId,
          item.variantName,
          item.productId,
          apiKey,
          storeId
        ),
        quantity: item.quantity,
      }))
    );

    const res = await fetch("https://order.gelatoapis.com/v4/orders:quote", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({
        orderReferenceId: `quote_${Date.now()}`,
        customerReferenceId: "shipping-estimate",
        currency: "GBP",
        recipient: {
          country: address.country,
          city: address.city || "",
          postCode: address.postalCode || "",
          state: address.state || undefined,
        },
        products,
      }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const groups: GelatoQuoteGroup[] = Array.isArray(data.quotes) ? data.quotes : [];
    if (groups.length === 0) return null;

    // The Gelato order-creation call takes a single shipmentMethodUid for the
    // whole order, so when items ship from multiple fulfilment facilities we
    // need a method offered in every group — pick whichever common option
    // has the lowest combined price across all groups.
    const uidSets = groups.map(
      (g) => new Set((g.shipmentMethods ?? []).map((m) => m.shipmentMethodUid))
    );
    const commonUids = [...uidSets[0]].filter((uid) => uidSets.every((s) => s.has(uid)));
    if (commonUids.length === 0) return null;

    let best: ShippingQuote | null = null;
    for (const uid of commonUids) {
      let total = 0;
      let name = uid;
      let minDays = 0;
      let maxDays = 0;
      for (const group of groups) {
        const method = group.shipmentMethods.find((m) => m.shipmentMethodUid === uid);
        if (!method) continue;
        total += method.price;
        name = method.name;
        minDays = Math.max(minDays, method.minDeliveryDays ?? 0);
        maxDays = Math.max(maxDays, method.maxDeliveryDays ?? 0);
      }
      if (!best || total < best.pricePence / 100) {
        best = {
          shipmentMethodUid: uid,
          name,
          pricePence: Math.round(total * 100),
          minDeliveryDays: minDays || undefined,
          maxDeliveryDays: maxDays || undefined,
        };
      }
    }
    return best;
  } catch {
    return null;
  }
}
