/**
 * Admin partnerships mock service — localStorage overlay.
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import { mintStudentInviteToken } from "@/lib/admin/university-student-invite";
import { mintWWInviteToken } from "@/lib/admin/ww-contributor-invite";
import {
  MOCK_UNIVERSITIES,
  MOCK_WW_PARTNERS,
  type MockUniversity,
  type MockUniversityStudent,
  type MockWWContributor,
  type MockWWPartner,
  type UniversityStudentStatus,
  type WWContributorStatus,
} from "@/mocks/admin/partnerships";

const uniOverlay = createOverlayStore<MockUniversity>("glimmora.mock.adminUniversities.v1");
const wwOverlay = createOverlayStore<MockWWPartner>("glimmora.mock.adminWWPartners.v1");

export const adminPartnershipOverlays = { universities: uniOverlay, wwPartners: wwOverlay };

const IN_FLIGHT_STATUSES: UniversityStudentStatus[] = ["registered", "onboarding", "active"];

function listUniversitiesMerged(): MockUniversity[] {
  return applyOverlay(MOCK_UNIVERSITIES, uniOverlay.read());
}

function listWWMerged(): MockWWPartner[] {
  return applyOverlay(MOCK_WW_PARTNERS, wwOverlay.read());
}

function countInFlight(cohort: MockUniversityStudent[]): number {
  return cohort.filter((s) => IN_FLIGHT_STATUSES.includes(s.status)).length;
}

/** Persist missing invite tokens so personal links stay stable across refreshes. */
function persistCohortIfNeeded(uniId: string, u: MockUniversity): MockUniversityStudent[] {
  const raw = u.cohort ?? [];
  if (raw.length === 0) return [];

  let changed = false;
  const cohort = raw.map((s) => {
    if (s.inviteToken) return s;
    changed = true;
    return { ...s, inviteToken: mintStudentInviteToken() };
  });

  if (changed) {
    uniOverlay.patch(uniId, { cohort, studentsInFlight: countInFlight(cohort) });
  }
  return cohort;
}

function cohortOf(u: MockUniversity): MockUniversityStudent[] {
  return u.cohort ?? [];
}

function withSyncedCounts(u: MockUniversity): MockUniversity {
  const cohort = cohortOf(u);
  if (cohort.length === 0) return u;
  return { ...u, studentsInFlight: countInFlight(cohort), cohort };
}

function patchCohort(uniId: string, cohort: MockUniversityStudent[]): MockUniversity | undefined {
  uniOverlay.patch(uniId, { cohort, studentsInFlight: countInFlight(cohort) });
  return getAdminUniversity(uniId);
}

function studentId(): string {
  return `stu-${Date.now().toString(36)}`;
}

export function listAdminUniversities(): MockUniversity[] {
  return listUniversitiesMerged().map((u) => {
    persistCohortIfNeeded(u.id, u);
    return withSyncedCounts(getRawUniversity(u.id) ?? u);
  });
}

function getRawUniversity(id: string): MockUniversity | undefined {
  return listUniversitiesMerged().find((uni) => uni.id === id);
}

export function getAdminUniversity(id: string): MockUniversity | undefined {
  const u = getRawUniversity(id);
  if (!u) return undefined;
  persistCohortIfNeeded(id, u);
  const merged = getRawUniversity(id);
  return merged ? withSyncedCounts(merged) : undefined;
}

/** Cohort pipeline count for list views (falls back to legacy seed when no roster). */
export function universityPipelineCount(u: MockUniversity): number {
  const cohort = u.cohort ?? [];
  if (cohort.length === 0) return u.studentsInFlight;
  return cohort.length;
}

export interface ResolvedStudentInvite {
  university: MockUniversity;
  student: MockUniversityStudent;
}

