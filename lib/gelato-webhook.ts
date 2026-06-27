import { timingSafeEqual } from "crypto";

/**
 * Verifies a Gelato webhook using HTTP header auth (the "x-gelato-secret"
 * header contains a static key generated in Gelato Developer → Webhooks).
 * Verification is skipped when no secret is configured.
 */
export function verifyGelatoSignature(
  _body: string,
  headerValue: string | null,
  secret: string | undefined
): boolean {
  if (!secret) return true;
  if (!headerValue) return false;
  try {
    return timingSafeEqual(Buffer.from(headerValue), Buffer.from(secret));
  } catch {
    return false;
  }
}
