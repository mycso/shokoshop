import { getOrderById, updateOrder } from "@/lib/orders";
import { GelatoOrderPayload } from "@/types";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_API_BASE = "https://order.gelatoapis.com";

export async function POST(request: Request) {
  try {
    const { orderId }: { orderId: string } = await request.json();
    const order = getOrderById(orderId);

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (!GELATO_API_KEY) {
      // Demo mode: mark as processing
      updateOrder(orderId, { status: "processing" });
      return Response.json({
        message: "Demo mode: order marked as processing (Gelato not configured)",
        orderId,
      });
    }

    const [firstName, ...lastNameParts] = order.shippingAddress.name.split(" ");
    const lastName = lastNameParts.join(" ") || firstName;

    const items = order.items
      .filter((item) => item.customDesignUrl)
      .map((item) => ({
        itemReferenceId: item.id,
        productUid: item.gelatoProductId ?? item.productId,
        quantity: item.quantity,
        files: [
          {
            type: "default",
            url: item.customDesignUrl!,
          },
        ],
      }));

    if (items.length === 0) {
      return Response.json(
        { error: "No items with a design file — upload a design before ordering" },
        { status: 400 }
      );
    }

    const payload: GelatoOrderPayload = {
      orderReferenceId: order.id,
      customerReferenceId: order.customerEmail,
      currency: "GBP",
      shipmentMethodUid: "standard",
      shippingAddress: {
        firstName,
        lastName,
        addressLine1: order.shippingAddress.line1,
        addressLine2: order.shippingAddress.line2,
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
      throw new Error(`Gelato API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    updateOrder(orderId, {
      status: "processing",
      gelatoOrderId: data.id,
    });

    return Response.json({ gelatoOrderId: data.id });
  } catch (err) {
    console.error("Gelato create-order error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create Gelato order" },
      { status: 500 }
    );
  }
}