export function resolveStudentInvite(inviteToken: string): ResolvedStudentInvite | null {
  if (!inviteToken.trim()) return null;
  for (const raw of listUniversitiesMerged()) {
    persistCohortIfNeeded(raw.id, raw);
    const u = getAdminUniversity(raw.id);
    if (!u) continue;
    const student = cohortOf(u).find((s) => s.inviteToken === inviteToken);
    if (student) return { university: u, student };
  }
  return null;
}

export interface AddUniversityStudentInput {
  name: string;
  email: string;
  rollNumber?: string;
  programme?: string;
  status?: UniversityStudentStatus;
}

export type AddUniversityStudentResult =
  | { ok: true; student: MockUniversityStudent }
  | { ok: false; error: string };

export function addUniversityStudent(
  uniId: string,
  input: AddUniversityStudentInput,
): AddUniversityStudentResult {
  const u = getRawUniversity(uniId);
  if (!u) return { ok: false, error: "University not found." };

  const email = input.email.trim().toLowerCase();
  const cohort = [...cohortOf(getAdminUniversity(uniId) ?? u)];
  const existing = cohort.find((s) => s.email === email);
  if (existing) {
    return { ok: false, error: `${email} is already in this university's cohort.` };
  }

  const entry: MockUniversityStudent = {
    id: studentId(),
    name: input.name.trim(),
    email,
    rollNumber: input.rollNumber?.trim() || undefined,
    programme: input.programme?.trim() || undefined,
    status: input.status ?? "invited",
    enrolledAt: new Date().toISOString(),
    inviteToken: mintStudentInviteToken(),
  };
  patchCohort(uniId, [...cohort, entry]);
  return { ok: true, student: entry };
}

export type ValidateUniversityInviteResult =
  | { ok: true; student: MockUniversityStudent }
  | { ok: false; error: string };

/** Non-mutating validation before account creation. */
export function validateUniversityStudentInvite(
  uniId: string,
  input: { email: string; inviteToken: string },
): ValidateUniversityInviteResult {
  const resolved = resolveStudentInvite(input.inviteToken);
  if (!resolved) return { ok: false, error: "Invalid or expired invite link." };
  if (resolved.university.id !== uniId) {
    return { ok: false, error: "This invite does not match the university in the link." };
  }

  const email = input.email.trim().toLowerCase();
  const { student } = resolved;

  if (student.status === "registered" || student.status === "onboarding" || student.status === "active") {
    return { ok: false, error: "This invite has already been used. Sign in instead." };
  }
  if (student.status !== "invited") {
    return { ok: false, error: "Invalid invite status." };
  }
  if (student.email !== email) {
    return { ok: false, error: `Register with ${student.email} — this invite is tied to that address.` };
  }
  return { ok: true, student };
}

export type RegisterUniversityStudentResult =
  | { ok: true; student: MockUniversityStudent }
  | { ok: false; error: string };

export function registerUniversityStudent(
  uniId: string,
  input: { name: string; email: string; inviteToken: string },
): RegisterUniversityStudentResult {
  const check = validateUniversityStudentInvite(uniId, {
    email: input.email,
    inviteToken: input.inviteToken,
  });
  if (!check.ok) return check;

  const u = getRawUniversity(uniId);
  if (!u) return { ok: false, error: "University not found." };

  const cohort = [...cohortOf(getAdminUniversity(uniId) ?? u)];
  const idx = cohort.findIndex((s) => s.inviteToken === input.inviteToken);
  if (idx < 0) return { ok: false, error: "Invalid or expired invite link." };

  cohort[idx] = {
    ...cohort[idx]!,
    name: input.name.trim(),
    status: "registered",
    registeredAt: new Date().toISOString(),
  };
  patchCohort(uniId, cohort);
  return { ok: true, student: cohort[idx]! };
}

