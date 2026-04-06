import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Returns a valid Glimmora API Bearer token for the current user.
 *
 * The frontend calls this once, caches the token, and uses it for
 * direct calls to the Glimmora API endpoints.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

const SERVICE_EMAIL = process.env.GLIMMORA_SERVICE_EMAIL || "sow-test-user@glimmora.com";
const SERVICE_PASSWORD = process.env.GLIMMORA_SERVICE_PASSWORD || "Test@12345";

// In-memory cache (per server instance)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function loginServiceAccount(): Promise<string | null> {
  const res = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD }),
  });

  const data = await res.json().catch(() => ({}));

  if (data.access_token) {
    cachedToken = {
      token: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    };
    return cachedToken.token;
  }

  return null;
}

async function registerServiceAccount(): Promise<void> {
  await fetch(`${GLIMMORA_API}/api/v1/auth/register/contributor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "SOW", lastName: "Service",
      email: SERVICE_EMAIL, password: SERVICE_PASSWORD,
      confirmPassword: SERVICE_PASSWORD,
      contributorType: "general_workforce", countryOfResidence: "India",
      dateOfBirth: "1995-01-01", timeZone: "Asia/Kolkata",
      weeklyAvailabilityHours: "40", departmentCategory: "Engineering",
      primarySkills: ["API", "Testing"], phone: "+919999999990",
      ndaSignatoryLegalName: "SOW Service",
      mentorGuideAcknowledged: true,
      acceptTermsOfUse: true, acceptCodeOfConduct: true,
      acceptPrivacyPolicy: true, acceptHarassmentPolicy: true,
      acknowledgmentsAccepted: true, notifyNewTasksOptIn: true,
    }),
  }).catch(() => {});
}

async function acquireToken(): Promise<string | null> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() / 1000 < cachedToken.expiresAt - 60) {
    return cachedToken.token;
  }

  try {
    // Try login first
    let token = await loginServiceAccount();
    if (token) return token;

    // Login failed (account may not exist) — register and retry
    await registerServiceAccount();
    token = await loginServiceAccount();
    return token;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Verify user is authenticated via NextAuth
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  if (!jwt?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Try user's own token first, fall back to service account
  let token = jwt.glimmoraAccessToken as string | undefined;
  if (!token) {
    token = (await acquireToken()) ?? undefined;
  }

  if (!token) {
    return NextResponse.json({ error: "Unable to acquire API token" }, { status: 503 });
  }

  return NextResponse.json({ token });
}
