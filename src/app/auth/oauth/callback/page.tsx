"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { Sparkles, RefreshCw, AlertCircle, Shield } from "lucide-react";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError, fetchInternal } from "@/lib/api/client";

/**
 * /auth/oauth/callback
 *
 * Landing page after the Glimmora API completes its OAuth flow (Google or
 * Microsoft).  Glimmora redirects here with either:
 *
 *   a) Tokens in query params:
 *      ?access_token=...&refresh_token=...&expires_in=...
 *      &user_id=...&email=...&first_name=...&last_name=...&role=...
 *      &provider=google&state=<base64-encoded { redirectAfter, role }>
 *
 *   b) An authorization code to exchange server-side:
 *      ?code=...&state=...
 *
 * If Glimmora instead redirects with an error:
 *      ?error=...&error_description=...
 */

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "mfa" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

  // MFA state — populated when the OAuth exchange returns mfa_pending
  const mfaPendingTokenRef = useRef("");
  const mfaProviderRef = useRef<"google" | "microsoft">("google");
  const redirectAfterRef = useRef("/enterprise/dashboard");
  const mfaUserRef = useRef<{ id: string; email: string; firstName: string; lastName: string; role: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  // TOTP countdown timer (only active during MFA step)
  useEffect(() => {
    if (status !== "mfa") return;
    const tick = () => setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status]);

  const createSession = useCallback(async (
    data: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: { id: string; email: string; firstName: string; lastName: string; role: string };
    },
    provider: string,
    redirectAfter: string,
  ) => {
    const result = await signIn("glimmora-oauth", {
      redirect: false,
      accessToken:  data.access_token,
      refreshToken: data.refresh_token ?? "",
      expiresIn:    String(data.expires_in ?? 3600),
      userId:       data.user?.id ?? "",
      email:        data.user?.email ?? "",
      firstName:    data.user?.firstName ?? "",
      lastName:     data.user?.lastName ?? "",
      role:         data.user?.role ?? "enterprise",
      provider,
    });

    if (result?.ok) {
      router.replace(redirectAfter);
    } else {
      setErrorMsg("Sign-in failed after OAuth. Please try again.");
      setStatus("error");
    }
  }, [router]);

  const handleMfaVerify = useCallback(async (code: string) => {
    setMfaLoading(true);
    setMfaError("");
    try {
      const loginData = await authApi.verifyMfaCode(code, mfaPendingTokenRef.current);
      await createSession(
        {
          access_token: loginData.access_token,
          refresh_token: loginData.refresh_token,
          expires_in: loginData.expires_in,
          user: {
            id: loginData.user.id,
            email: loginData.user.email,
            firstName: loginData.user.firstName,
            lastName: loginData.user.lastName,
            role: loginData.user.role,
          },
        },
        mfaProviderRef.current,
        redirectAfterRef.current,
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid code. Please try again.";
      setMfaError(msg);
      setMfaLoading(false);
    }
  }, [createSession]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (status === "mfa" && mfaCode.length === 6 && !mfaLoading) {
      handleMfaVerify(mfaCode);
    }
  }, [mfaCode, status, mfaLoading, handleMfaVerify]);

  useEffect(() => {
    async function handleCallback() {
      const error = searchParams.get("error");
      if (error) {
        const desc = searchParams.get("error_description") ?? error;
        setErrorMsg(desc);
        setStatus("error");
        return;
      }

      // ── Parse state ──────────────────────────────────────────────────────
      let redirectAfter = "/enterprise/dashboard";
      let roleFromState: string = "enterprise";
      let providerFromState: "google" | "microsoft" | null = null;
      try {
        const cachedRedirect = sessionStorage.getItem("_oauth_redirect_after");
        const cachedRole = sessionStorage.getItem("_oauth_role");
        const cachedProvider = sessionStorage.getItem("_oauth_provider");
        if (cachedRedirect) redirectAfter = cachedRedirect;
        if (cachedRole) roleFromState = cachedRole;
        if (cachedProvider === "google" || cachedProvider === "microsoft") {
          providerFromState = cachedProvider;
        }
      } catch {
        // ignore storage access issues
      }
      const rawState = searchParams.get("state");
      if (rawState) {
        try {
          const parsed = JSON.parse(atob(rawState));
          if (parsed.redirectAfter) redirectAfter = parsed.redirectAfter;
          if (parsed.role) roleFromState = parsed.role;
          if (parsed.provider === "google" || parsed.provider === "microsoft") {
            providerFromState = parsed.provider;
          }
        } catch {
          // state not our encoded blob — ignore (could be Glimmora's internal state)
        }
      }

      // ── Case A: Glimmora returned tokens directly ─────────────────────
      const accessToken = searchParams.get("access_token");
      if (accessToken) {
        const result = await signIn("glimmora-oauth", {
          redirect: false,
          accessToken,
          refreshToken:  searchParams.get("refresh_token") ?? "",
          expiresIn:     searchParams.get("expires_in") ?? "3600",
          userId:        searchParams.get("user_id") ?? searchParams.get("id") ?? "",
          email:         searchParams.get("email") ?? "",
          firstName:     searchParams.get("first_name") ?? searchParams.get("firstName") ?? "",
          lastName:      searchParams.get("last_name") ?? searchParams.get("lastName") ?? "",
          role:          searchParams.get("role") ?? roleFromState,
          provider:      searchParams.get("provider") ?? "google",
        });

        if (result?.ok) {
          router.replace(redirectAfter);
        } else {
          setErrorMsg("Sign-in failed after OAuth. Please try again.");
          setStatus("error");
        }
        return;
      }

      // ── Case A-MFA: Glimmora returned mfa_pending params directly ────
      const mfaPendingToken = searchParams.get("mfa_pending_token");
      if (mfaPendingToken && searchParams.get("status") === "mfa_pending") {
        const providerParam = searchParams.get("provider");
        mfaPendingTokenRef.current = mfaPendingToken;
        mfaProviderRef.current = providerParam === "microsoft" ? "microsoft" : "google";
        redirectAfterRef.current = redirectAfter;
        mfaUserRef.current = {
          id:        searchParams.get("user_id") ?? "",
          email:     searchParams.get("email") ?? "",
          firstName: searchParams.get("first_name") ?? "",
          lastName:  searchParams.get("last_name") ?? "",
          role:      searchParams.get("role") ?? roleFromState,
        };
        setStatus("mfa");
        return;
      }

      // ── Case B: code exchange (server-side) ───────────────────────────
      const code = searchParams.get("code");
      const providerParam = searchParams.get("provider");
      const provider: "google" | "microsoft" =
        providerParam === "microsoft"
          ? "microsoft"
          : providerParam === "google"
            ? "google"
            : providerFromState ?? "google";
      if (code) {
        try {
          const res = await fetchInternal("/api/auth/oauth/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, provider, state: rawState }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Token exchange failed");
          }
          const data = await res.json();

          // MFA required — show inline TOTP form
          if (isMfaPending(data)) {
            mfaPendingTokenRef.current = data.mfa_pending_token;
            mfaProviderRef.current = provider;
            redirectAfterRef.current = redirectAfter;
            mfaUserRef.current = {
              id:        data.user.id,
              email:     data.user.email,
              firstName: data.user.firstName,
              lastName:  data.user.lastName,
              role:      roleFromState,
            };
            setStatus("mfa");
            return;
          }

          await createSession(
            {
              access_token: data.access_token,
              refresh_token: data.refresh_token ?? "",
              expires_in: data.expires_in ?? 3600,
              user: {
                id:        data.user?.id ?? "",
                email:     data.user?.email ?? "",
                firstName: data.user?.firstName ?? "",
                lastName:  data.user?.lastName ?? "",
                role:      data.user?.role ?? roleFromState,
              },
            },
            provider,
            redirectAfter,
          );
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
          setStatus("error");
        }
        return;
      }

      // Neither tokens nor code — unexpected
      setErrorMsg("No authentication data received from the provider. Please try again.");
      setStatus("error");
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige-50">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {status === "processing" && (
          <>
            <div className="space-y-1">
              <p className="font-heading font-semibold text-brown-950 text-lg">Completing sign-in…</p>
              <p className="text-sm text-beige-500">Setting up your session, hang tight.</p>
            </div>
            <RefreshCw className="w-5 h-5 text-brown-500 animate-spin" />
          </>
        )}

        {status === "mfa" && (
          <div className="w-full rounded-2xl p-8 text-left space-y-5"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center mb-3 shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <p className="font-heading font-semibold text-brown-950 text-lg">Two-Factor Authentication</p>
              <p className="text-sm text-beige-500 mt-1">
                Enter the 6-digit code from your authenticator app to complete sign-in.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                autoFocus
                disabled={mfaLoading}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.5em] font-mono border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brown-500/20 focus:border-brown-400 disabled:opacity-50"
              />
              <div className="space-y-1">
                <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 bg-teal-500"
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-center">
                  Code expires in <span className="font-mono font-semibold text-brown-700">{timeLeft}s</span>
                </p>
              </div>
            </div>

            {mfaError && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {mfaError}
              </div>
            )}

            {mfaLoading && (
              <div className="flex items-center justify-center gap-2 py-1 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" /> Verifying…
              </div>
            )}

            <button
              type="button"
              onClick={() => router.replace("/auth/login")}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors w-full text-center"
            >
              Back to login
            </button>
          </div>
        )}

        {status === "error" && (
          <>
            <div className="space-y-1">
              <p className="font-heading font-semibold text-brown-950 text-lg">Sign-in failed</p>
              <p className="text-sm text-beige-500">{errorMsg}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
            <button
              onClick={() => router.replace("/auth/login")}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-brown-500 animate-spin" />
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