export function markUniversityStudentInviteSent(
  uniId: string,
  studentId: string,
): MockUniversityStudent | undefined {
  const u = getRawUniversity(uniId);
  if (!u) return undefined;

  const cohort = [...cohortOf(getAdminUniversity(uniId) ?? u)];
  const idx = cohort.findIndex((s) => s.id === studentId);
  if (idx < 0) return undefined;

  cohort[idx] = { ...cohort[idx]!, inviteSentAt: new Date().toISOString() };
  patchCohort(uniId, cohort);
  return cohort[idx];
}

export function confirmUniversityStudentEnrollment(
  uniId: string,
  input: {
    name: string;
    email: string;
    rollNumber: string;
    programme: string;
    supervisorEmail: string;
    inviteToken: string;
  },
): MockUniversityStudent | undefined {
  const u = getRawUniversity(uniId);
  if (!u) return undefined;

  const email = input.email.trim().toLowerCase();
  const cohort = [...cohortOf(getAdminUniversity(uniId) ?? u)];
  const idx = cohort.findIndex((s) => s.inviteToken === input.inviteToken);
  if (idx < 0) return undefined;

  const row = cohort[idx]!;
  if (row.email !== email) return undefined;
  if (row.status !== "registered" && row.status !== "onboarding") return undefined;

  cohort[idx] = {
    ...row,
    name: input.name.trim(),
    rollNumber: input.rollNumber.trim(),
    programme: input.programme.trim(),
    supervisorEmail: input.supervisorEmail,
    status: "onboarding",
  };
  patchCohort(uniId, cohort);
  return cohort[idx];
}

/** Called when Trust & Safety approves KYC for a student-track contributor. */
export function activateUniversityStudentByEmail(email: string): MockUniversityStudent | undefined {
  return markUniversityStudentActiveByEmail(undefined, email);
}

/** Partnership admin approved participation — sync cohort status. */
export function markUniversityStudentActiveByEmail(
  uniId: string | undefined,
  email: string,
): MockUniversityStudent | undefined {
  const normalized = email.trim().toLowerCase();
  for (const raw of listUniversitiesMerged()) {
    if (uniId && raw.id !== uniId) continue;
    persistCohortIfNeeded(raw.id, raw);
    const u = getAdminUniversity(raw.id);
    if (!u) continue;
    const cohort = [...cohortOf(u)];
    const idx = cohort.findIndex((s) => s.email === normalized);
    if (idx < 0) continue;
    if (cohort[idx]!.status === "active") return cohort[idx];

    cohort[idx] = { ...cohort[idx]!, status: "active" };
    patchCohort(raw.id, cohort);
    return cohort[idx];
  }
  return undefined;
}

export function listUniversityCohort(uniId: string): MockUniversityStudent[] {
  const u = getAdminUniversity(uniId);
  return u ? cohortOf(u) : [];
}

export function listAdminWWPartners(): MockWWPartner[] {
  return listWWMerged().map((w) => {
    persistWWCohortIfNeeded(w.id, w);
    return withWWSyncedCounts(getRawWWPartner(w.id) ?? w);
  });
}

function getRawWWPartner(id: string): MockWWPartner | undefined {
  return listWWMerged().find((p) => p.id === id);
}

export function getAdminWWPartner(id: string): MockWWPartner | undefined {
  const w = getRawWWPartner(id);
  if (!w) return undefined;
  persistWWCohortIfNeeded(id, w);
  const merged = getRawWWPartner(id);
  return merged ? withWWSyncedCounts(merged) : undefined;
}

function wwCohortOf(w: MockWWPartner): MockWWContributor[] {
  return w.cohort ?? [];
}

function countWWInFlight(cohort: MockWWContributor[]): number {
  return cohort.filter((c) => IN_FLIGHT_STATUSES.includes(c.status as UniversityStudentStatus)).length;
}

function persistWWCohortIfNeeded(orgId: string, w: MockWWPartner): MockWWContributor[] {
  const raw = w.cohort ?? [];
  if (raw.length === 0) return [];

  let changed = false;
  const cohort = raw.map((c) => {
    if (c.inviteToken) return c;
    changed = true;
    return { ...c, inviteToken: mintWWInviteToken() };
  });

  if (changed) {
    wwOverlay.patch(orgId, { cohort, contributors: countWWInFlight(cohort) });
  }
  return cohort;
}

