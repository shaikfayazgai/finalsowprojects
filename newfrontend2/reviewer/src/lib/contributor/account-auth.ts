import type { ContribType } from "@/lib/contributor/track";

/** How this contributor signs in — drives Settings UI. */
export type ContributorAuthMode = "password" | "social_oauth" | "enterprise_sso";

export type ConnectedOAuthProvider = "google" | "microsoft";

export interface ContributorAccountAuth {
  authMode: ContributorAuthMode;
  hasPassword: boolean;
  provider: string | null;
  connectedProviders: ConnectedOAuthProvider[];
  organizationName: string | null;
}

const SOCIAL_PROVIDERS = new Set(["google", "microsoft-entra-id", "microsoft"]);

export function isEnterpriseSsoAccount(input: {
  hasPassword: boolean;
  provider: string | null;
  contribType: ContribType | string | null;
  tenantId: string | null;
}): boolean {
  if (input.hasPassword) return false;
  const isInternal =
    input.contribType === "internal" || !!input.tenantId;
  if (!isInternal) return false;
  const provider = input.provider ?? "";
  if (SOCIAL_PROVIDERS.has(provider)) return false;
  return provider === "sso" || provider === "" || !SOCIAL_PROVIDERS.has(provider);
}

export function resolveContributorAuthMode(input: {
  hasPassword: boolean;
  provider: string | null;
  contribType: ContribType | string | null;
  tenantId: string | null;
}): ContributorAuthMode {
  if (input.hasPassword) return "password";
  if (isEnterpriseSsoAccount(input)) return "enterprise_sso";
  return "social_oauth";
}

export function connectedProvidersFromProvider(
  provider: string | null,
): ConnectedOAuthProvider[] {
  if (!provider) return [];
  if (provider === "google") return ["google"];
  if (provider === "microsoft-entra-id" || provider === "microsoft") {
    return ["microsoft"];
  }
  return [];
}

export function providerLabel(provider: ConnectedOAuthProvider): string {
  return provider === "google" ? "Google" : "Microsoft";
}
