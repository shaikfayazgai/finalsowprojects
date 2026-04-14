import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side MFA endpoint that handles ALL MFA scenarios:
 *
 * 1. MFA setup required → login → init → confirm with user's code
 * 2. MFA already configured → login → verify with user's code
 * 3. MFA setup already started → login → confirm (skip init)
 *
 * Also supports action=init to just get the QR/secret for display.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

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
      return NextResponse.json({ phase: "setup", ...confirmData });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Step 1: Fresh login
    const loginRes = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json().catch(() => ({}));

    // Already authenticated (no MFA required)
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

        const qrPng = initData.qr_code_png_base64 || initData.qrCodePngBase64 || "";
        const otpauthUri = initData.otpauth_uri || initData.otpAuthUri || "";
        const secret = initData.secret || initData.secret_base32 || initData.secretBase32 || initData.totp_secret || "";

        return NextResponse.json({
          phase: "setup",
          qr_uri: qrPng ? `data:image/png;base64,${qrPng}` : otpauthUri,
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

      return NextResponse.json({ phase: "setup", ...confirmData });
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
