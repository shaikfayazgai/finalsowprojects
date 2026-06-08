/**
 * POST /api/auth/register — register a new user against the FastAPI backend.
 *
 * frontend4 posts a single { firstName, lastName, email, password, track, ... }
 * body here. The backend has role-specific endpoints (/register/contributor,
 * /register/enterprise) and expects a `segment` for the women-in-tech track.
 * This proxy maps the frontend `track` to the right backend endpoint + payload:
 *   - track "women" | "women_wf" → contributor, segment="women", requiresApproval
 *   - track "student"            → contributor, segment="student"
 *   - track "enterprise"         → /register/enterprise
 *   - anything else (freelancer) → contributor, segment="general"
 */
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backend(): string {
  return (
    process.env.GLIMMORA_API_URL ||
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ||
    "http://127.0.0.1:9000"
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const track = String(body.track ?? "freelancer").toLowerCase();

  let path = "/api/v1/auth/register/contributor";
  let payload: Record<string, unknown>;

  if (track === "enterprise") {
    path = "/api/v1/auth/register/enterprise";
    payload = body;
  } else {
    const isWomen = track === "women" || track === "women_wf";
    const isStudent = track === "student";
    payload = {
      firstName: body.firstName,
      lastName: body.lastName ?? "",
      email: body.email,
      password: body.password,
      confirmPassword: body.confirmPassword ?? body.password,
      gender: isWomen ? "female" : (body.gender ?? undefined),
      segment: isWomen ? "women" : isStudent ? "student" : "general",
      // Women self-applicants are held pending until a Super Admin approves
      // (matches the women-in-tech approval gate).
      requiresApproval: isWomen,
      applicationOrg: body.applicationOrg,
      applicationBackground: body.applicationBackground,
      applicationDocs: body.applicationDocs,
      referralCode: body.referralCode,
    };
  }

  try {
    const res = await fetch(`${backend()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ message: "Registration failed. Please try again." }, { status: 502 });
  }
}
