/**
 * Mock profile evidence — portfolio links, documents, GitHub repos.
 */

export type ProfileEvidenceType = "link" | "file" | "github";

export interface MockProfileEvidenceSkill {
  name: string;
  proficiency: string;
}

export interface MockProfileEvidenceItem {
  id: string;
  title: string;
  type: ProfileEvidenceType;
  url?: string;
  file_id?: string;
  description: string;
  skills: MockProfileEvidenceSkill[];
  uploadedAt: string;
}

export const MOCK_PROFILE_EVIDENCE: MockProfileEvidenceItem[] = [];
