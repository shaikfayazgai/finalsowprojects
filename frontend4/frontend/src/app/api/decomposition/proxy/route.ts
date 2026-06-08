import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { backendUrl } from "@/lib/api/backend-router";
import { requireSubscriptionFeature } from "@/lib/subscription/require-subscription";
import { incrementUsageCounter } from "@/lib/subscription/service";

/**
 * Server-side proxy for Glimmora Decomposition API calls.
 *
 * Handles two login scenarios:
 * 1. User completed MFA → session has access_token → use it directly
 * 2. User skipped MFA → no token → use a dedicated enterprise service
 *    account with MFA completed programmatically
 *
 * The service account is auto-registered and MFA is set up automatically
 * on first use. Its TOTP secret is stored in memory for future logins.
 */

// Decomposition endpoints live on the enterprise backend; auth/login resolves
// to a backend that serves it too. Resolve per-path at call time below.
// Use the SAME service account as /api/sow/token so plans created by one
// route are accessible by the other (same enterprise tenant). Override via
// env vars in production.
const ENT_SVC_EMAIL =
  process.env.GLIMMORA_ENTERPRISE_SERVICE_EMAIL || "enterprise-service@glimmora.com";
const ENT_SVC_PASSWORD =
  process.env.GLIMMORA_ENTERPRISE_SERVICE_PASSWORD || "Test@12345";

// ── State (persisted to file so TOTP secret survives restarts) ───────────
let cachedToken: { token: string; expiresAt: number } | null = null;
let mfaSecret: string | null = null;

const MFA_SECRET_PATH = "/tmp/glimmora-decomp-mfa-secret.txt";

function loadMfaSecret(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    if (fs.existsSync(MFA_SECRET_PATH)) {
      mfaSecret = fs.readFileSync(MFA_SECRET_PATH, "utf8").trim();
      return mfaSecret;
    }
  } catch { /* ignore */ }
  return null;
}

function saveMfaSecret(secret: string) {
  mfaSecret = secret;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    fs.writeFileSync(MFA_SECRET_PATH, secret, "utf8");
  } catch { /* ignore */ }
}

// ── Helpers ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function glimmoraFetch(path: string, opts?: RequestInit): Promise<Record<string, any>> {
  const res = await fetch(backendUrl(path), {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  const data = await res.json().catch(() => ({}));
  data._httpStatus = res.status;
  return data;
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/[=\s]/g, "").toUpperCase();
  let bits = "";
  for (const ch of cleaned) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(time, 4);
  const hash: Buffer = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, "0");
}

// ── Enterprise service account token acquisition ────────────────────────

