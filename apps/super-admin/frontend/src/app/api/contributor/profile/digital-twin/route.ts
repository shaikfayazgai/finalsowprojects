import { NextRequest, NextResponse } from "next/server";
import { mockDigitalTwin } from "@/mocks/data/contributor";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function forwardHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;
  const contributorId = req.headers.get("x-contributor-id");
  if (contributorId) h["X-Contributor-Id"] = contributorId;
  return h;
}

function mockTwinBody() {
  return {
    contributor_id: mockDigitalTwin.contributorId,
    updated_at: mockDigitalTwin.updatedAt,
    tasks_completed: mockDigitalTwin.tasksCompleted,
    total_submissions: mockDigitalTwin.totalSubmissions,
    acceptance_rate: mockDigitalTwin.acceptanceRate,
    on_time_delivery: mockDigitalTwin.onTimeDelivery,
    sla_compliance: mockDigitalTwin.slaCompliance,
    average_review_score: mockDigitalTwin.averageReviewScore,
    total_hours_logged: mockDigitalTwin.totalHoursLogged,
    average_hours_per_task: mockDigitalTwin.averageHoursPerTask,
    skill_growth_rate: mockDigitalTwin.skillGrowthRate,
    rework_rate: mockDigitalTwin.reworkRate,
    streak_days: mockDigitalTwin.streakDays,
    longest_streak: mockDigitalTwin.longestStreak,
    top_skills: mockDigitalTwin.topSkills.map((s) => ({
      skill: s.skill,
      tasks_completed: s.tasksCompleted,
      avg_score: s.avgScore,
    })),
    monthly_activity: mockDigitalTwin.monthlyActivity.map((m) => ({
      month: m.month,
      tasks_completed: m.tasksCompleted,
      hours_logged: m.hoursLogged,
      earned: m.earned,
    })),
    ai_insights: mockDigitalTwin.aiInsights,
  };
}

export async function GET(req: NextRequest) {
  if (!BACKEND) {
    return NextResponse.json(mockTwinBody());
  }

  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile/digital-twin`;

  try {
    const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });
    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => mockTwinBody());
      return NextResponse.json(data, { status: 200 });
    }
    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Digital twin not found." }, { status: 404 });
    }
    const errBody = await backendRes.json().catch(() => ({ detail: `Backend error ${backendRes.status}` }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(mockTwinBody());
  }
}
