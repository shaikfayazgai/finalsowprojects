/**
 * Mentor notifications — proxied to the real backend.
 *
 * The gateway routes /api/v1/notifications to the freelancer backend which
 * owns the contributor_notifications table (shared across all portal roles
 * since notifications are keyed by account_id from the JWT).
 *
 * Backend shape: { notifications, unreadCount, total, page, page_size }
 * where each notification has: id, kind, severity, title, body,
 * actionUrl, actionLabel, resourceType, resourceId, channels,
 * dispatchedAt, readAt.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/notifications");
}
