import { getOrderById } from "@/lib/orders";
import { submitGelatoOrder } from "@/lib/gelato-order";

export async function POST(request: Request) {
  try {
    const { orderId }: { orderId: string } = await request.json();
    const order = await getOrderById(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
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
