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

export const MOCK_PROFILE_EVIDENCE: MockProfileEvidenceItem[] = [
  {
    id: "ev-100",
    title: "Contributor dashboard redesign",
    type: "link",
    url: "https://example.com/portfolio/dashboard-redesign",
    description: "Case study covering component library adoption, accessibility audit, and mentor handoff notes.",
    skills: [
      { name: "React", proficiency: "advanced" },
      { name: "Accessibility", proficiency: "intermediate" },
    ],
    uploadedAt: "2026-02-10T08:00:00.000Z",
  },
  {
    id: "ev-101",
    title: "Frontend Engineering Certificate",
    type: "file",
    file_id: "file-cert-fe-2025.pdf",
    url: "https://example.com/certificate/frontend-2025.pdf",
    description: "Verified certificate from platform bootcamp — includes rubric scores and project references.",
    skills: [{ name: "TypeScript", proficiency: "intermediate" }],
    uploadedAt: "2026-01-20T10:30:00.000Z",
  },
  {
    id: "ev-102",
    title: "design-system-starter",
    type: "github",
    url: "https://github.com/example/design-system-starter",
    description: "Open-source starter with tokens, Storybook stories, and WCAG-focused primitives.",
    skills: [
      { name: "React", proficiency: "advanced" },
      { name: "Figma", proficiency: "intermediate" },
    ],
    uploadedAt: "2026-03-05T14:15:00.000Z",
  },
  {
    id: "ev-103",
    title: "Date picker accessibility walkthrough",
    type: "link",
    url: "https://example.com/walkthrough/date-picker-a11y",
    description: "Screen reader demo and keyboard map used during task UI-Modal-008 acceptance.",
    skills: [{ name: "Accessibility", proficiency: "intermediate" }],
    uploadedAt: "2026-03-18T09:40:00.000Z",
  },
];
