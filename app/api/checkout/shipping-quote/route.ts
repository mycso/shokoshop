import { CartItem } from "@/types";
import { getGelatoShippingOptions } from "@/lib/gelato-shipping";
import { shippingCostPence, shippingLabel } from "@/lib/shipping";

export async function POST(request: Request) {
  const {
    items,
    country,
    postalCode,
    state,
    city,
  }: {
    items: CartItem[];
    country: string;
    postalCode?: string;
    state?: string;
    city?: string;
  } = await request.json();

  if (!country) {
    return Response.json({ error: "country is required" }, { status: 400 });
  }

  const quotes = await getGelatoShippingOptions(
    (items ?? []).map((item) => ({
      productId: item.productId,
      variantName: item.variantName,
      quantity: item.quantity,
    })),
    { country, postalCode, state, city }
  );

  if (quotes.length > 0) {
    const options = quotes.map((quote) => ({
      method: quote.method,
      shipmentMethodUid: quote.shipmentMethodUid,
      label:
        quote.minDeliveryDays && quote.maxDeliveryDays
          ? `${quote.name} (${quote.minDeliveryDays}–${quote.maxDeliveryDays} business days)`
          : quote.name,
      pricePence: quote.pricePence,
    }));
    return Response.json({ source: "gelato", options, ...options[0] });
  }

  // Gelato unreachable/unconfigured or has no shipment method common to
  // every item's fulfilment facility — fall back to the flat-rate table so
  // checkout is never blocked by a third-party API.
  return Response.json({
    source: "fallback",
    options: [
      {
        method: "standard",
        shipmentMethodUid: "standard",
        label: shippingLabel(country),
        pricePence: shippingCostPence(country),
      },
    ],
    method: "standard",
    shipmentMethodUid: "standard",
    label: shippingLabel(country),
    pricePence: shippingCostPence(country),
  });
}
