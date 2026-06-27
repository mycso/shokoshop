import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getReturnById, updateReturn } from "@/lib/returns";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action, adminNote } = (await req.json()) as {
    action: "approve" | "reject";
    adminNote?: string;
  };

  const returnRequest = await getReturnById(id);
  if (!returnRequest) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }

  if (returnRequest.status !== "pending") {
    return NextResponse.json(
      { error: `Return is already ${returnRequest.status}` },
      { status: 409 }
    );
  }

  if (action === "reject") {
    const updated = await updateReturn(id, { status: "rejected", adminNote });
    return NextResponse.json({ returnRequest: updated });
  }

  // Approve — issue Stripe refund if possible
  if (action === "approve") {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey && returnRequest.stripePaymentIntentId) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2026-05-27.dahlia" });

        const refundParams: Stripe.RefundCreateParams = {
          payment_intent: returnRequest.stripePaymentIntentId,
        };
        // Partial refund if only some items were returned
        if (returnRequest.refundAmount && returnRequest.refundAmount > 0) {
          refundParams.amount = returnRequest.refundAmount;
        }

        const refund = await stripe.refunds.create(refundParams);

        const updated = await updateReturn(id, {
          status: "refunded",
          stripeRefundId: refund.id,
          adminNote,
        });
        return NextResponse.json({ returnRequest: updated, refundId: refund.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          { error: `Stripe refund failed: ${message}` },
          { status: 502 }
        );
      }
    }

    // No Stripe key or no payment intent — approve without auto-refund
    const updated = await updateReturn(id, { status: "approved", adminNote });
    return NextResponse.json({ returnRequest: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