async function acquireEnterpriseToken(): Promise<string | null> {
  // Return cached if still valid
  if (cachedToken && Date.now() / 1000 < cachedToken.expiresAt - 60) {
    return cachedToken.token;
  }

  try {
    // Step 1: Try login
    let data = await glimmoraFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ENT_SVC_EMAIL, password: ENT_SVC_PASSWORD }),
    });
    console.log("[Decomposition Proxy] Login response status:", data.status, "keys:", Object.keys(data));

    // Account doesn't exist → register + retry login
    if (data._httpStatus === 404 || data._httpStatus === 401 ||
        (typeof data.detail === "string" && (data.detail.includes("not found") || data.detail.includes("not exist") || data.detail.includes("No account")))) {
      console.log("[Decomposition Proxy] Registering enterprise service account...");
      await glimmoraFetch("/api/v1/auth/register/enterprise", {
        method: "POST",
        body: JSON.stringify({
          firstName: "Decomp", lastName: "Service",
          email: ENT_SVC_EMAIL, password: ENT_SVC_PASSWORD,
          orgName: "Glimmora Decomposition Service", orgType: "Technology",
          industry: "Technology", companySize: "1-10",
          adminTitle: "Service Account",
          acceptTos: true, acceptPp: true, acceptEsa: true, acceptAhp: true,
        }),
      });
      data = await glimmoraFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: ENT_SVC_EMAIL, password: ENT_SVC_PASSWORD }),
      });
      console.log("[Decomposition Proxy] Post-register login status:", data.status, "keys:", Object.keys(data));
    }

    // Direct token (no MFA required or MFA already done without pending)
    if (data.access_token) {
      return cacheToken(data.access_token, data.expires_in);
    }

    // MFA flow
    if (data.mfa_pending_token) {
      const pendingToken = data.mfa_pending_token;
      const status = data.status as string;
      const isVerifyPhase = status === "mfa_pending" || status === "mfa_required";
      const isSetupPhase = status === "mfa_setup_required";

      // Case A: MFA already set up (verification required) — use stored secret
      if (isVerifyPhase) {
        const secret = mfaSecret || loadMfaSecret();
        if (secret) {
          console.log("[Decomposition Proxy] Verifying MFA with stored secret...");
          const token = await verifyMfa(pendingToken);
          if (token) return cacheToken(token);
        }
        // No stored secret — need to set up fresh (shouldn't happen normally)
        console.log("[Decomposition Proxy] MFA verify required but no stored secret — attempting setup...");
        const token = await setupAndVerifyMfa(pendingToken);
        if (token) return cacheToken(token);
      }

      // Case B: MFA setup required — complete it programmatically
      if (isSetupPhase) {
        console.log("[Decomposition Proxy] Setting up MFA programmatically...");
        const token = await setupAndVerifyMfa(pendingToken);
        if (token) return cacheToken(token);
      }
    }
  } catch (err) {
    console.error("[Decomposition Proxy] Token acquisition error:", err);
  }

  return null;
}

async function setupAndVerifyMfa(pendingToken: string): Promise<string | null> {
  // Init MFA setup
  const initData = await glimmoraFetch("/api/v1/auth/mfa/setup/init", {
    method: "POST",
    headers: { Authorization: `Bearer ${pendingToken}` },
  });
  console.log("[Decomposition Proxy] MFA init keys:", Object.keys(initData));

  const secret = initData.secret || initData.totp_secret || initData.secret_base32 || initData.secretBase32 || initData.base32_secret;
  if (!secret) {
    // If WRONG_MFA_PHASE, the account already has MFA but we lost the secret.
    // Force a new service account by clearing the email file.
    if (initData.code === "WRONG_MFA_PHASE" || String(initData.detail || "").includes("WRONG_MFA_PHASE")) {
      console.error("[Decomposition Proxy] MFA already configured but secret lost — creating new service account...");
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require("fs");
        fs.unlinkSync("/tmp/glimmora-decomp-svc-email.txt");
        fs.unlinkSync("/tmp/glimmora-decomp-mfa-secret.txt");
      } catch { /* ignore */ }
    }
    console.error("[Decomposition Proxy] MFA init: no secret found.", initData);
    return null;
  }

  // Generate TOTP and confirm
  const code = generateTOTP(secret);
  const confirmData = await glimmoraFetch("/api/v1/auth/mfa/setup/confirm", {
    method: "POST",
    headers: { Authorization: `Bearer ${pendingToken}` },
    body: JSON.stringify({ code }),
  });
  console.log("[Decomposition Proxy] MFA confirm keys:", Object.keys(confirmData), "hasToken:", !!confirmData.access_token);

  // Persist secret for future logins (survives server restarts)
  saveMfaSecret(secret);

  if (confirmData.access_token) {
    return confirmData.access_token;
  }

  // Confirm succeeded but no token — re-login (now MFA is set up, will need verification)
  const loginData = await glimmoraFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ENT_SVC_EMAIL, password: ENT_SVC_PASSWORD }),
  });

  if (loginData.access_token) return loginData.access_token;

  // Login returns mfa_pending (verification) — verify with secret
  if (loginData.mfa_pending_token) {
    return verifyMfa(loginData.mfa_pending_token);
  }

  return null;
}

