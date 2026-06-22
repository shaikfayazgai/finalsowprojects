import { NextResponse } from "next/server";
import { MOCK_PROMPT_TEMPLATES, MOCK_AI_AGENTS } from "@/mocks/admin/agents";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_PROMPT_TEMPLATES, agents: MOCK_AI_AGENTS });
}