function withWWSyncedCounts(w: MockWWPartner): MockWWPartner {
  const cohort = wwCohortOf(w);
  if (cohort.length === 0) return w;
  return { ...w, contributors: countWWInFlight(cohort), cohort };
}

function patchWWCohort(orgId: string, cohort: MockWWContributor[]): MockWWPartner | undefined {
  wwOverlay.patch(orgId, { cohort, contributors: countWWInFlight(cohort) });
  return getAdminWWPartner(orgId);
}

function wwContributorId(): string {
  return `wwc-${Date.now().toString(36)}`;
}

export function wwPipelineCount(w: MockWWPartner): number {
  const cohort = w.cohort ?? [];
  if (cohort.length === 0) return w.contributors;
  return cohort.length;
}

export interface ResolvedWWContributorInvite {
  partner: MockWWPartner;
  contributor: MockWWContributor;
}

export function resolveWWContributorInvite(inviteToken: string): ResolvedWWContributorInvite | null {
  if (!inviteToken.trim()) return null;
  for (const raw of listWWMerged()) {
    persistWWCohortIfNeeded(raw.id, raw);
    const w = getAdminWWPartner(raw.id);
    if (!w) continue;
    const contributor = wwCohortOf(w).find((c) => c.inviteToken === inviteToken);
    if (contributor) return { partner: w, contributor };
  }
  return null;
}

export interface AddWWContributorInput {
  name: string;
  email: string;
  status?: WWContributorStatus;
}

export type AddWWContributorResult =
  | { ok: true; contributor: MockWWContributor }
  | { ok: false; error: string };

export function addWWContributor(
  orgId: string,
  input: AddWWContributorInput,
): AddWWContributorResult {
  const w = getRawWWPartner(orgId);
  if (!w) return { ok: false, error: "Partner organisation not found." };

  const email = input.email.trim().toLowerCase();
  const cohort = [...wwCohortOf(getAdminWWPartner(orgId) ?? w)];
  if (cohort.find((c) => c.email === email)) {
    return { ok: false, error: `${email} is already in this partner's cohort.` };
  }

  const entry: MockWWContributor = {
    id: wwContributorId(),
    name: input.name.trim(),
    email,
    status: input.status ?? "invited",
    enrolledAt: new Date().toISOString(),
    inviteToken: mintWWInviteToken(),
  };
  patchWWCohort(orgId, [...cohort, entry]);
  return { ok: true, contributor: entry };
}

export type ValidateWWContributorInviteResult =
  | { ok: true; contributor: MockWWContributor }
  | { ok: false; error: string };

export function validateWWContributorInvite(
  orgId: string,
  input: { email: string; inviteToken: string },
): ValidateWWContributorInviteResult {
  const resolved = resolveWWContributorInvite(input.inviteToken);
  if (!resolved) return { ok: false, error: "Invalid or expired invite link." };
  if (resolved.partner.id !== orgId) {
    return { ok: false, error: "This invite does not match the organisation in the link." };
  }

  const email = input.email.trim().toLowerCase();
  const { contributor } = resolved;

  if (contributor.status === "registered" || contributor.status === "onboarding" || contributor.status === "active") {
    return { ok: false, error: "This invite has already been used. Sign in instead." };
  }
  if (contributor.status !== "invited") {
    return { ok: false, error: "Invalid invite status." };
  }
  if (contributor.email !== email) {
    return { ok: false, error: `Register with ${contributor.email} — this invite is tied to that address.` };
  }
  return { ok: true, contributor };
}

export type RegisterWWContributorResult =
  | { ok: true; contributor: MockWWContributor }
  | { ok: false; error: string };

