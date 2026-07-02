import "server-only";

import type { ReturnRequest } from "@/types";
import { getAdminEmail, sendEmail } from "@/lib/email/client";
import { AdminReturnNotificationEmail } from "@/lib/email/templates/AdminReturnNotificationEmail";

export function sendAdminReturnNotificationEmail(returnRequest: ReturnRequest) {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return Promise.resolve({ ok: false, error: "Admin email not configured" });

  return sendEmail({
    to: adminEmail,
    subject: `New return request: ${returnRequest.orderId}`,
    react: AdminReturnNotificationEmail({ returnRequest }),
  });
}
