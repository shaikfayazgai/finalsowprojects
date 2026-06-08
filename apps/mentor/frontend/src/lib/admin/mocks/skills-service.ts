/**
 * Admin skill taxonomy mock service — localStorage overlay.
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import {
  MOCK_SKILLS,
  type MockSkill,
  type MockSkillLevel,
  type SkillStatus,
} from "@/mocks/admin/skills";

const STD_LEVELS: MockSkillLevel[] = [
  { level: 1, label: "Familiar", description: "Have done it; need supervision." },
  { level: 2, label: "Competent", description: "Can deliver to spec." },
  { level: 3, label: "Strong", description: "Can deliver + help others." },
  { level: 4, label: "Expert", description: "Can shape the spec." },
];

const skillOverlay = createOverlayStore<MockSkill>("glimmora.mock.adminSkills.v1");

export const adminSkillOverlay = skillOverlay;

function listMerged(): MockSkill[] {
  return applyOverlay(MOCK_SKILLS, skillOverlay.read());
}

export function listAdminSkills(): MockSkill[] {
  return listMerged();
}

export function getAdminSkill(id: string): MockSkill | undefined {
  return listMerged().find((s) => s.id === id);
}

export function findAdminSkillById(id: string): MockSkill | undefined {
  return getAdminSkill(id);
}

export interface CreateSkillInput {
  name: string;
  category: MockSkill["category"];
  aliases?: string[];
}

export function createAdminSkill(input: CreateSkillInput): MockSkill {
  const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
  let id = `s-${base}`;
  let n = 1;
  while (getAdminSkill(id)) id = `s-${base}-${n++}`;

  const skill: MockSkill = {
    id,
    name: input.name.trim(),
    category: input.category,
    aliases: input.aliases ?? [],
    status: "active",
    holders: 0,
    adjacency: [],
    levels: STD_LEVELS,
    createdAt: new Date().toISOString(),
  };
  skillOverlay.insert(id, skill);
  return skill;
}

export function updateAdminSkill(
  id: string,
  patch: Partial<Pick<MockSkill, "name" | "category" | "aliases" | "status" | "adjacency">>,
): MockSkill | undefined {
  if (!getAdminSkill(id)) return undefined;
  skillOverlay.patch(id, patch);
  return getAdminSkill(id);
}

export function deprecateAdminSkill(id: string): MockSkill | undefined {
  return updateAdminSkill(id, { status: "deprecated" });
}

export function approveAdminSkill(id: string): MockSkill | undefined {
  return updateAdminSkill(id, { status: "active" });
}

export function rejectAdminSkill(id: string): MockSkill | undefined {
  return updateAdminSkill(id, { status: "deprecated" });
}

export function mergeAdminSkills(
  sourceId: string,
  targetId: string,
  _reason: string,
): { source: MockSkill; target: MockSkill } | null {
  const source = getAdminSkill(sourceId);
  const target = getAdminSkill(targetId);
  if (!source || !target || sourceId === targetId) return null;

  const newAliases = Array.from(
    new Set([...target.aliases, source.name, ...source.aliases]),
  ).filter((a) => a !== target.name);

  skillOverlay.patch(targetId, {
    holders: target.holders + source.holders,
    aliases: newAliases,
  });
  skillOverlay.patch(sourceId, {
    status: "deprecated" as SkillStatus,
    holders: 0,
    aliases: [source.name, ...source.aliases],
  });

  const updatedSource = getAdminSkill(sourceId);
  const updatedTarget = getAdminSkill(targetId);
  if (!updatedSource || !updatedTarget) return null;
  return { source: updatedSource, target: updatedTarget };
}