export function registerWWContributor(
  orgId: string,
  input: { name: string; email: string; inviteToken: string },
): RegisterWWContributorResult {
  const check = validateWWContributorInvite(orgId, {
    email: input.email,
    inviteToken: input.inviteToken,
  });
  if (!check.ok) return check;

  const w = getRawWWPartner(orgId);
  if (!w) return { ok: false, error: "Partner organisation not found." };

  const cohort = [...wwCohortOf(getAdminWWPartner(orgId) ?? w)];
  const idx = cohort.findIndex((c) => c.inviteToken === input.inviteToken);
  if (idx < 0) return { ok: false, error: "Invalid or expired invite link." };

  cohort[idx] = {
    ...cohort[idx]!,
    name: input.name.trim(),
    status: "registered",
    registeredAt: new Date().toISOString(),
  };
  patchWWCohort(orgId, cohort);
  return { ok: true, contributor: cohort[idx]! };
}

export function markWWContributorInviteSent(
  orgId: string,
  contributorId: string,
): MockWWContributor | undefined {
  const w = getRawWWPartner(orgId);
  if (!w) return undefined;

  const cohort = [...wwCohortOf(getAdminWWPartner(orgId) ?? w)];
  const idx = cohort.findIndex((c) => c.id === contributorId);
  if (idx < 0) return undefined;

  cohort[idx] = { ...cohort[idx]!, inviteSentAt: new Date().toISOString() };
  patchWWCohort(orgId, cohort);
  return cohort[idx];
}

export function confirmWWContributorEnrollment(
  orgId: string,
  input: {
    name: string;
    email: string;
    referredBy: string;
    supervisorEmail?: string;
    wantsPeerMentor: boolean;
    inviteToken: string;
  },
): MockWWContributor | undefined {
  const w = getRawWWPartner(orgId);
  if (!w) return undefined;

  const email = input.email.trim().toLowerCase();
  const cohort = [...wwCohortOf(getAdminWWPartner(orgId) ?? w)];
  const idx = cohort.findIndex((c) => c.inviteToken === input.inviteToken);
  if (idx < 0) return undefined;

  const row = cohort[idx]!;
  if (row.email !== email) return undefined;
  if (row.status !== "registered" && row.status !== "onboarding") return undefined;

  cohort[idx] = {
    ...row,
    name: input.name.trim(),
    referredBy: input.referredBy.trim(),
    supervisorEmail: input.supervisorEmail?.trim() || undefined,
    wantsPeerMentor: input.wantsPeerMentor,
    status: "onboarding",
  };
  patchWWCohort(orgId, cohort);

  if (input.wantsPeerMentor && w.programs.includes("Mentorship pairing")) {
    const pairings = [...(w.peerMentorPairings ?? [])];
    if (!pairings.some((p) => p.contributor === input.name.trim())) {
      pairings.push({
        contributor: input.name.trim(),
        mentor: "Pending assignment",
        since: new Date().toISOString(),
      });
      wwOverlay.patch(orgId, { peerMentorPairings: pairings });
    }
  }

  return cohort[idx];
}

export function activateWWContributorByEmail(email: string): MockWWContributor | undefined {
  const normalized = email.trim().toLowerCase();
  for (const raw of listWWMerged()) {
    persistWWCohortIfNeeded(raw.id, raw);
    const w = getAdminWWPartner(raw.id);
    if (!w) continue;
    const cohort = [...wwCohortOf(w)];
    const idx = cohort.findIndex((c) => c.email === normalized);
    if (idx < 0) continue;
    if (cohort[idx]!.status !== "onboarding") continue;

    cohort[idx] = { ...cohort[idx]!, status: "active" };
    patchWWCohort(raw.id, cohort);
    return cohort[idx];
  }
  return undefined;
}

export function listWWCohort(orgId: string): MockWWContributor[] {
  const w = getAdminWWPartner(orgId);
  return w ? wwCohortOf(w) : [];
}