async function verifyMfa(pendingToken: string): Promise<string | null> {
  if (!mfaSecret) return null;
  const code = generateTOTP(mfaSecret);
  const data = await glimmoraFetch("/api/v1/auth/mfa/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${pendingToken}` },
    body: JSON.stringify({ code }),
  });
  console.log("[Decomposition Proxy] MFA verify hasToken:", !!data.access_token);
  return data.access_token ?? null;
}

function cacheToken(token: string, expiresIn?: number): string {
  cachedToken = {
    token,
    expiresAt: Math.floor(Date.now() / 1000) + (expiresIn || 3600),
  };
  return token;
}

// ── Request handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Authorization — decomposition proxy is enterprise + admin only.
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const subGate = await requireSubscriptionFeature("decomposition.ai");
  if (subGate instanceof NextResponse) return subGate;
  const tenantId = subGate.subscription.tenantId;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });

  // Delegate to /api/sow/token?role=enterprise so this proxy and the
  // direct-fetch create/list path share ONE token source. Forwarding cookies
  // preserves the user's NextAuth session for the inner request.
  let token: string | undefined;
  let tokenSource = "sow-token-endpoint";
  try {
    const origin = req.nextUrl.origin;
    const cookie = req.headers.get("cookie") ?? "";
    const tokenRes = await fetch(`${origin}/api/sow/token?role=enterprise`, {
      headers: cookie ? { cookie } : {},
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    token = tokenJson?.token as string | undefined;
  } catch {
    // fall through to service account below
  }

  // Fallback: acquire service account token directly (handles MFA-setup)
  if (!token) {
    const entToken = await acquireEnterpriseToken();
    if (entToken) {
      token = entToken;
      tokenSource = "enterprise-service-fallback";
    }
  }

  if (!token) {
    return NextResponse.json(
      { error: "Unable to acquire enterprise API token — check server logs.", tokenSource },
      { status: 503 },
    );
  }

  try {
    const { path, method, payload } = await req.json();

    if (!path || typeof path !== "string" || !path.startsWith("/api/v1/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const backendFetch = (t: string) =>
      fetch(backendUrl(path), {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });

    let res = await backendFetch(token);

    // On 401: if we used the user's SOW token, try refreshing it first
    // before falling back to the service account (service account is a
    // different tenant and cannot access user-owned resources).
    if (res.status === 401) {
      if (tokenSource === "sow-token-endpoint") {
        try {
          const origin = req.nextUrl.origin;
          const cookie = req.headers.get("cookie") ?? "";
          const refreshRes = await fetch(`${origin}/api/sow/token?role=enterprise&force_refresh=1`, {
            headers: cookie ? { cookie } : {},
          });
          const refreshJson = await refreshRes.json().catch(() => ({}));
          const refreshedToken = refreshJson?.token as string | undefined;
          if (refreshedToken && refreshedToken !== token) {
            token = refreshedToken;
            tokenSource = "sow-token-refreshed";
            res = await backendFetch(refreshedToken);
          }
        } catch {
          // Refresh failed — fall through to service account below
        }
      }

      // Still 401 — bust cache and retry with enterprise service account
      if (res.status === 401) {
        cachedToken = null;
        const freshToken = await acquireEnterpriseToken();
        if (freshToken) {
          token = freshToken;
          tokenSource = "enterprise-service-fallback-retry";
          res = await backendFetch(freshToken);
        }
      }
    }

    const rawText = await res.text().catch(() => "");
    let data: Record<string, unknown> = {};
    try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = { raw: rawText }; }

    if (!res.ok) {
      console.error(`[Decomposition Proxy] ${method || "GET"} ${path} → ${res.status} (token: ${tokenSource})`, data);
      return NextResponse.json({ ...data, _debug: { tokenSource, status: res.status } }, { status: res.status });
    }

    if (method === "POST" || method === "PUT" || method === "PATCH") {
      void incrementUsageCounter(tenantId, "aiInvocationsMonth").catch(() => {});
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Proxy error" },
      { status: 500 },
    );
  }
}
