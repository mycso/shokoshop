import { updateOrder } from "@/lib/orders";
import { verifyGelatoSignature } from "@/lib/gelato-webhook";

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

    if (!verifyGelatoSignature(body, request.headers.get("x-gelato-secret"), WEBHOOK_SECRET)) {
      console.warn("Gelato webhook: invalid secret");
      return Response.json({ error: "Invalid secret" }, { status: 401 });
    }

    // Gelato sends order data flat at the root (not nested under "order")
    const payload = JSON.parse(body) as {
      event: string;
      orderReferenceId?: string;
      status?: string;
      trackingCode?: string;
      trackingUrl?: string;
      // older nested format — kept for safety
      order?: {
        orderReferenceId: string;
        status: string;
        shipment?: { trackingCode: string; trackingUrl: string };
      };
    };

    const orderId = payload.orderReferenceId ?? payload.order?.orderReferenceId;
    if (!orderId) return Response.json({ received: true });

    const rawStatus = payload.status ?? payload.order?.status ?? "";
    const status = mapGelatoStatus(rawStatus);
    const updateData: Record<string, string | undefined> = { status };

    const trackingCode = payload.trackingCode ?? payload.order?.shipment?.trackingCode;
    const trackingUrl  = payload.trackingUrl  ?? payload.order?.shipment?.trackingUrl;
    if (trackingCode) {
      updateData.trackingNumber = trackingCode;
      updateData.trackingUrl = trackingUrl;
    }

    await updateOrder(orderId, updateData);

    console.log(`Gelato webhook: ${payload.event} for order ${orderId} -> ${status}`);

    return Response.json({ received: true });
  } catch (err) {
    console.error("Gelato webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
