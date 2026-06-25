/**
 * Typed client + shapes for the super-admin Contributors directory.
 *
 * Mirrors the backend GET /api/superadmin/contributors/directory response,
 * surfaced through the Next proxy at /api/superadmin/contributors.
 */

export interface ContributorFile {
  type:
    | "avatar"
    | "id_document"
    | "application_doc"
    | "portfolio"
    | "portfolio_screenshot"
    | "evidence"
    | "task_upload"
    | "link";
  category: "identity" | "verification" | "portfolio" | "work" | "link";
  label: string;
  url?: string | null;
  /** When the reference is a stored filename rather than an openable URL. */
  name?: string | null;
  openable: boolean;
  contentType?: string | null;
  sizeBytes?: number | null;
}

export interface ContributorProject {
  id?: number;
  title?: string;
  description?: string;
  role?: string | null;
  url?: string | null;
  video?: string | null;
  screenshots?: string[];
  skills?: string[];
  keywords?: string[];
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ContributorExperience {
  id?: number;
  kind?: string;
  organization?: string;
  role?: string;
  description?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
}

export interface ContributorEducation {
  id?: number;
  institution?: string;
  degree?: string | null;
  field?: string | null;
  grade?: string | null;
  startYear?: string | null;
  endYear?: string | null;
}

export interface ContributorSkill {
  id?: string;
  name?: string;
  category?: string;
  level?: string;
  evidenceCount?: number;
}

export type ContributorStatus = "active" | "pending" | "inactive" | "rejected";
export type KycStatus = "not_started" | "pending" | "verified" | "rejected" | string;

export interface ContributorRecord {
  id: string;
  accountId: number;
  email: string | null;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string | null;
  segment: string | null;
  tenantId: string | null;
  department: string | null;
  isActive: boolean;
  status: ContributorStatus;
  approvalStatus: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: KycStatus;
  profileCompleted: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
  // basics / location
  country: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  timezone: string | null;
  languages: string[];
  gender: string | null;
  dob: string | null;
  // professional
  bio: string | null;
  jobTitle: string | null;
  careerStage: string | null;
  yearsExperience: string | null;
  availability: string | null;
  weeklyHours: number | null;
  professional: Record<string, unknown>;
  // skills
  primarySkills: string[];
  secondarySkills: string[];
  otherSkills: string[];
  expertiseAreas: string[];
  skills: ContributorSkill[];
  // collections
  projects: ContributorProject[];
  experience: ContributorExperience[];
  education: ContributorEducation[];
  // verification / links / bank
  linkedin: string | null;
  links: Record<string, string>;
  verification: { idType?: string | null; idNumber?: string | null; idDocument?: string | null };
  bank: Record<string, unknown>;
  agreements: Record<string, unknown>;
  kyc: { status: string; data: Record<string, unknown>; updatedAt: string | null };
  // files
  files: ContributorFile[];
  fileCount: number;
}

export interface ContributorsResponse {
  contributors: ContributorRecord[];
  total: number;
}

/** Fetch the full contributor directory via the Next proxy. */
export async function fetchContributors(): Promise<ContributorRecord[]> {
  const res = await fetch("/api/superadmin/contributors", { cache: "no-store" });
  if (!res.ok) throw new Error(`contributors ${res.status}`);
  const body = (await res.json()) as Partial<ContributorsResponse>;
  return body.contributors ?? [];
}
