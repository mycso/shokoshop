import { getOrderById } from "@/lib/orders";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

// GET /api/gelato/debug-order?orderId=ord_xxx
// Shows exactly what variant IDs would be submitted to Gelato, plus the raw product data from Gelato's API.
export async function GET(request: Request) {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) {
    return Response.json({ error: "Missing GELATO_API_KEY or GELATO_STORE_ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return Response.json({ error: "Pass ?orderId=ord_xxx" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const itemDebug = await Promise.all(
    order.items.map(async (item) => {
      const productUrl = `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/products/${item.productId}`;
      let gelatoProduct: unknown = null;
      let productFetchStatus: number | null = null;
      let resolvedVariantId: string | null = null;
      let resolveMethod: string = "fallback";

      try {
        const res = await fetch(productUrl, {
          headers: { "X-API-KEY": GELATO_API_KEY!, "Content-Type": "application/json" },
        });
        productFetchStatus = res.status;
        if (res.ok) {
          gelatoProduct = await res.json();
          const data = gelatoProduct as { variants?: { id: string; title: string }[] };
          const variants = data.variants ?? [];
          const match = variants.find((v) => v.title === item.variantName);
          if (match) {
            resolvedVariantId = match.id;
            resolveMethod = "title-match";
          } else if (variants[0]) {
            resolvedVariantId = variants[0].id;
            resolveMethod = "first-variant-fallback";
          } else {
            resolvedVariantId = item.variantId ?? item.productId ?? null;
            resolveMethod = "cart-fallback-no-variants";
          }
        } else {
          resolvedVariantId = item.variantId ?? item.productId ?? null;
          resolveMethod = `product-fetch-failed-${res.status}`;
          gelatoProduct = await res.text();
        }
      } catch (err) {
        resolvedVariantId = item.variantId ?? item.productId ?? null;
        resolveMethod = `exception: ${err instanceof Error ? err.message : String(err)}`;
      }

      return {
        cartItem: {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
        },
        gelatoProductUrl: productUrl,
        gelatoProductFetchStatus: productFetchStatus,
        gelatoProduct,
        resolvedVariantId,
        resolveMethod,
      };
    })
  );

  return Response.json({
    orderId: order.id,
    storeId: GELATO_STORE_ID,
    items: itemDebug,
  });
}
