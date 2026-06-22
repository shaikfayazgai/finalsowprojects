import { NextResponse } from "next/server";
import { findSkillById } from "@/mocks/admin/skills";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ skillId: string }> }) {
  const { skillId } = await params;
  const skill = findSkillById(skillId);
  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  return NextResponse.json({ skill });
}
