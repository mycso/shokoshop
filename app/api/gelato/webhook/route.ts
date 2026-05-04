import { updateOrder } from "@/lib/orders";

// Map Gelato status to our internal order status
function mapGelatoStatus(
  gelatoStatus: string
): "processing" | "shipped" | "delivered" | "cancelled" {
  switch (gelatoStatus.toLowerCase()) {
    case "created":
    case "passed":
    case "printed":
      return "processing";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "canceled":
    case "cancelled":
      return "cancelled";
    default:
      return "processing";
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Gelato webhook payload structure
    const { event, order } = body as {
      event: string;
      order?: {
        orderReferenceId: string;
        status: string;
        shipment?: {
          trackingCode: string;
          trackingUrl: string;
        };
      };
    };

    if (!order?.orderReferenceId) {
      return Response.json({ received: true });
    }

    const status = mapGelatoStatus(order.status ?? "");
    const updateData: Record<string, string | undefined> = { status };

    if (order.shipment?.trackingCode) {
      updateData.trackingNumber = order.shipment.trackingCode;
      updateData.trackingUrl = order.shipment.trackingUrl;
    }

    updateOrder(order.orderReferenceId, updateData);

    console.log(`Gelato webhook: ${event} for order ${order.orderReferenceId} -> ${status}`);

    return Response.json({ received: true });
  } catch (err) {
    console.error("Gelato webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
