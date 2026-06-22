/**
 * Admin governance case mock service — localStorage overlay.
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import {
  MOCK_GOV_CASES,
  type GovCaseStatus,
  type MockGovCase,
} from "@/mocks/admin/governance";

const govOverlay = createOverlayStore<MockGovCase>("glimmora.mock.adminGovernance.v1");

export const adminGovernanceOverlay = govOverlay;

const LOCKED_STATUSES: GovCaseStatus[] = ["escalated", "pending_legal", "resolved_action", "resolved_no_action"];

export function isGovCaseLocked(c: MockGovCase): boolean {
  return LOCKED_STATUSES.includes(c.status);
}

function listMerged(): MockGovCase[] {
  return applyOverlay(MOCK_GOV_CASES, govOverlay.read()).map((c) => ({
    ...c,
    actionsTaken: c.actionsTaken ?? [],
  }));
}

export function listAdminGovCases(): MockGovCase[] {
  return listMerged();
}

export function getAdminGovCase(id: string): MockGovCase | undefined {
  return listMerged().find((c) => c.id === id);
}

export function takeGovCase(id: string, operatorName: string): MockGovCase | undefined {
  const c = getAdminGovCase(id);
  if (!c || isGovCaseLocked(c)) return undefined;
  govOverlay.patch(id, {
    assignedTo: operatorName,
    status: c.status === "open" ? "in_review" : c.status,
  });
  return getAdminGovCase(id);
}

export function reassignGovCase(id: string, assignee: string): MockGovCase | undefined {
  const c = getAdminGovCase(id);
  if (!c || isGovCaseLocked(c)) return undefined;
  govOverlay.patch(id, { assignedTo: assignee });
  return getAdminGovCase(id);
}

export function addGovCaseNote(id: string, text: string, by: string): MockGovCase | undefined {
  const c = getAdminGovCase(id);
  if (!c || isGovCaseLocked(c)) return undefined;
  const note = { at: new Date().toISOString(), by, text: text.trim() };
  govOverlay.patch(id, { internalNotes: [...c.internalNotes, note] });
  return getAdminGovCase(id);
}

export function applyGovCaseAction(id: string, action: string, by: string): MockGovCase | undefined {
  const c = getAdminGovCase(id);
  if (!c || isGovCaseLocked(c)) return undefined;
  const actionsTaken = [...(c.actionsTaken ?? []), `${action} · ${by} · ${new Date().toLocaleString()}`];
  const patch: Partial<MockGovCase> = { actionsTaken };
  if (action === "Forward to legal") {
    patch.status = "pending_legal";
  }
  if (action === "Suspend mentor") {
    patch.status = "in_review";
  }
  govOverlay.patch(id, patch);
  return getAdminGovCase(id);
}

export type CloseGovDecision = "resolved_no_action" | "resolved_action" | "escalated";

export function closeGovCase(
  id: string,
  decision: CloseGovDecision,
  summary: string,
  by: string,
): MockGovCase | undefined {
  const c = getAdminGovCase(id);
  if (!c || isGovCaseLocked(c)) return undefined;

  const status: GovCaseStatus =
    decision === "escalated" ? "escalated" :
    decision === "resolved_action" ? "resolved_action" : "resolved_no_action";

  govOverlay.patch(id, {
    status,
    resolution: {
      decision,
      summary: summary.trim(),
      actions: c.actionsTaken ?? [],
      at: new Date().toISOString(),
      by,
    },
  });
  return getAdminGovCase(id);
}

const THIRTY_DAYS_MS = 30 * 86_400_000;

export function computeGovSummary(cases: MockGovCase[], operator: string) {
  const openStatuses: GovCaseStatus[] = ["open", "in_review", "pending_legal"];
  const closedStatuses: GovCaseStatus[] = ["resolved_action", "resolved_no_action", "escalated"];
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  return {
    openAssignedToMe: cases.filter(
      (c) => c.assignedTo === operator && openStatuses.includes(c.status),
    ).length,
    unassigned: cases.filter((c) => !c.assignedTo && openStatuses.includes(c.status)).length,
    allOpen: cases.filter((c) => openStatuses.includes(c.status)).length,
    closedLast30d: cases.filter((c) => {
      if (!closedStatuses.includes(c.status)) return false;
      const closedAt = c.resolution?.at ?? c.openedAt;
      return new Date(closedAt).getTime() >= cutoff;
    }).length,
    highSeverityOpen: cases.filter(
      (c) => c.severity === "high" && openStatuses.includes(c.status),
    ).length,
  };
}

/** T&S operators eligible for case assignment. */
export const GOV_ASSIGNEES = ["Aishwarya Rao", "Sneha Pillai"] as const;
