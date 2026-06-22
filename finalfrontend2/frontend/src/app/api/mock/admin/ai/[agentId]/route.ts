import { NextResponse } from "next/server";
import { findAgentById, findPromptById } from "@/mocks/admin/agents";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const agent = findAgentById(agentId);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json({ agent, activePrompt: findPromptById(agent.activePromptId) ?? null });
}