export function resolvePartnerReferral(
  ref: string,
  track: string,
): { id: string; name: string; track: "student" | "women_wf" } | null {
  if (track === "student") {
    const u = getAdminUniversity(ref);
    return u ? { id: u.id, name: u.name, track: "student" } : null;
  }
  if (track === "women_wf") {
    const w = getAdminWWPartner(ref);
    return w ? { id: w.id, name: w.name, track: "women_wf" } : null;
  }
  return null;
}

function slugId(prefix: string, name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  let id = `${prefix}-${base}`;
  let n = 1;
  const exists = (candidate: string) =>
    prefix === "u"
      ? !!getAdminUniversity(candidate)
      : !!getAdminWWPartner(candidate);
  while (exists(id)) id = `${prefix}-${base}-${n++}`;
  return id;
}

export interface CreateUniversityInput {
  name: string;
  country: string;
  agreementRef: string;
  leadName: string;
  leadEmail: string;
  leadTitle: string;
}

export function createAdminUniversity(input: CreateUniversityInput): MockUniversity {
  const uni: MockUniversity = {
    id: slugId("u", input.name),
    name: input.name.trim(),
    country: input.country.trim(),
    agreementRef: input.agreementRef.trim(),
    agreementSignedAt: new Date().toISOString(),
    studentsInFlight: 0,
    studentsAlumni: 0,
    leadContact: {
      name: input.leadName.trim(),
      email: input.leadEmail.trim().toLowerCase(),
      title: input.leadTitle.trim(),
    },
    supervisors: [],
    academicRecognitionRules: "Pending — partnership team to finalize credit mapping with faculty.",
    cohort: [],
  };
  uniOverlay.insert(uni.id, uni);
  return uni;
}

export function updateAdminUniversity(
  id: string,
  patch: Partial<Pick<MockUniversity, "leadContact" | "supervisors" | "academicRecognitionRules" | "studentsInFlight">>,
): MockUniversity | undefined {
  if (!getAdminUniversity(id)) return undefined;
  uniOverlay.patch(id, patch);
  return getAdminUniversity(id);
}

export function addUniversitySupervisor(
  id: string,
  supervisor: { name: string; email: string; department: string },
): MockUniversity | undefined {
  const u = getAdminUniversity(id);
  if (!u) return undefined;
  uniOverlay.patch(id, { supervisors: [...u.supervisors, supervisor] });
  return getAdminUniversity(id);
}

export interface CreateWWPartnerInput {
  name: string;
  country: string;
  description: string;
  programs: string[];
  leadName: string;
  leadEmail: string;
  leadTitle: string;
}

export function createAdminWWPartner(input: CreateWWPartnerInput): MockWWPartner {
  const partner: MockWWPartner = {
    id: slugId("ww", input.name),
    name: input.name.trim(),
    country: input.country.trim(),
    contributors: 0,
    programs: input.programs,
    description: input.description.trim(),
    leadContact: {
      name: input.leadName.trim(),
      email: input.leadEmail.trim().toLowerCase(),
      title: input.leadTitle.trim(),
    },
    peerMentorPairings: [],
    cohort: [],
  };
  wwOverlay.insert(partner.id, partner);
  return partner;
}

export function updateAdminWWPartner(
  id: string,
  patch: Partial<Pick<MockWWPartner, "leadContact" | "programs" | "description" | "contributors">>,
): MockWWPartner | undefined {
  if (!getAdminWWPartner(id)) return undefined;
  wwOverlay.patch(id, patch);
  return getAdminWWPartner(id);
}

export function computeUniversitySummary(universities: MockUniversity[] = listAdminUniversities()) {
  return {
    count: universities.length,
    inFlight: universities.reduce((s, u) => s + u.studentsInFlight, 0),
  };
}

export function computeWWSummary(partners: MockWWPartner[] = listAdminWWPartners()) {
  return {
    count: partners.length,
    contributors: partners.reduce((s, p) => s + p.contributors, 0),
  };
}
