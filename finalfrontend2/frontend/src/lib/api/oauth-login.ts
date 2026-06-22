/**
 * Server-side helper that turns a provider `id_token` into a Glimmora backend
 * access token — handling all three response shapes from the backend:
 *
 *   1. Direct success            → `{ access_token, user, … }`
 *   2. MFA setup required        → programmatically init + confirm TOTP, get token
 *   3. MFA verify required       → cannot auto-complete, return pending token so
 *                                  the frontend can prompt for the user's code
 *
 * Never passes the provider `id_token` to anything other than the Glimmora
 * OAuth callback — SOW / decomposition / etc. must use the returned backend
 * `access_token` exclusively.
 */

import crypto from "crypto";
import { authApi, isMfaPending, type GlimmoraUser } from "./auth";

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

export type OAuthLoginResult =
  | {
      kind: "success";
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: GlimmoraUser;
    }
  | {
      kind: "mfa_verify_required";
      mfaPendingToken: string;
      user: Pick<GlimmoraUser, "id" | "email" | "firstName" | "lastName">;
    };

// ── TOTP helpers (shared shape with the decomposition proxy) ────────────

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

// ── MFA setup completion (for mfa_setup_required) ──────────────────────

interface MfaConfirmResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: GlimmoraUser;
}

async function setupAndConfirmMfa(
  pendingToken: string,
): Promise<MfaConfirmResponse | null> {
  const initRes = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/setup/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pendingToken}`,
    },
  });
  const initData = await initRes.json().catch(() => ({}));

  const secret =
    initData.secret ??
    initData.totp_secret ??
    initData.secret_base32 ??
    initData.secretBase32 ??
    initData.base32_secret;

  if (!secret || typeof secret !== "string") {
    console.error("[oauth-login] MFA setup init returned no secret", initData);
    return null;
  }

  const code = generateTOTP(secret);
  const confirmRes = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/setup/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pendingToken}`,
    },
    body: JSON.stringify({ code }),
  });
  const confirmData: MfaConfirmResponse = await confirmRes.json().catch(() => ({}));
  return confirmData;
}

// ── Public entry ────────────────────────────────────────────────────────

/**
 * Exchange a provider `id_token` for a Glimmora backend auth response.
 * Auto-completes `mfa_setup_required`. Returns `mfa_verify_required` when the
 * user already has TOTP configured — caller must prompt for the code.
 */
export async function loginViaOAuth(
  provider: "google" | "microsoft",
  idToken: string,
): Promise<OAuthLoginResult> {
  const response = await authApi.exchangeOAuthCode(provider, idToken);

  // Shape 1: direct success — tokens already present.
  if (!isMfaPending(response)) {
    return {
      kind: "success",
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
      user: response.user,
    };
  }

  const mfaStatus = (response as unknown as { status?: string }).status;

  // Shape 2: MFA setup required — program through init + confirm.
  if (mfaStatus === "mfa_setup_required") {
    const confirmed = await setupAndConfirmMfa(response.mfa_pending_token);
    if (confirmed?.access_token && confirmed.user) {
      return {
        kind: "success",
        accessToken: confirmed.access_token,
        refreshToken: confirmed.refresh_token ?? "",
        expiresIn: confirmed.expires_in ?? 3600,
        user: confirmed.user,
      };
    }
    // Fall through — treat as needing user-side MFA completion.
  }

  // Shape 3: MFA verify required — user has to enter an authenticator code.
  return {
    kind: "mfa_verify_required",
    mfaPendingToken: response.mfa_pending_token,
    user: response.user,
  };
}
