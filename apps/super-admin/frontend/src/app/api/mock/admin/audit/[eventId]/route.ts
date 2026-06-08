import { NextResponse } from "next/server";
import { findAdminAuditEvent } from "@/mocks/admin/audit";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = findAdminAuditEvent(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ event });
}
