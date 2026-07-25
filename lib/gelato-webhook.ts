import { timingSafeEqual } from "crypto";

/**
 * Verifies a Gelato webhook using HTTP header auth (the "x-gelato-secret"
 * header contains a static key generated in Gelato Developer → Webhooks).
 * Verification is skipped when no secret is configured, but only outside
 * production — in production a missing secret fails closed so the webhook
 * can't be used to forge order status/tracking updates.
 */
export function verifyGelatoSignature(
  _body: string,
  headerValue: string | null,
  secret: string | undefined
): boolean {
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!headerValue) return false;
  try {
    return timingSafeEqual(Buffer.from(headerValue), Buffer.from(secret));
  } catch {
    return false;
  }
}
