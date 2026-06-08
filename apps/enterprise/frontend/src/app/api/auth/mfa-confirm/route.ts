import { NextRequest, NextResponse } from "next/server";
import { backendBaseForPath } from "@/lib/api/backend-router";
import QRCode from "qrcode";

/**
 * Server-side MFA endpoint that handles ALL MFA scenarios:
 *
 * 1. MFA setup required → login → init → confirm with user's code
 * 2. MFA already configured → login → verify with user's code
 * 3. MFA setup already started → login → confirm (skip init)
 *
 * Also supports action=init to just get the QR/secret for display.
 */

const GLIMMORA_API = backendBaseForPath("/api/v1/auth/me");
async function fetchUser(accessToken: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${GLIMMORA_API}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function normalizeQrUri(initData: Record<string, unknown>): Promise<string> {
  const qrPng = String(initData.qr_code_png_base64 || initData.qrCodePngBase64 || "");
  if (qrPng) {
    return `data:image/png;base64,${qrPng}`;
  }
  const otpauthUri = String(initData.otpauth_uri || initData.otpAuthUri || "");
  if (!otpauthUri) return "";
  if (otpauthUri.startsWith("data:image/")) return otpauthUri;
  // Some backend responses only return otpauth:// URI; render a PNG QR for browser <img>.
  return await QRCode.toDataURL(otpauthUri, { margin: 1, width: 220 });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, code, action, mfa_pending_token: providedToken } = await req.json();

    // Confirm path with a reusable pending token — skip login + re-init so the
    // TOTP secret associated with the already-shown QR is preserved.
    if (action !== "init" && code && providedToken) {
      const confirmRes = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/setup/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providedToken}`,
        },
        body: JSON.stringify({ code }),
      });
      const confirmData = await confirmRes.json().catch(() => ({}));

      if (!confirmRes.ok && (confirmData.code === "WRONG_MFA_PHASE" || String(confirmData.detail).includes("WRONG_MFA_PHASE"))) {
        return await verifyMfa(providedToken, code);
      }
      if (!confirmRes.ok) {
        return NextResponse.json(confirmData, { status: confirmRes.status });
      }
      const user = confirmData.access_token ? await fetchUser(confirmData.access_token) : null;
      return NextResponse.json({ phase: "setup", ...confirmData, ...(user ? { user } : {}) });
    }

    // Init-only path with existing pending token (no need to re-login or store password in client state)
    if (action === "init" && providedToken) {
      const initRes = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/setup/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providedToken}`,
        },
      });
      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        if (initData.code === "WRONG_MFA_PHASE" || (initData.detail && String(initData.detail).includes("WRONG_MFA_PHASE"))) {
          return NextResponse.json({ phase: "verify", mfa_pending_token: providedToken });
        }
        return NextResponse.json(initData, { status: initRes.status });
      }
      const secret = initData.secret || initData.secret_base32 || initData.secretBase32 || initData.totp_secret || "";
      const qrUri = await normalizeQrUri(initData as Record<string, unknown>);
      return NextResponse.json({
        phase: "setup",
        qr_uri: qrUri,
        secret,
        mfa_pending_token: providedToken,
      });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "NO_MFA_CONTEXT", message: "Missing MFA context. Please login again." },
        { status: 400 },
      );
    }

    // Step 1: Fresh login
    const loginRes = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json().catch(() => ({}));

    // Already fully authenticated. If the user came here to *enroll* MFA
    // (action=init), use the full access token to start enrollment — backend's
    // /auth/mfa/setup/init accepts both mfa_pending and full access tokens
    // (see app/core/security.py:get_mfa_setup_principal). Without this, brand
    // new non-reviewer accounts would get phase=done and the QR would never
    // render.
    if (loginData.access_token && action === "init") {
      const initRes = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/setup/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginData.access_token}`,
        },
      });
      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        // WRONG_MFA_PHASE here means MFA is already enrolled — fall through to verify.
        if (initData.code === "WRONG_MFA_PHASE" || (initData.detail && String(initData.detail).includes("WRONG_MFA_PHASE"))) {
          return NextResponse.json({ phase: "verify", mfa_pending_token: loginData.access_token });
        }
        return NextResponse.json(initData, { status: initRes.status });
      }
      const secret = initData.secret || initData.secret_base32 || initData.secretBase32 || initData.totp_secret || "";
      const qrUri = await normalizeQrUri(initData as Record<string, unknown>);
      return NextResponse.json({
        phase: "setup",
        qr_uri: qrUri,
        secret,
        // Pass the full access token back as the "pending" token so the
        // confirm-step Authorization header authenticates correctly.
        mfa_pending_token: loginData.access_token,
      });
    }

    // Already authenticated and not enrolling — original done path.
    if (loginData.access_token) {
      return NextResponse.json({
        phase: "done",
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
        expires_in: loginData.expires_in,
        recovery_codes: [],
      });
    }

    const pendingToken = loginData.mfa_pending_token;
    if (!pendingToken) {
      return NextResponse.json(
        { error: "Login failed", detail: loginData.detail || loginData },
        { status: 401 },
      );
    }

    const mfaStatus = loginData.status; // "mfa_setup_required" or "mfa_pending"

    // ── action=init: just return QR/secret for display ──
    if (action === "init") {
      if (mfaStatus === "mfa_setup_required") {
        const initRes = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/setup/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pendingToken}`,
          },
        });
        const initData = await initRes.json().catch(() => ({}));

        if (!initRes.ok) {
          // If init fails with WRONG_MFA_PHASE, MFA is already configured
          if (initData.code === "WRONG_MFA_PHASE" || (initData.detail && String(initData.detail).includes("WRONG_MFA_PHASE"))) {
            return NextResponse.json({ phase: "verify" });
          }
          return NextResponse.json(initData, { status: initRes.status });
        }

        const secret = initData.secret || initData.secret_base32 || initData.secretBase32 || initData.totp_secret || "";
        const qrUri = await normalizeQrUri(initData as Record<string, unknown>);

        return NextResponse.json({
          phase: "setup",
          qr_uri: qrUri,
          secret,
          mfa_pending_token: pendingToken,
        });
      } else {
        // MFA already configured — just need verification, no QR needed
        return NextResponse.json({ phase: "verify" });
      }
    }

    // ── action=confirm (default): verify the user's TOTP code ──
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    if (mfaStatus === "mfa_setup_required") {
      // NOTE: we intentionally do NOT re-init here. Re-initing rotates the TOTP
      // secret on the backend, which invalidates the QR the user just scanned.
      // The client should pass back the `mfa_pending_token` returned by the
      // init call so this branch is only hit as a legacy fallback.
      const confirmRes = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/setup/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pendingToken}`,
        },
        body: JSON.stringify({ code }),
      });
      const confirmData = await confirmRes.json().catch(() => ({}));

      // If setup/confirm fails with WRONG_MFA_PHASE, try verify instead
      if (!confirmRes.ok && (confirmData.code === "WRONG_MFA_PHASE" || String(confirmData.detail).includes("WRONG_MFA_PHASE"))) {
        return await verifyMfa(pendingToken, code);
      }

      if (!confirmRes.ok) {
        return NextResponse.json(confirmData, { status: confirmRes.status });
      }

      const user = confirmData.access_token ? await fetchUser(confirmData.access_token) : null;
      return NextResponse.json({ phase: "setup", ...confirmData, ...(user ? { user } : {}) });
    } else {
      // MFA already configured — use verify endpoint
      return await verifyMfa(pendingToken, code);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

async function verifyMfa(pendingToken: string, code: string) {
  const res = await fetch(`${GLIMMORA_API}/api/v1/auth/mfa/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pendingToken}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ phase: "verify", ...data });
}
