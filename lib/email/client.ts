import "server-only";

import { Resend } from "resend";
import type { ReactNode } from "react";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export function getAdminEmail(): string | null {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured – skipping admin notification email");
    return null;
  }
  return adminEmail;
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactNode;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;

  if (!resend || !from) {
    console.warn("Resend not configured – skipping email send:", subject, "to", to);
    return { ok: false, error: "Email not configured" };
  }

  const { error } = await resend.emails.send({ from, to, subject, react });
  if (error) {
    console.error("Failed to send email:", subject, "to", to, error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
