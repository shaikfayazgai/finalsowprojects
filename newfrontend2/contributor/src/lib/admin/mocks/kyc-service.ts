/**
 * Admin KYC review mock service — localStorage overlay.
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import { activateUniversityStudentByEmail, activateWWContributorByEmail } from "@/lib/admin/mocks/partnerships-service";
import {
  MOCK_KYC_CASES,
  type KycStatus,
  type MockKycCase,
} from "@/mocks/admin/kyc";

const kycOverlay = createOverlayStore<MockKycCase>("glimmora.mock.adminKyc.v1");
const revealOverlay = createOverlayStore<{ revealedAt: string; by: string }>(
  "glimmora.mock.adminKycReveal.v1",
);

export const adminKycOverlays = { cases: kycOverlay, reveals: revealOverlay };

function listMerged(): MockKycCase[] {
  return applyOverlay(MOCK_KYC_CASES, kycOverlay.read());
}

export function listAdminKycCases(): MockKycCase[] {
  return listMerged();
}

export function getAdminKycCase(id: string): MockKycCase | undefined {
  return listMerged().find((c) => c.id === id);
}

export function computeKycSummary(cases: MockKycCase[] = listMerged()) {
  const cutoff = Date.now() - 30 * 86_400_000;
  return {
    pending: cases.filter((c) => c.status === "pending").length,
    approved30d: cases.filter(
      (c) => c.status === "approved" && new Date(c.submittedAt).getTime() >= cutoff,
    ).length,
    rejected30d: cases.filter(
      (c) => c.status === "rejected" && new Date(c.submittedAt).getTime() >= cutoff,
    ).length,
    reuploaded: cases.filter((c) => c.status === "reuploaded").length,
    awaitingInfo: cases.filter((c) => c.status === "awaiting_info").length,
  };
}

export type KycDecisionOutcome = "approved" | "rejected" | "more_info";

export function submitKycDecision(
  id: string,
  outcome: KycDecisionOutcome,
  note: string,
  by: string,
): MockKycCase | undefined {
  const c = getAdminKycCase(id);
  if (!c || !["pending", "reuploaded", "awaiting_info"].includes(c.status)) return undefined;

  const status: KycStatus =
    outcome === "approved" ? "approved" :
    outcome === "rejected" ? "rejected" : "awaiting_info";

  kycOverlay.patch(id, {
    status,
    decision: {
      outcome,
      reason: outcome !== "approved" ? note.trim() : undefined,
      note: note.trim() || undefined,
      at: new Date().toISOString(),
      by,
    },
  });

  const updated = getAdminKycCase(id);
  if (updated && outcome === "approved") {
    if (updated.track === "Student") {
      activateUniversityStudentByEmail(updated.contributorEmail);
    }
    if (updated.track === "Women WF") {
      activateWWContributorByEmail(updated.contributorEmail);
    }
  }
  return updated;
}

export function getKycPhotoReveal(id: string): { revealedAt: string; by: string } | undefined {
  return revealOverlay.read()[id] as { revealedAt: string; by: string } | undefined;
}

export function revealKycPhoto(id: string, by: string): void {
  if (!getAdminKycCase(id)) return;
  revealOverlay.patch(id, { revealedAt: new Date().toISOString(), by });
}

/** Register a contributor's onboarding KYC case in the admin mock queue. */
export function registerAdminKycCaseFromOnboarding(caseData: MockKycCase): void {
  kycOverlay.patch(caseData.id, caseData);
}

/** Full ID for demo reveal (spec shows last 4 only until reveal). */
export function fullKycIdNumber(c: MockKycCase): string {
  return `XXXX-XXXX-${c.idNumberLast4}`;
}
