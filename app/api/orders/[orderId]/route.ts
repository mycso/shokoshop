import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth/dal";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const owns = order.userId ? order.userId === user.id : order.customerEmail === user.email;
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ order });
}
