import { createOrder, getOrdersByEmail, getAllOrders, generateOrderId } from "@/lib/orders";
import { Cart, ShippingAddress } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (email) {
    const orders = await getOrdersByEmail(email);
    return Response.json({ orders });
  }

  // Return all (admin use)
  const orders = await getAllOrders();
  return Response.json({ orders });
}

export async function POST(request: Request) {
  try {
    const body: {
      customerEmail: string;
      customerName: string;
      cart: Cart;
      shippingAddress: ShippingAddress;
    } = await request.json();

    const order = await createOrder({
      id: generateOrderId(),
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      items: body.cart.items,
      total: body.cart.total,
      status: "paid",
      shippingAddress: body.shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return Response.json({ order }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create order" },
      { status: 500 }
    );
  }
}
