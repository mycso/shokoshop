import "server-only";

import type { ReturnRequest } from "@/types";
import { sendEmail } from "@/lib/email/client";
import { ReturnRequestReceivedEmail } from "@/lib/email/templates/ReturnRequestReceivedEmail";

export function sendReturnRequestReceivedEmail(returnRequest: ReturnRequest) {
  return sendEmail({
    to: returnRequest.customerEmail,
    subject: `We received your return request (${returnRequest.orderId})`,
    react: ReturnRequestReceivedEmail({ returnRequest }),
  });
}
