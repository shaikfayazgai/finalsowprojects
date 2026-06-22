/**
 * POST /api/admin/agents/[agentId]/prompts/[templateName]/rollback
 *
 * Proxied to super-admin backend:
 *   POST /api/admin/agents/{agentId}/prompts/{templateName}/rollback
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string; templateName: string }> },
) {
  const { agentId, templateName } = await params;
  const backendPath = `/api/admin/agents/${encodeURIComponent(agentId)}/prompts/${encodeURIComponent(templateName)}/rollback`;
  return proxyToBackendService(req, backendPath);
}
