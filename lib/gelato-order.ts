import { Order } from "@/types";
import { updateOrder } from "@/lib/orders";
import { getOverrides } from "@/lib/gelato-overrides";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://shokoshop.com";

/**
 * Resolves the Gelato productUid for a variant by title-matching against the
 * live ecommerce store product. The productUid encodes the physical product
 * SKU (size, colour, blank type) needed for direct order fulfillment.
 */
async function resolveProductUid(
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
    const variants: { id: string; title: string; productUid: string }[] = data.variants ?? [];
    if (variantName) {
      const match = variants.find((v) => v.title === variantName);
      if (match?.productUid) {
        console.log(`[gelato-order] matched variant title="${variantName}" productUid=${match.productUid}`);
        return match.productUid;
      }
    }
    const first = variants[0];
    console.log(`[gelato-order] no title match for "${variantName}" — falling back to first variant productUid=${first?.productUid}`);
    return first?.productUid ?? fallback;
  } catch (err) {
    console.log(`[gelato-order] resolveProductUid error:`, err);
    return fallback;
  }
}

/**
 * Submits a paid order to Gelato using the direct order API (v4).
 * Uses productUid + a hosted design file URL instead of storeProductVariantId,
 * which is required for manual API stores where products are never "published"
 * to an external storefront.
 */
export async function submitGelatoOrder(order: Order): Promise<{ gelatoOrderId: string }> {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) {
    await updateOrder(order.id, { status: "processing" });
    throw new Error("GELATO_API_KEY or GELATO_STORE_ID not configured");
  }

  const overrides = await getOverrides();

  const [firstName, ...rest] = order.shippingAddress.name.split(" ");
  const lastName = rest.join(" ") || firstName;

  const items = await Promise.all(
    order.items.map(async (item, i) => {
      const productUid = await resolveProductUid(
        item.productId,
        item.variantName,
        item.variantId ?? item.productId,
        GELATO_API_KEY!,
        GELATO_STORE_ID!
      );

      const override = overrides.find((o) => o.gelatoProductId === item.productId);
      const designFilename = override?.designFilename;
      if (!designFilename) {
        throw new Error(
          `No design file configured for product ${item.productId} ("${item.name}"). ` +
          `Set designFilename in the admin product editor.`
        );
      }

      const designUrl = `${BASE_URL}/api/designs/${encodeURIComponent(designFilename)}`;
      console.log(`[gelato-order] item ${i}: productUid=${productUid} designUrl=${designUrl}`);

      // Products with 'inlbl_' in the productUid (inner-label Gildan variants) require
      // both a front design and a neck-inner label file.
      const files: { type: string; url: string }[] = [{ type: "default", url: designUrl }];
      if (productUid.includes("inlbl_")) {
        files.push({ type: "neck-inner", url: `${BASE_URL}/api/designs/neck-label-blank.png` });
      }

      return {
        itemReferenceId: item.id ?? `item_${i}`,
        productUid,
        files,
        quantity: item.quantity,
      };
    })
  );

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

  console.log(`[gelato-order] submitting direct order:`, JSON.stringify(payload, null, 2));

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
