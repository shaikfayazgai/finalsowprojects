/**
 * Returns the canonical base URL for the app.
 *
 * Priority:
 *  1. NEXT_PUBLIC_BASE_URL  — explicitly set (local dev or Vercel env var)
 *  2. VERCEL_URL            — automatically injected by Vercel on every deployment
 *  3. http://localhost:3000 — local dev fallback
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    // VERCEL_URL does not include the protocol
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
