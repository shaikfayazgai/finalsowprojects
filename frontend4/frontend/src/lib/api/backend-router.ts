/**
 * Per-role backend router (NO shared gateway).
 *
 * Each end user has its OWN backend on its own port (all on the shared DB). This
 * maps a request PATH to the correct role backend, so the frontend talks to each
 * backend directly instead of routing everything through one gateway.
 *
 * Configure the bases via env (falls back to the local standalone ports):
 *   MENTOR_API_URL       :8101
 *   SUPERADMIN_API_URL   :8102
 *   ENTERPRISE_API_URL   :8103
 *   FREELANCER_API_URL   :8104
 *   REVIEWER_API_URL     :8105
 *
 * If GLIMMORA_GATEWAY_URL is set (e.g. the deployed single-process gateway), it
 * is used as the fallback for every path — so production (one Render service)
 * keeps working unchanged while local dev fans out to the per-role backends.
 */

const GATEWAY =
  process.env.GLIMMORA_GATEWAY_URL ||
  process.env.GLIMMORA_API_URL ||
  process.env.NEXT_PUBLIC_GLIMMORA_API_URL ||
  "http://127.0.0.1:9000";

const MENTOR = process.env.MENTOR_API_URL || GATEWAY;
const SUPERADMIN = process.env.SUPERADMIN_API_URL || GATEWAY;
const ENTERPRISE = process.env.ENTERPRISE_API_URL || GATEWAY;
const FREELANCER = process.env.FREELANCER_API_URL || GATEWAY;
const REVIEWER = process.env.REVIEWER_API_URL || GATEWAY;

/** Longest-prefix-first: most specific path wins. */
const ROUTES: readonly (readonly [string, string])[] = ([
  ["/api/v1/reviewer", REVIEWER],
  ["/api/superadmin", SUPERADMIN],
  ["/api/mentor", MENTOR],
  ["/api/contributor", FREELANCER],
  ["/api/public", FREELANCER],
  ["/api/v1/sows", ENTERPRISE],
  ["/api/v1/enterprise", ENTERPRISE],
  ["/api/v1/decomposition", ENTERPRISE],
  ["/api/v1/billing", ENTERPRISE],
  ["/api/v1/users", SUPERADMIN],
  // auth/login + oauth: served by every backend; default to super-admin's.
  ["/api/v1/auth/oauth", FREELANCER],
  ["/api/v1/auth/contributor", FREELANCER],
  ["/api/v1/auth", SUPERADMIN],
] as Array<[string, string]>).sort((a, b) => b[0].length - a[0].length);

/** Resolve the backend base URL for a given API path. */
export function backendBaseForPath(path: string): string {
  for (const [prefix, base] of ROUTES) {
    if (path === prefix || path.startsWith(prefix + "/") || path.startsWith(prefix)) {
      return base;
    }
  }
  return GATEWAY;
}

/** Build a full upstream URL for a path against its role backend. */
export function backendUrl(path: string): string {
  return `${backendBaseForPath(path)}${path}`;
}
