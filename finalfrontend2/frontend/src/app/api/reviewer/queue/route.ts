/**
 * Proxy: GET /api/reviewer/queue
 * The reviewer backend exposes the queue as the `assignments` array on
 * GET /api/v1/reviewer/dashboard (there is no /queue endpoint). We fetch that
 * and map it to the { items, total } shape the queue UI expects.
 */

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

export async function GET(req: NextRequest) {
  const guard = await requireRole(["reviewer", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${GLIMMORA_API}/api/v1/reviewer/dashboard`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      assignments?: Array<Record<string, unknown>>;
    };
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    // Map the backend assignment shape → the MockReviewerItem shape the queue
    // UI expects (fill every field the component reads so nothing is undefined).
    const raw = Array.isArray(data.assignments) ? data.assignments : [];
    const items = raw.map((a) => {
      const d = (a.data ?? {}) as Record<string, unknown>;
      return {
        id: String(a.id ?? ""),
        taskTitle: (a.title as string) ?? (d.taskTitle as string) ?? "Submission",
        project: (a.projectName as string) ?? (d.project as string) ?? "",
        contributorName: (d.contributorName as string) ?? (a.reviewerEmail as string) ?? "Contributor",
        mentorName: (d.mentorName as string) ?? "",
        mentorAcceptedAt: (d.mentorAcceptedAt as string) ?? (a.createdAt as string) ?? null,
        dueAt: (d.dueAt as string) ?? null,
        slaTier: (d.slaTier as string) ?? (a.priority as string) ?? "on_track",
        round: (d.round as number) ?? 1,
        totalRounds: (d.totalRounds as number) ?? 1,
        criteria: Array.isArray(d.criteria) ? d.criteria : [],
        criteriaValidatedCount: (d.criteriaValidatedCount as number) ?? 0,
        status: (a.status as string) ?? "pending",
        ...a,
      };
    });
    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (err) {
    console.error("[api/reviewer/queue GET]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
