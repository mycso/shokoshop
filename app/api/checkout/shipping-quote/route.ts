import { CartItem } from "@/types";
import { getGelatoShippingQuote } from "@/lib/gelato-shipping";
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

  const quote = await getGelatoShippingQuote(
    (items ?? []).map((item) => ({
      productId: item.productId,
      variantName: item.variantName,
      quantity: item.quantity,
    })),
    { country, postalCode, state, city }
  );

  if (quote) {
    return Response.json({
      source: "gelato",
      shipmentMethodUid: quote.shipmentMethodUid,
      label:
        quote.minDeliveryDays && quote.maxDeliveryDays
          ? `${quote.name} (${quote.minDeliveryDays}–${quote.maxDeliveryDays} business days)`
          : quote.name,
      pricePence: quote.pricePence,
    });
  }

  // Gelato unreachable/unconfigured or has no shipment method common to
  // every item's fulfilment facility — fall back to the flat-rate table so
  // checkout is never blocked by a third-party API.
  return Response.json({
    source: "fallback",
    shipmentMethodUid: "standard",
    label: shippingLabel(country),
    pricePence: shippingCostPence(country),
  });
}
