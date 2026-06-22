import { NextResponse } from "next/server";
import { MOCK_ADMIN_MENTORS, MOCK_MENTOR_COMPETENCY } from "@/mocks/admin/mentors";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ mentorId: string }> }) {
  const { mentorId } = await params;
  const mentor = MOCK_ADMIN_MENTORS.find((m) => m.id === mentorId);
  if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  return NextResponse.json({
    mentor,
    competency: MOCK_MENTOR_COMPETENCY[mentor.id] ?? [],
  });
}
