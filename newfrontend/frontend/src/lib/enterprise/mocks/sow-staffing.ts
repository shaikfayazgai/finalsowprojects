/**
 * SOW staffing overlay — who is assigned to a SOW once it is approved.
 *
 * Responsibility split (locked product rule):
 *   - Mentor   → assigned by Glimmora (platform), at/after the platform gate.
 *   - Reviewer → assigned by Enterprise, before decomposition.
 *
 * Persisted in localStorage until the real API ships. Backend handoff:
 *   POST /api/admin/sow/:id/assign-mentor     { mentorId }   (Glimmora)
 *   POST /api/enterprise/sow/:id/assign-reviewer { reviewerId } (Enterprise)
 *   GET  /api/sow/:id/staffing → SowStaffing
 */

import { createOverlayStore } from "./overlay";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  assignedAt: string;
  email?: string;
}

export interface SowStaffing {
  sowId: string;
  mentor?: StaffMember;
  reviewer?: StaffMember;
}

export const sowStaffingOverlay = createOverlayStore<SowStaffing>(
  "glimmora.mock.sow-staffing.v1",
);

/** Glimmora mentor bench — Glimmora picks one to attach to an approved SOW. */
export const GLIMMORA_MENTOR_BENCH: Array<{ id: string; name: string; role: string }> = [
  { id: "mentor-priya", name: "Priya Iyer", role: "Lead Mentor · Design Systems" },
  { id: "mentor-karthik", name: "Karthik Iyer", role: "Staff Mentor · Data" },
  { id: "mentor-rajesh", name: "Rajesh Verma", role: "Senior Mentor · Backend" },
  { id: "mentor-amelia", name: "Amelia Stone", role: "Lead Mentor · Accessibility" },
  { id: "mentor-yusuf", name: "Yusuf Okonkwo", role: "Senior Mentor · Platform" },
];

export function getSowStaffing(sowId: string): SowStaffing {
  const row = sowStaffingOverlay.read()[sowId];
  if (!row || row.__deletedAt) return { sowId };
  return { sowId, mentor: row.mentor, reviewer: row.reviewer };
}

/** Glimmora assigns (or reassigns) the mentor for an approved SOW. */
export function assignSowMentor(
  sowId: string,
  mentor: { id: string; name: string; role: string },
): SowStaffing {
  const current = getSowStaffing(sowId);
  const next: SowStaffing = {
    ...current,
    sowId,
    mentor: { ...mentor, assignedAt: new Date().toISOString() },
  };
  sowStaffingOverlay.insert(sowId, next);
  return next;
}

/** Enterprise assigns (or reassigns) the reviewer for an approved SOW. */
export function assignSowReviewer(
  sowId: string,
  reviewer: { id: string; name: string; email?: string; role?: string },
): SowStaffing {
  const current = getSowStaffing(sowId);
  const next: SowStaffing = {
    ...current,
    sowId,
    reviewer: {
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      role: reviewer.role ?? "Enterprise reviewer",
      assignedAt: new Date().toISOString(),
    },
  };
  sowStaffingOverlay.insert(sowId, next);
  return next;
}
