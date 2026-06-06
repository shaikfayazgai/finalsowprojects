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

const ENTERPRISE_SERVICE_EMAIL = process.env.GLIMMORA_ENTERPRISE_SERVICE_EMAIL || "enterprise-service@glimmora.com";
const ENTERPRISE_SERVICE_PASSWORD = process.env.GLIMMORA_ENTERPRISE_SERVICE_PASSWORD || "Test@12345";

// In-memory caches (per server instance)
let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedEnterpriseToken: { token: string; expiresAt: number } | null = null;

async function loginAccount(email: string, password: string): Promise<{ access_token?: string; expires_in?: number }> {
  const res = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json().catch(() => ({}));
}

async function loginServiceAccount(): Promise<string | null> {
  const data = await loginAccount(SERVICE_EMAIL, SERVICE_PASSWORD);
  if (data.access_token) {
    cachedToken = {
      token: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    };
    return cachedToken.token;
  }
  return null;
}

async function loginEnterpriseServiceAccount(): Promise<string | null> {
  const data = await loginAccount(ENTERPRISE_SERVICE_EMAIL, ENTERPRISE_SERVICE_PASSWORD);
  if (data.access_token) {
    cachedEnterpriseToken = {
      token: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    };
    return cachedEnterpriseToken.token;
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

async function registerEnterpriseServiceAccount(): Promise<void> {
  await fetch(`${GLIMMORA_API}/api/v1/auth/register/enterprise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Enterprise", lastName: "Service",
      email: ENTERPRISE_SERVICE_EMAIL, password: ENTERPRISE_SERVICE_PASSWORD,
      orgName: "Glimmora Service", orgType: "Technology",
      industry: "Technology", companySize: "1-10",
      adminTitle: "Service Account",
      acceptTos: true, acceptPp: true,
      acceptEsa: true, acceptAhp: true,
    }),
  }).catch(() => {});
}

async function acquireToken(): Promise<string | null> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() / 1000 < cachedToken.expiresAt - 60) {
    return cachedToken.token;
  }

  try {
    let token = await loginServiceAccount();
    if (token) return token;

    await registerServiceAccount();
    token = await loginServiceAccount();
    return token;
  } catch {
    return null;
  }
}

async function acquireEnterpriseToken(): Promise<string | null> {
  // Return cached enterprise token if still valid (with 60s buffer)
  if (cachedEnterpriseToken && Date.now() / 1000 < cachedEnterpriseToken.expiresAt - 60) {
    return cachedEnterpriseToken.token;
  }

  try {
    let token = await loginEnterpriseServiceAccount();
    if (token) return token;

    await registerEnterpriseServiceAccount();
    token = await loginEnterpriseServiceAccount();
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

  const role = req.nextUrl.searchParams.get("role");
  const forceRefresh = req.nextUrl.searchParams.get("force_refresh") === "1";
  const jwtRole = jwt.role as string | undefined;

  // Try user's own token first
  let token = jwt.glimmoraAccessToken as string | undefined;

  // Refresh: always when forced, or when token is missing
  if ((!token || forceRefresh) && jwt.glimmoraRefreshToken) {
    try {
      const refreshRes = await fetch(`${GLIMMORA_API}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: jwt.glimmoraRefreshToken }),
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshData.access_token) {
        token = refreshData.access_token;
      }
    } catch {
      // Refresh failed — fall through to service account
    }
  }

  // Fall back to service account
  if (!token) {
    // Use enterprise service account when enterprise-scoped endpoints are
    // requested OR the logged-in user has an enterprise role
    if (role === "enterprise" || jwtRole === "enterprise") {
      token = (await acquireEnterpriseToken()) ?? undefined;
    }
    // Fall back to contributor service account
    if (!token) {
      token = (await acquireToken()) ?? undefined;
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Unable to acquire API token" }, { status: 503 });
  }

  return NextResponse.json({ token });
}
