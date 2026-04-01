import { NextRequest, NextResponse } from "next/server";

// FSD §5.5: AGI Scoring — composite = MCQ(25%) + WorkSample(50%) + Adaptive(25%)
// Pass threshold: >= 70%. Borderline: 65-70% → borderline_review. Fail: < 65%

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mcqScore, workSampleScore, adaptiveScore } = body;

  if (mcqScore == null || workSampleScore == null || adaptiveScore == null) {
    return NextResponse.json({ error: "All three component scores are required" }, { status: 400 });
  }

  const composite = Math.round(mcqScore * 0.25 + workSampleScore * 0.50 + adaptiveScore * 0.25);

  let status: string;
  let passed: boolean;
  if (composite >= 70) {
    status = "completed";
    passed = true;
  } else if (composite >= 65) {
    status = "borderline_review";
    passed = false;
  } else {
    status = "completed";
    passed = false;
  }

  // Auto-confirm designation for passing scores
  const designationConfirmed = passed ? "Full-Stack Developer" : undefined;
  const seniorityConfirmed = passed ? "mid" : undefined;
  const retakeEligibleAt = !passed
    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  return NextResponse.json({
    compositeScore: composite,
    passed,
    status,
    designationConfirmed,
    seniorityConfirmed,
    retakeEligibleAt,
    breakdown: {
      mcq: { score: mcqScore, weight: 25, contribution: Math.round(mcqScore * 0.25) },
      workSample: { score: workSampleScore, weight: 50, contribution: Math.round(workSampleScore * 0.50) },
      adaptive: { score: adaptiveScore, weight: 25, contribution: Math.round(adaptiveScore * 0.25) },
    },
  });
}
