/** Role → dashboard path mapping. Single source of truth used by login, register, and root page. */
export const roleDashboard: Record<string, string> = {
  enterprise: "/enterprise/dashboard",
  contributor: "/contributor/dashboard",
  mentor: "/mentor/dashboard",
  analytics: "/analytics/overview",
};
