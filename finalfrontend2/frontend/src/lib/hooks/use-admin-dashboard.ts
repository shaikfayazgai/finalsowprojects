"use client";

/**
 * Real-data hook for the admin dashboard.
 *
 * Fetches from /api/superadmin/dashboard (proxy → backend) and
 * /api/superadmin/kyc?status=pending, /api/superadmin/sows, and
 * /api/superadmin/mentors, then maps the combined responses into the
 * MockAdminDashboard shape so the existing dashboard-data.ts helpers
 * (pulseBandForRole, filterAttentionForRole, etc.) continue to work
 * without modification.
 */

import * as React from "react";
import type { MockAdminDashboard, MockAdminAttentionItem } from "@/mocks/admin/dashboard";

// ── Backend response shapes ───────────────────────────────────────────────

interface BackendDashboardStats {
  total_accounts: number;
  by_role: Record<string, number>;
  pending_applications: number;
  contributors: number;
  enterprises: number;
  mentors: number;
}

interface BackendRecentItem {
  id?: string;
  action?: string;
  actor?: string;
  service?: string;
  timestamp?: string;
}

interface BackendDashboardResponse {
  stats: BackendDashboardStats;
  recent_activity: BackendRecentItem[];
}

// ── Mapper ────────────────────────────────────────────────────────────────

/**
 * Map a backend audit action string to the closest MockAdminDashboard
 * recent-activity `kind`.
 */
function actionToKind(action: string): MockAdminDashboard["recent"][number]["kind"] {
  const a = action.toLowerCase();
  if (a.includes("tenant") || a.includes("enterprise")) return "tenant";
  if (a.includes("mentor")) return "mentor";
  if (a.includes("sow") || a.includes("commercial")) return "sow";
  if (a.includes("kyc") || a.includes("verify")) return "kyc";
  if (a.includes("rubric")) return "rubric";
  if (a.includes("skill")) return "skill";
  if (a.includes("rail") || a.includes("payout") || a.includes("payment")) return "rail";
  if (a.includes("ai") || a.includes("agent") || a.includes("prompt")) return "ai";
  return "audit";
}

function mapToMockDashboard(
  dash: BackendDashboardResponse,
  kycPending: number,
  activeSows: number,
): MockAdminDashboard {
  const stats = dash.stats ?? ({} as BackendDashboardStats);

  // Build attention items from real counts — same kinds the queue renders.
  const attention: MockAdminAttentionItem[] = [];
  if (activeSows > 0) {
    attention.push({
      id: "att-sow-live",
      kind: "sow",
      title: `${activeSows} SOW${activeSows === 1 ? "" : "s"} awaiting commercial review`,
      entity: "Commercial gate",
      href: "/admin/sow",
      slaHours: 8,
    });
  }
  if (kycPending > 0) {
    attention.push({
      id: "att-kyc-live",
      kind: "kyc",
      title: `${kycPending} KYC review${kycPending === 1 ? "" : "s"} pending`,
      entity: "Trust & Safety",
      href: "/admin/kyc",
      slaHours: 8,
    });
  }

  // Map recent audit events to the mock shape.
  const recent: MockAdminDashboard["recent"] = (dash.recent_activity ?? [])
    .slice(0, 8)
    .map((r) => ({
      at: r.timestamp ?? new Date().toISOString(),
      text: r.action
        ? `${r.actor && r.actor !== "system" ? r.actor + " · " : ""}${r.action}${r.service ? " (" + r.service + ")" : ""}`
        : "Platform event",
      kind: actionToKind(r.action ?? ""),
    }));

  return {
    env: "PROD",
    greetingFor: "",
    kpis: {
      servicesUp: 0,
      servicesTotal: 0,
      tenants: stats.enterprises ?? 0,
      mentors: stats.mentors ?? 0,
      activeSows,
    },
    pipeline: {
      tenantsActive: stats.enterprises ?? 0,
      commercialGate: activeSows,
      governanceOpen: 0,
      kycPending,
      mentorsActive: stats.mentors ?? 0,
    },
    actionBreakdown: {
      resolved30d: 0,
      escalated: 0,
      onHold: 0,
    },
    attention,
    recent,
    // AI signals are not available from the real backend yet — left empty so
    // the phase-gate filter returns nothing rather than mock data.
    aiSignals: [],
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────

export type DashboardFetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: MockAdminDashboard };

export function useAdminDashboard(): DashboardFetchState {
  const [state, setState] = React.useState<DashboardFetchState>({ status: "loading" });

  React.useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function load() {
      setState({ status: "loading" });
      try {
        // Fire all three requests in parallel.
        const [dashRes, kycRes, sowsRes] = await Promise.all([
          fetch("/api/superadmin/dashboard", { signal, credentials: "include", cache: "no-store" }),
          fetch("/api/superadmin/kyc?status=pending", { signal, credentials: "include", cache: "no-store" }),
          fetch("/api/superadmin/sows", { signal, credentials: "include", cache: "no-store" }),
        ]);

        if (signal.aborted) return;

        // Parse responses — treat non-200 as empty rather than crashing.
        const dashData: BackendDashboardResponse = dashRes.ok
          ? await dashRes.json().catch(() => ({ stats: {}, recent_activity: [] }))
          : { stats: {} as BackendDashboardStats, recent_activity: [] };

        const kycData = kycRes.ok
          ? await kycRes.json().catch(() => ({ counts: {} }))
          : { counts: {} };

        const sowsData = sowsRes.ok
          ? await sowsRes.json().catch(() => ({ items: [] }))
          : { items: [] };

        if (signal.aborted) return;

        const kycPending: number =
          typeof kycData?.counts?.pending === "number"
            ? kycData.counts.pending
            : Array.isArray(kycData?.items)
              ? (kycData.items as unknown[]).length
              : 0;

        // Count SOWs that need commercial review (pending or awaiting_review).
        const sowItems: Array<{ status?: string; currentStage?: string }> =
          Array.isArray(sowsData?.items) ? sowsData.items : [];
        const activeSows = sowItems.filter(
          (s) =>
            s.status === "pending" ||
            s.status === "awaiting_review" ||
            s.currentStage === "commercial",
        ).length;

        setState({
          status: "ok",
          data: mapToMockDashboard(dashData, kycPending, activeSows),
        });
      } catch (err) {
        if (signal.aborted) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load dashboard",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  return state;
}
