import Stripe from "stripe";
import { getOrderById, updateOrder } from "@/lib/orders";
import { submitGelatoOrder } from "@/lib/gelato-order";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import { sendAdminOrderNotificationEmail } from "@/lib/email/send-admin-order-notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    console.warn("Stripe not configured – skipping webhook");
    return Response.json({ received: true });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) break;

      // Store payment intent ID (needed for Stripe refunds) and mark paid
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id;

      await updateOrder(orderId, {
        status: "paid",
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      });

      // Submit directly to Gelato — no HTTP self-call, works in serverless
      const order = await getOrderById(orderId);
      if (order) {
        try {
          const result = await submitGelatoOrder(order);
          console.log(`Order ${orderId} → Gelato ${result.gelatoOrderId}`);
        } catch (err) {
          // Log but return 200 — Stripe retries on non-2xx and duplicate orders are worse
          console.error(`Gelato submission failed for order ${orderId}:`, err);
        }

        await sendOrderConfirmationEmail(order).catch((err) =>
          console.error(`Order confirmation email failed for order ${orderId}:`, err)
        );
        await sendAdminOrderNotificationEmail(order).catch((err) =>
          console.error(`Admin order notification email failed for order ${orderId}:`, err)
        );
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.warn("Payment failed:", intent.id);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
