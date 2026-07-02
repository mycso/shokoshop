import "server-only";

import { sendEmail } from "@/lib/email/client";
import { PasswordResetEmail } from "@/lib/email/templates/PasswordResetEmail";

export function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Reset your ShokoShop password",
    react: PasswordResetEmail({ resetUrl }),
  });
}
