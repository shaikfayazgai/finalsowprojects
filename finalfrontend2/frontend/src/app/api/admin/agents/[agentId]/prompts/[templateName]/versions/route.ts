/**
 * GET /api/admin/agents/[agentId]/prompts/[templateName]/versions
 *
 * Proxied to super-admin backend:
 *   GET /api/admin/agents/{agentId}/prompts/{templateName}/versions
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string; templateName: string }> },
) {
  const { agentId, templateName } = await params;
  const backendPath = `/api/admin/agents/${encodeURIComponent(agentId)}/prompts/${encodeURIComponent(templateName)}/versions`;
  return proxyToBackendService(req, backendPath);
}
