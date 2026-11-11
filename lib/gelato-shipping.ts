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

export type ShippingMethodType = "standard" | "express";

export interface ShippingQuote {
  method: ShippingMethodType;
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
  type?: string; // Gelato: "normal" | "express" | "pallet"
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
  address: ShippingQuoteAddress,
  method: ShippingMethodType = "standard"
): Promise<ShippingQuote | null> {
  const options = await getGelatoShippingOptions(items, address);
  if (options.length === 0) return null;
  // Express was requested but isn't offered for this order: the caller falls
  // back to standard rather than failing checkout.
  return options.find((o) => o.method === method) ?? options.find((o) => o.method === "standard") ?? options[0];
}

/**
 * Every shipping option (cheapest standard, cheapest express) that Gelato
 * offers for the whole cart. Empty when Gelato can't be reached or no method
 * is common to every fulfilment facility.
 */
export async function getGelatoShippingOptions(
  items: ShippingQuoteItem[],
  address: ShippingQuoteAddress
): Promise<ShippingQuote[]> {
  const apiKey = GELATO_API_KEY;
  const storeId = GELATO_STORE_ID;
  if (!apiKey || !storeId || items.length === 0) return [];

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
    if (!res.ok) return [];

    const data = await res.json();
    const groups: GelatoQuoteGroup[] = Array.isArray(data.quotes) ? data.quotes : [];
    if (groups.length === 0) return [];

    // The Gelato order-creation call takes a single shipmentMethodUid for the
    // whole order, so when items ship from multiple fulfilment facilities we
    // need a method offered in every group — pick whichever common option
    // has the lowest combined price across all groups.
    const uidSets = groups.map(
      (g) => new Set((g.shipmentMethods ?? []).map((m) => m.shipmentMethodUid))
    );
    const commonUids = [...uidSets[0]].filter((uid) => uidSets.every((s) => s.has(uid)));
    if (commonUids.length === 0) return [];

    const best: Partial<Record<ShippingMethodType, ShippingQuote>> = {};
    for (const uid of commonUids) {
      let total = 0;
      let name = uid;
      let isExpress = false;
      let minDays = 0;
      let maxDays = 0;
      for (const group of groups) {
        const method = group.shipmentMethods.find((m) => m.shipmentMethodUid === uid);
        if (!method) continue;
        total += method.price;
        name = method.name;
        isExpress = isExpress || method.type === "express" || /express/i.test(method.name);
        minDays = Math.max(minDays, method.minDeliveryDays ?? 0);
        maxDays = Math.max(maxDays, method.maxDeliveryDays ?? 0);
      }
      const kind: ShippingMethodType = isExpress ? "express" : "standard";
      const current = best[kind];
      if (!current || total < current.pricePence / 100) {
        best[kind] = {
          method: kind,
          shipmentMethodUid: uid,
          name,
          pricePence: Math.round(total * 100),
          minDeliveryDays: minDays || undefined,
          maxDeliveryDays: maxDays || undefined,
        };
      }
    }
    return [best.standard, best.express].filter((q): q is ShippingQuote => !!q);
  } catch {
    return [];
  }
}
