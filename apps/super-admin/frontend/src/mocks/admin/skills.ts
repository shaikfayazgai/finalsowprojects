/**
 * Admin · skill taxonomy mock — spec doc 04 §5.E.
 * Phase 1 exit: ≥200 seeded skills. Mock seeds ~30 across categories; rest can be added.
 */

export type SkillStatus = "active" | "deprecated" | "pending";

export interface MockSkillLevel {
  level: 1 | 2 | 3 | 4;
  label: string;
  description: string;
}

export interface MockSkill {
  id: string;
  name: string;
  category: "Frontend" | "Backend" | "Data" | "Design" | "Marketing" | "Documentation" | "DevOps" | "AI/ML" | "Other";
  aliases: string[];
  status: SkillStatus;
  holders: number;
  adjacency: string[];       // skill ids
  levels: MockSkillLevel[];
  createdAt: string;
  createdBy?: string;
}

const STD_LEVELS: MockSkillLevel[] = [
  { level: 1, label: "Familiar",  description: "Have done it; need supervision." },
  { level: 2, label: "Competent", description: "Can deliver to spec." },
  { level: 3, label: "Strong",    description: "Can deliver + help others." },
  { level: 4, label: "Expert",    description: "Can shape the spec." },
];

export const MOCK_SKILLS: MockSkill[] = [];

export function findSkillById(id: string): MockSkill | undefined {
  return MOCK_SKILLS.find((s) => s.id === id);
}
