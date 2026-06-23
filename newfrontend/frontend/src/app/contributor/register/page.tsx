/**
 * Contributor sign-up — /contributor/register (mirrors /contributor/login).
 * OTP-based: email → 6-digit code → create password. No activation links.
 * Public (reachable signed-out) — see proxy.ts PUBLIC_EXACT_PATHS + the
 * contributor layout's standalone-route list.
 */
import { ContributorRegisterScreen } from "./_components/contributor-register-screen";

export default function ContributorRegisterPage() {
  return <ContributorRegisterScreen />;
}
