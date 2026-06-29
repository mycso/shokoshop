import { getOrderById, updateOrder } from "@/lib/orders";
import { submitGelatoOrder } from "@/lib/gelato-order";

export async function POST(request: Request) {
  try {
    const { orderId, force = false }: { orderId: string; force?: boolean } = await request.json();
    const order = await getOrderById(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: skip if already submitted unless admin explicitly forces a re-submit
    if (order.gelatoOrderId && !force) {
      return Response.json({ gelatoOrderId: order.gelatoOrderId, alreadySubmitted: true });
    }

    // Force re-submit: only allow if order is not currently being processed
    if (force && order.gelatoOrderId) {
      await updateOrder(orderId, { gelatoOrderId: undefined });
    }

    // Non-force: also block if already paid and processing (webhook already handled it)
    if (!force && order.status === "processing") {
      return Response.json({ skipped: true, reason: "already processing" });
    }

    // Called from success page after Stripe payment — mark paid if still pending
    if (order.status === "pending") {
      await updateOrder(orderId, { status: "paid" });
    }

    const result = await submitGelatoOrder(order, { retry: !!force });
    return Response.json(result);
  } catch (err) {
    console.error("Gelato create-order error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create Gelato order" },
      { status: 500 }
    );
  }
}
