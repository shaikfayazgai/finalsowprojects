/**
 * Razorpay webhook signature verification.
 *
 * Razorpay signs every webhook body with HMAC-SHA256 using the
 * webhook secret configured in their dashboard. The signature lives
 * in the `x-razorpay-signature` header. Verifying it is the only way
 * to know a request actually came from Razorpay (and wasn't replayed
 * by someone who scraped a previous body).
 *
 * Constant-time comparison via `crypto.timingSafeEqual` prevents
 * timing-attack signature leaks.
 *
 * https://razorpay.com/docs/webhooks/validate-test/
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export interface SignatureVerifyResult {
  valid: boolean;
  reason?: "missing-secret" | "missing-signature" | "length-mismatch" | "mismatch";
}

/**
 * Verify a Razorpay webhook signature against the raw request body.
 *
 * IMPORTANT: pass the raw body string. JSON.parse + JSON.stringify
 * produces a different byte sequence and the HMAC will fail.
 */
export function verifyRazorpaySignature(
  rawBody: string,
  receivedSignature: string | null | undefined,
  secret: string | undefined,
): SignatureVerifyResult {
  if (!secret) return { valid: false, reason: "missing-secret" };
  if (!receivedSignature) return { valid: false, reason: "missing-signature" };

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (expected.length !== receivedSignature.length) {
    return { valid: false, reason: "length-mismatch" };
  }

  const ok = timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(receivedSignature, "utf8"),
  );
  return ok ? { valid: true } : { valid: false, reason: "mismatch" };
}
