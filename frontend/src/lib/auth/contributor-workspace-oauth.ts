/**
 * Browser sessionStorage context for Glimmora contributor-workspace OAuth
 * (/api/v1/auth/contributor/oauth/...). Survives the IdP redirect when URL
 * state is opaque or owned by the API.
 */
export const CONTRIBUTOR_WORKSPACE_OAUTH_STORAGE_KEY = "gt_contributor_workspace_oauth";

export type ContributorWorkspaceOAuthIntent = "register" | "login";

export type ContributorWorkspaceOAuthContext = {
  redirectAfter: string;
  role: "contributor";
  intent: ContributorWorkspaceOAuthIntent;
};

export function writeContributorWorkspaceOAuthContext(ctx: ContributorWorkspaceOAuthContext): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CONTRIBUTOR_WORKSPACE_OAUTH_STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* noop */
  }
}

export function readContributorWorkspaceOAuthContext(): ContributorWorkspaceOAuthContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CONTRIBUTOR_WORKSPACE_OAUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ContributorWorkspaceOAuthContext>;
    if (parsed.role !== "contributor") return null;
    if (parsed.intent !== "register" && parsed.intent !== "login") return null;
    if (typeof parsed.redirectAfter !== "string" || !parsed.redirectAfter.startsWith("/")) return null;
    return {
      redirectAfter: parsed.redirectAfter,
      role: "contributor",
      intent: parsed.intent,
    };
  } catch {
    return null;
  }
}

export function clearContributorWorkspaceOAuthContext(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CONTRIBUTOR_WORKSPACE_OAUTH_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
