import Stripe from "stripe";
import { Cart, ShippingAddress } from "@/types";
import { createOrder, generateOrderId } from "@/lib/orders";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const {
      cart,
      shippingAddress,
    }: {
      cart: Cart;
      shippingAddress: {
        email: string;
        firstName: string;
        lastName: string;
        line1: string;
        line2?: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
      };
    } = await request.json();

    if (!cart?.items?.length) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }

    const orderId = generateOrderId();
    const customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`;
    const address: ShippingAddress = {
      name: customerName,
      line1: shippingAddress.line1,
      line2: shippingAddress.line2,
      city: shippingAddress.city,
      state: shippingAddress.state ?? undefined,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
    };

    // If Stripe is configured, create a Stripe Checkout session
    if (stripeSecretKey) {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2026-04-22.dahlia",
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

      const isSafeImageUrl = (url?: string) => {
        if (!url) return false;
        try {
          const u = new URL(url);
          return (u.protocol === "http:" || u.protocol === "https:") && url.length <= 2048;
        } catch {
          return false;
        }
      };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: shippingAddress.email,
        line_items: cart.items.map((item) => ({
          price_data: {
            currency: "gbp",
            product_data: {
              name: item.name,
              description: item.variantName ?? undefined,
              images: isSafeImageUrl(item.image) ? [item.image!] : [],
            },
            unit_amount: item.price,
          },
          quantity: item.quantity,
        })),
        metadata: {
          orderId,
          customerEmail: shippingAddress.email,
        },
        shipping_address_collection: {
          allowed_countries: ["GB", "US", "CA", "AU", "DE", "FR", "ES", "IT", "NL"],
        },
        success_url: `${baseUrl}/checkout/success?orderId=${orderId}`,
        cancel_url: `${baseUrl}/checkout`,
      });

      // Pre-create the order as pending
      createOrder({
        id: orderId,
        customerEmail: shippingAddress.email,
        customerName,
        items: cart.items,
        total: cart.total,
        status: "pending",
        shippingAddress: address,
        stripeSessionId: session.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return Response.json({ url: session.url });
    }

    // Demo mode: create the order directly as paid
    createOrder({
      id: orderId,
      customerEmail: shippingAddress.email,
      customerName,
      items: cart.items,
      total: cart.total,
      status: "paid",
      shippingAddress: address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return Response.json({ orderId });
  } catch (err) {
    console.error("create-session error:", err);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
