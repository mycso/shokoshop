import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createReturn, generateReturnId, getReturnByOrderId } from "@/lib/returns";
import { getOrderById } from "@/lib/orders";
import { ReturnReason, ReturnResolution } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items, reason, description, resolution } = body as {
      orderId: string;
      items: { itemId: string; name: string; quantity: number }[];
      reason: ReturnReason;
      description: string;
      resolution: ReturnResolution;
    };

    if (!orderId || !items?.length || !reason || !resolution) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const existing = await getReturnByOrderId(orderId);
    if (existing) {
      return NextResponse.json(
        { error: "A return request already exists for this order" },
        { status: 409 }
      );
    }

    // Calculate refund amount from the selected order items
    const refundAmount = items.reduce((sum, ri) => {
      const orderItem = order.items.find((oi) => oi.id === ri.itemId);
      return sum + (orderItem ? orderItem.price * ri.quantity : 0);
    }, 0);

    // Retrieve the Stripe payment intent ID from the session (best-effort)
    let stripePaymentIntentId: string | undefined;
    if (order.stripeSessionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2026-05-27.dahlia",
        });
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        stripePaymentIntentId = session.payment_intent as string | undefined;
      } catch {
        // non-fatal — refund can still be triggered manually by admin
      }
    }

    const now = new Date().toISOString();
    const returnRequest = await createReturn({
      id: generateReturnId(),
      orderId,
      customerEmail: order.customerEmail,
      items,
      reason,
      description: description ?? "",
      resolution,
      status: "pending",
      refundAmount,
      stripePaymentIntentId,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ returnRequest }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
