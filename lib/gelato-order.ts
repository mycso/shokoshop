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
 * Submits a paid order to Gelato using the direct Order API (order.gelatoapis.com/v4/orders).
 * Uses productUid (resolved from the variant) so the correct blank product SKU is printed.
 * When a custom design file is configured it is sent as the print file; when not, Gelato
 * uses the design saved in the product template automatically.
 * Neck-inner label files are always sent for Gildan inlbl_ SKUs.
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
      const override = overrides.find((o) => o.gelatoProductId === item.productId);
      const designFilename = override?.designFilename;

      const files: { type: string; url: string }[] = [];

      // Resolve productUid to detect inner-label (inlbl_) variants
      const productUid = await resolveProductUid(
        item.productId, item.variantName,
        item.variantId ?? item.productId,
        GELATO_API_KEY!, GELATO_STORE_ID!
      );
      const isInnerLabel = productUid.includes("inlbl_");

      if (designFilename) {
        const designUrl = `${BASE_URL}/api/designs/${encodeURIComponent(designFilename)}`;
        files.push({ type: "default", url: designUrl });
        console.log(`[gelato-order] item ${i}: variant=${item.variantId} designUrl=${designUrl}`);
      } else {
        console.log(`[gelato-order] item ${i}: variant=${item.variantId} — no design file, using product template`);
      }

      // Always send the blank neck label for inner-label variants so it is never
      // accidentally omitted when there is no custom design file override.
      if (isInnerLabel) {
        files.push({ type: "neck-inner", url: `${BASE_URL}/api/designs/neck-label-blank.png` });
        console.log(`[gelato-order] item ${i}: inlbl_ variant — adding neck-inner label`);
      }

      return {
        itemReferenceId: item.id ?? `item_${i}`,
        // storeProductVariantId lets Gelato use the product template design
        // automatically; productUid is only needed when explicitly overriding
        // the design with custom files (which we still send via `files` below).
        storeProductVariantId: item.variantId ?? item.productId,
        ...(files.length > 0 ? { files } : {}),
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

  console.log(`[gelato-order] submitting order:`, JSON.stringify(payload, null, 2));

  const res = await fetch(
    `https://order.gelatoapis.com/v4/orders`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": GELATO_API_KEY },
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
