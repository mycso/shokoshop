import Stripe from "stripe";
import { Cart, CartItem, ShippingAddress } from "@/types";
import { createOrder, generateOrderId } from "@/lib/orders";
import { shippingCostPence, shippingLabel } from "@/lib/shipping";
import { SHIPPING_COUNTRIES } from "@/lib/countries";
import { getGelatoProducts } from "@/lib/gelato-data";
import { getGelatoShippingQuote } from "@/lib/gelato-shipping";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import { sendAdminOrderNotificationEmail } from "@/lib/email/send-admin-order-notification";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const SUPPORTED_CURRENCIES = new Set(["GBP", "USD", "EUR", "CAD", "AUD", "AED"]);
const MAX_QUANTITY_PER_ITEM = 50;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Looks up the live GBP-per-unit rate rather than trusting a client-supplied
// value — otherwise a manipulated `rate` would under-charge in that currency
// even after prices are re-verified in GBP.
async function getFxRate(currency: string): Promise<number> {
  if (currency === "GBP") return 1;
  try {
    const data = await fetch("https://api.exchangerate-api.com/v4/latest/GBP", {
      next: { revalidate: 3600 },
    }).then((r) => r.json());
    const rate = data?.rates?.[currency];
    return typeof rate === "number" && rate > 0 ? rate : 1;
  } catch {
    return 1;
  }
}

export async function POST(request: Request) {
  try {
    const {
      cart,
      shippingAddress,
      currency: requestedCurrency = "GBP",
    }: {
      cart: Cart;
      currency?: string;
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
    if (
      !shippingAddress?.email ||
      !EMAIL_RE.test(shippingAddress.email) ||
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.line1 ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return Response.json({ error: "Missing or invalid shipping address" }, { status: 400 });
    }

    const currency = SUPPORTED_CURRENCIES.has((requestedCurrency ?? "").toUpperCase())
      ? (requestedCurrency.toUpperCase() as string)
      : "GBP";
    const rate = await getFxRate(currency);

    // Re-price every line item from the canonical Gelato catalog. The client
    // only ever sends product/variant identifiers from here on — never trust
    // a client-supplied price, or checkout can be completed for £0.01.
    const catalog = await getGelatoProducts();
    const verifiedItems: (CartItem & { price: number })[] = [];
    for (const item of cart.items) {
      const quantity = Math.max(1, Math.min(MAX_QUANTITY_PER_ITEM, Math.floor(item.quantity) || 1));
      const product = catalog.find((p) => p.gelatoProductId === item.productId);
      const price = (item.gelatoProductId && product?.variantPrices[item.gelatoProductId]) || product?.price;
      if (!product || typeof price !== "number" || price <= 0) {
        return Response.json({ error: "One or more items could not be verified" }, { status: 400 });
      }
      verifiedItems.push({ ...item, quantity, price });
    }
    const total = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Re-quote shipping server-side too, for the same reason — never trust a
    // client-echoed price, even one that originally came from our own quote
    // endpoint.
    const shippingQuote = await getGelatoShippingQuote(
      verifiedItems.map((i) => ({ productId: i.productId, variantName: i.variantName, quantity: i.quantity })),
      {
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
        state: shippingAddress.state,
        city: shippingAddress.city,
      }
    );
    const shippingPence = shippingQuote?.pricePence ?? shippingCostPence(shippingAddress.country);
    const shippingDisplayName =
      shippingQuote?.name && shippingQuote.minDeliveryDays && shippingQuote.maxDeliveryDays
        ? `${shippingQuote.name} (${shippingQuote.minDeliveryDays}–${shippingQuote.maxDeliveryDays} business days)`
        : shippingQuote?.name ?? shippingLabel(shippingAddress.country);
    const shipmentMethodUid = shippingQuote?.shipmentMethodUid ?? "standard";

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
        apiVersion: "2026-05-27.dahlia",
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
        line_items: verifiedItems.map((item) => ({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: item.name,
              description: item.variantName ?? undefined,
              images: isSafeImageUrl(item.image) ? [item.image!] : [],
            },
            unit_amount: Math.round(item.price * rate),
          },
          quantity: item.quantity,
        })),
        metadata: {
          orderId,
          customerEmail: shippingAddress.email,
        },
        shipping_options: [{
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(shippingPence * rate),
              currency: currency.toLowerCase(),
            },
            display_name: shippingDisplayName,
          },
        }],
        shipping_address_collection: {
          allowed_countries: [...SHIPPING_COUNTRIES],
        },
        success_url: `${baseUrl}/checkout/success?orderId=${orderId}`,
        cancel_url: `${baseUrl}/checkout`,
      });

      // Pre-create the order as pending
      await createOrder({
        id: orderId,
        customerEmail: shippingAddress.email,
        customerName,
        items: verifiedItems,
        total,
        status: "pending",
        shippingAddress: address,
        shipmentMethodUid,
        stripeSessionId: session.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return Response.json({ url: session.url });
    }

    // Demo mode: create the order directly as paid
    const order = await createOrder({
      id: orderId,
      customerEmail: shippingAddress.email,
      customerName,
      items: verifiedItems,
      total,
      status: "paid",
      shippingAddress: address,
      shipmentMethodUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await sendOrderConfirmationEmail(order).catch((err) =>
      console.error(`Order confirmation email failed for order ${orderId}:`, err)
    );
    await sendAdminOrderNotificationEmail(order).catch((err) =>
      console.error(`Admin order notification email failed for order ${orderId}:`, err)
    );

    return Response.json({ orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("create-session error:", err);
    return Response.json(
      { error: "Failed to create checkout session", detail: message },
      { status: 500 }
    );
  }
}
