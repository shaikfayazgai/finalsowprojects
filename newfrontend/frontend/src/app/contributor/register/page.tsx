/**
 * Contributor sign-up — /contributor/register, the freelancer self-signup entry
 * that mirrors /contributor/login. Reuses the shared registration form (email +
 * password or Google/Microsoft SSO), which creates a `contributor` account and
 * routes into the profile-completion flow. Public (reachable signed-out) — see
 * proxy.ts PUBLIC_EXACT_PATHS.
 */
export { default } from "@/app/auth/register/page";
