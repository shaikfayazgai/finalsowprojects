import { NextRequest, NextResponse } from "next/server";

// FSD §5.2: Server-side timer enforcement
// FSD §5.3: 72-hour deadline enforcement

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { componentType, startedAt, answers, serverTimeLimit } = body;

  if (!componentType || !startedAt) {
    return NextResponse.json({ error: "componentType and startedAt are required" }, { status: 400 });
  }

  const startTime = new Date(startedAt).getTime();
  const now = Date.now();
  const elapsed = (now - startTime) / 1000; // seconds

  // Validate time limits
  let timeLimitSeconds: number;
  if (componentType === "mcq") {
    timeLimitSeconds = (serverTimeLimit || 45) * 60; // 45 minutes default
  } else if (componentType === "work_sample") {
    timeLimitSeconds = 72 * 60 * 60; // 72 hours
  } else if (componentType === "adaptive") {
    timeLimitSeconds = (serverTimeLimit || 30) * 60; // 30 minutes default
  } else {
    return NextResponse.json({ error: "Invalid componentType" }, { status: 400 });
  }

  if (elapsed > timeLimitSeconds + 30) { // 30s grace period for network delay
    return NextResponse.json({
      valid: false,
      error: "Submission rejected: time limit exceeded",
      elapsed: Math.round(elapsed),
      limit: timeLimitSeconds,
    }, { status: 422 });
  }

  return NextResponse.json({
    valid: true,
    elapsed: Math.round(elapsed),
    limit: timeLimitSeconds,
    receivedAt: new Date().toISOString(),
  });
}
