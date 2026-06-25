import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies a Gelato webhook's HMAC-SHA256 signature. Verification is
 * skipped (returns true) when no secret is configured, matching Gelato's
 * own webhook setup flow where a secret is optional per webhook.
 */
export function verifyGelatoSignature(
  body: string,
  signatureHeader: string | null,
  secret: string | undefined
): boolean {
  if (!secret) return true;

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signatureHeader ?? ""), Buffer.from(expected));
  } catch {
    return false;
  }
}
