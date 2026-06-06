import type { ProfileEvidenceItemApi } from "@/lib/api/contributor";
import type { LucideIcon } from "lucide-react";
import { ExternalLink, FileText, Github } from "lucide-react";

export type EvidenceType = "link" | "file" | "github";

export interface EvidenceRow {
  id: string;
  title: string;
  type: EvidenceType;
  url?: string;
  fileId?: string;
  description: string;
  skillTags: string[];
  skills: Array<{ name: string; proficiency: string }>;
  uploadedAt?: string;
}

export const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

export const SUGGESTED_SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Git",
  "AWS",
  "Docker",
  "GraphQL",
  "REST API",
  "MongoDB",
  "Redis",
  "Kubernetes",
  "CI/CD",
  "Flutter",
  "Accessibility",
  "Figma",
];

export const EVIDENCE_TYPE_TABS: Array<{ id: "" | EvidenceType; label: string }> = [
  { id: "", label: "All" },
  { id: "link", label: "Links" },
  { id: "file", label: "Documents" },
  { id: "github", label: "GitHub" },
];

export const TYPE_ICONS: Record<EvidenceType, LucideIcon> = {
  link: ExternalLink,
  file: FileText,
  github: Github,
};

export function normalizeProficiency(p: string): string {
  const v = p.toLowerCase();
  return PROFICIENCY_LEVELS.includes(v as (typeof PROFICIENCY_LEVELS)[number]) ? v : "intermediate";
}

export function mapApiItemToRow(item: ProfileEvidenceItemApi): EvidenceRow {
  const raw = (item.type || "link").toLowerCase();
  let type: EvidenceType = "link";
  if (raw === "github") type = "github";
  else if (raw === "file" || raw === "document" || raw === "upload") type = "file";

  const skills = (item.skills ?? []).map((s) => ({
    name: s.name,
    proficiency: normalizeProficiency(s.proficiency ?? "intermediate"),
  }));

  const skillTags = skills.map((s) => {
    const p = s.proficiency?.trim();
    return p ? `${s.name} · ${p}` : s.name;
  });

  return {
    id: item.id,
    title: item.title,
    type,
    url: item.url,
    fileId: item.file_id,
    description: item.description ?? "",
    skillTags,
    skills,
    uploadedAt: (item as { uploadedAt?: string; uploaded_at?: string }).uploadedAt
      ?? (item as { uploaded_at?: string }).uploaded_at,
  };
}

export function evidenceTypeLabel(type: EvidenceType): string {
  if (type === "github") return "GitHub";
  if (type === "file") return "Document";
  return "Link";
}

export function evidenceTypeChipStatus(type: EvidenceType): "success" | "neutral" | "info" {
  if (type === "link") return "info";
  if (type === "github") return "neutral";
  return "success";
}

export function fmtEvidenceDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function hostFromUrl(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.length > 32 ? `${url.slice(0, 32)}…` : url;
  }
}
