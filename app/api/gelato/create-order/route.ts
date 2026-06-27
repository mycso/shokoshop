import { getOrderById, updateOrder } from "@/lib/orders";
import { submitGelatoOrder } from "@/lib/gelato-order";

export async function POST(request: Request) {
  try {
    const { orderId }: { orderId: string } = await request.json();
    const order = await getOrderById(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: already submitted
    if (order.gelatoOrderId) {
      return Response.json({ gelatoOrderId: order.gelatoOrderId, alreadySubmitted: true });
    }

    // Called from success page after Stripe payment — mark paid if still pending
    if (order.status === "pending") {
      await updateOrder(orderId, { status: "paid" });
    }

    const result = await submitGelatoOrder(order);
    return Response.json(result);
  } catch (err) {
    console.error("Gelato create-order error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create Gelato order" },
      { status: 500 }
    );
  }
}
