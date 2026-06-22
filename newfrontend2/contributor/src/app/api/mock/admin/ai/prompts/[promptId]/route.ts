import { NextResponse } from "next/server";
import { findPromptById, findAgentById } from "@/mocks/admin/agents";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  const prompt = findPromptById(promptId);
  if (!prompt) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  return NextResponse.json({ prompt, agent: findAgentById(prompt.agentId) ?? null });
}
