"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

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
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

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
      const rawState = searchParams.get("state");
      if (rawState) {
        try {
          const parsed = JSON.parse(atob(rawState));
          if (parsed.redirectAfter) redirectAfter = parsed.redirectAfter;
          if (parsed.role) roleFromState = parsed.role;
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

      // ── Case B: code exchange (server-side) ───────────────────────────
      const code = searchParams.get("code");
      const providerParam = searchParams.get("provider");
      const provider: "google" | "microsoft" = providerParam === "microsoft" ? "microsoft" : "google";
      if (code) {
        try {
          const res = await fetch("/api/auth/oauth/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, provider, state: rawState }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Token exchange failed");
          }
          const data = await res.json();

          const result = await signIn("glimmora-oauth", {
            redirect: false,
            accessToken:  data.access_token,
            refreshToken: data.refresh_token ?? "",
            expiresIn:    String(data.expires_in ?? 3600),
            userId:       data.user?.id ?? "",
            email:        data.user?.email ?? "",
            firstName:    data.user?.firstName ?? "",
            lastName:     data.user?.lastName ?? "",
            role:         data.user?.role ?? roleFromState,
            provider,
          });

          if (result?.ok) {
            router.replace(redirectAfter);
          } else {
            setErrorMsg("Sign-in failed after OAuth. Please try again.");
            setStatus("error");
          }
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

        {status === "processing" ? (
          <>
            <div className="space-y-1">
              <p className="font-heading font-semibold text-brown-950 text-lg">Completing sign-in…</p>
              <p className="text-sm text-beige-500">Setting up your session, hang tight.</p>
            </div>
            <RefreshCw className="w-5 h-5 text-brown-500 animate-spin" />
          </>
        ) : (
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
