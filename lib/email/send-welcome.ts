import "server-only";

import { sendEmail } from "@/lib/email/client";
import { WelcomeEmail } from "@/lib/email/templates/WelcomeEmail";

export function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Welcome to ShokoShop",
    react: WelcomeEmail({ name }),
  });
}
