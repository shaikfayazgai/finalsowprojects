import type { ReviewPath, TenantWorkforcePolicy, WorkforceSourcing } from "./types";

export function deriveReviewPath(contribType: string): ReviewPath {
  if (contribType === "internal") return "internal";
  return "mentor";
}

export function deriveWorkforceSourcing(contribType: string): WorkforceSourcing {
  if (contribType === "internal") return "internal_only";
  return "open";
}

export function defaultTabForSourcing(
  sourcing: WorkforceSourcing | null | undefined,
): "organization" | "network" {
  if (sourcing === "internal_only" || sourcing === "internal_first") {
    return "organization";
  }
  return "network";
}

export function poolForTab(tab: "organization" | "network"): "organization" | "network" {
  return tab;
}

export function parseTenantWorkforcePolicy(raw: unknown): TenantWorkforcePolicy {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    defaultSourcing:
      typeof o.defaultSourcing === "string"
        ? (o.defaultSourcing as TenantWorkforcePolicy["defaultSourcing"])
        : undefined,
    allowOpenMarket:
      typeof o.allowOpenMarket === "boolean" ? o.allowOpenMarket : undefined,
    requireMentorForInternal:
      typeof o.requireMentorForInternal === "boolean"
        ? o.requireMentorForInternal
        : undefined,
  };
}

export function isInternalReviewPath(reviewPath: string | null | undefined): boolean {
  return reviewPath === "internal" || reviewPath === "auto_accept";
}

export function contributorMatchesPool(args: {
  pool: "organization" | "network";
  taskTenantId: string;
  userTenantId: string | null;
  contribType: string | null;
}): boolean {
  const isOrgInternal =
    args.userTenantId === args.taskTenantId && args.contribType === "internal";
  const isNetwork =
    args.contribType !== "internal" || args.userTenantId !== args.taskTenantId;

  if (args.pool === "organization") return isOrgInternal;
  if (args.pool === "network") return isNetwork;
  return true;
}
