/**
 * Admin · partnerships — spec doc 04 §5.N.
 */

export type UniversityStudentStatus = "invited" | "registered" | "onboarding" | "active";

export interface MockUniversityStudent {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  programme?: string;
  supervisorEmail?: string;
  status: UniversityStudentStatus;
  enrolledAt: string;
  /** Unique token for this student's personal registration link. */
  inviteToken: string;
  inviteSentAt?: string;
  registeredAt?: string;
}

export interface MockUniversity {
  id: string;
  name: string;
  country: string;
  agreementRef: string;
  agreementSignedAt: string;
  studentsInFlight: number;
  studentsAlumni: number;
  leadContact: { name: string; email: string; title: string };
  supervisors: { name: string; email: string; department: string }[];
  academicRecognitionRules: string;
  /** Roster of students linked to this MOU — source of truth when present. */
  cohort?: MockUniversityStudent[];
}

export const MOCK_UNIVERSITIES: MockUniversity[] = [];

export type WWContributorStatus = "invited" | "registered" | "onboarding" | "active";

export interface MockWWContributor {
  id: string;
  name: string;
  email: string;
  referredBy?: string;
  supervisorEmail?: string;
  wantsPeerMentor?: boolean;
  status: WWContributorStatus;
  enrolledAt: string;
  inviteToken: string;
  inviteSentAt?: string;
  registeredAt?: string;
}

export interface MockWWPartner {
  id: string;
  name: string;
  country: string;
  contributors: number;
  programs: string[];
  leadContact: { name: string; email: string; title: string };
  description: string;
  peerMentorPairings?: { contributor: string; mentor: string; since: string }[];
  cohort?: MockWWContributor[];
}

export const MOCK_WW_PARTNERS: MockWWPartner[] = [];

export function findUniversityById(id: string) { return MOCK_UNIVERSITIES.find((u) => u.id === id); }
export function findWWPartnerById(id: string)  { return MOCK_WW_PARTNERS.find((w) => w.id === id); }
