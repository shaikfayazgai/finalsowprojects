/**
 * Mock backend — skill detail joined with tasks-using-skill +
 * credentials earned for that skill.
 */

import { NextResponse } from "next/server";
import { MOCK_SKILLS } from "@/mocks/contributor/digital-twin";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";
import { MOCK_CREDENTIALS } from "@/mocks/contributor/credentials";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const skill = MOCK_SKILLS.find((s) => s.id === id);
  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  const tasksUsingSkill = MOCK_TASKS.filter((t) =>
    t.requiredSkills.some((s) => s.toLowerCase() === skill.name.toLowerCase()),
  );
  const credentialsForSkill = MOCK_CREDENTIALS.filter(
    (c) => c.skill.toLowerCase() === skill.name.toLowerCase(),
  );
  return NextResponse.json({ skill, tasksUsingSkill, credentialsForSkill });
}
