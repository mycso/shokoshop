import "server-only";

import type { Order } from "@/types";
import { getAdminEmail, sendEmail } from "@/lib/email/client";
import { AdminOrderNotificationEmail } from "@/lib/email/templates/AdminOrderNotificationEmail";

export function sendAdminOrderNotificationEmail(order: Order) {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return Promise.resolve({ ok: false, error: "Admin email not configured" });

  return sendEmail({
    to: adminEmail,
    subject: `New order: ${order.id}`,
    react: AdminOrderNotificationEmail({ order }),
  });
}
