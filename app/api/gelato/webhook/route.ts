import { createHmac, timingSafeEqual } from "crypto";
import { updateOrder } from "@/lib/orders";

const WEBHOOK_SECRET = process.env.GELATO_WEBHOOK_SECRET;

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
    const body = await request.text();

    if (WEBHOOK_SECRET) {
      const signature = request.headers.get("x-gelato-signature") ?? "";
      const expected = createHmac("sha256", WEBHOOK_SECRET)
        .update(body)
        .digest("hex");
      let match = false;
      try {
        match = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      } catch {
        match = false;
      }
      if (!match) {
        console.warn("Gelato webhook: invalid signature");
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const { event, order } = JSON.parse(body) as {
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
