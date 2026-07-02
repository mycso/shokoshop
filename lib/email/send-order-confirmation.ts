import "server-only";

import type { Order } from "@/types";
import { sendEmail } from "@/lib/email/client";
import { OrderConfirmationEmail } from "@/lib/email/templates/OrderConfirmationEmail";

export function sendOrderConfirmationEmail(order: Order) {
  return sendEmail({
    to: order.customerEmail,
    subject: `Your ShokoShop order is confirmed (${order.id})`,
    react: OrderConfirmationEmail({ order }),
  });
}
