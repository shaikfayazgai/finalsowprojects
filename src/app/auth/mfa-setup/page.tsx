"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSession, getSession } from "next-auth/react";
import {
  Sparkles, Shield, CheckCircle, Copy, Download, RefreshCw,
  AlertCircle, ChevronDown, ChevronUp, ArrowLeft, Lock,
} from "lucide-react";
import Link from "next/link";
import { Button, Input, Label, Checkbox } from "@/components/ui";
import { authApi } from "@/lib/api/auth";
import { ApiError, fetchInternal } from "@/lib/api/client";
import QRCode from "qrcode";

function MFASetupContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/enterprise/dashboard";
  const { data: session } = useSession();

  const [step, setStep]             = useState<1 | 2>(1);
  const [verifyCode, setVerifyCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [savedCodes, setSavedCodes] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState(false);

  // From API
  const [qrUri, setQrUri]               = useState("");
  const [secret, setSecret]             = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const mfaTokenRef = useRef("");  // mfa_pending_token for users without accessToken

  // MFA phase: "setup" = show QR + code input, "verify" = code input only (MFA already configured)
  const [mfaPhase, setMfaPhase] = useState<"setup" | "verify">("setup");

  // Fetch QR + secret via server-side endpoint (handles all MFA states)
  const initRanRef = useRef(false);

  useEffect(() => {
    if (session === undefined) return;
    if (initRanRef.current) return;
    initRanRef.current = true;
    initMfa();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function initMfa() {
    try {
      const email = sessionStorage.getItem("_mfa_setup_email") || "";
      const password = sessionStorage.getItem("_mfa_setup_password") || "";

      if (!email || !password) {
        setError("Session expired. Please go back and login again.");
        setInitLoading(false);
        return;
      }

      const res = await fetchInternal("/api/auth/mfa-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "init" }),
      });
      const data = await res.json();

      if (data.phase === "verify") {
        // MFA already configured — skip QR, just show code input
        setMfaPhase("verify");
      } else if (data.phase === "setup" && data.qr_uri) {
        setMfaPhase("setup");
        // If the backend returned an otpauth:// URI (not a data URL image),
        // render it to a PNG data URL client-side so <img> can display it.
        if (data.qr_uri.startsWith("data:")) {
          setQrUri(data.qr_uri);
        } else {
          try {
            const dataUrl = await QRCode.toDataURL(data.qr_uri, { width: 256, margin: 1 });
            setQrUri(dataUrl);
          } catch {
            setQrUri(data.qr_uri); // fallback — image will fail to load, user can use manual entry
          }
        }
        setSecret(data.secret || "");
        mfaTokenRef.current = data.mfa_pending_token || "";
      } else if (data.phase === "done") {
        // Already fully authenticated — redirect
        router.push(redirect);
        return;
      } else if (!res.ok) {
        setError(data.detail || data.error || "Failed to initialize MFA setup.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load MFA setup.");
    } finally {
      setInitLoading(false);
    }
  }

  // Confirm TOTP code → get real recovery codes + new tokens.
  // Uses a server-side endpoint to avoid stale pending token issues.
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setError("");
    setIsLoading(true);

    try {
      const email = sessionStorage.getItem("_mfa_setup_email") || "";
      const password = sessionStorage.getItem("_mfa_setup_password") || "";

      // Call server-side endpoint that handles login → init → confirm in one shot
      const res = await fetchInternal("/api/auth/mfa-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: verifyCode, mfa_pending_token: mfaTokenRef.current || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.detail || data.message || data.error || "Verification failed";
        const cleanMsg = typeof msg === "string" ? msg : (msg.message || JSON.stringify(msg));
        if (cleanMsg.toLowerCase().includes("invalid")) {
          setError("Invalid code. Please wait for a new code in your authenticator app and try again.");
        } else {
          setError(cleanMsg);
        }
        return;
      }

      setRecoveryCodes(data.recovery_codes || []);

      // Update session with the new access token
      if (data.access_token) {
        const { signIn } = await import("next-auth/react");
        await signIn("glimmora-oauth", {
          userId: (session?.user as { id?: string })?.id || "",
          email: session?.user?.email || email,
          firstName: session?.user?.name?.split(" ")[0] || "",
          lastName: session?.user?.name?.split(" ").slice(1).join(" ") || "",
          role: "enterprise",
          accessToken: data.access_token,
          refreshToken: data.refresh_token || "",
          expiresIn: String(data.expires_in || 3600),
          provider: "credentials",
          redirect: false,
        });
      }

      await getSession();
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCodes = () => {
    const blob = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "glimmorateam-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    router.push(redirect);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">

        {/* Back link */}
        <Link
          href="/auth/login"
          className="self-start inline-flex items-center gap-1.5 text-xs font-medium text-beige-500 hover:text-brown-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brown-500 to-brown-700 shadow-lg shadow-brown-500/20 ring-1 ring-white/40 mb-5">
          {mfaPhase === "verify" ? (
            <Shield className="w-7 h-7 text-white" />
          ) : (
            <Sparkles className="w-7 h-7 text-white" />
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading text-2xl font-semibold text-brown-950 tracking-tight text-center">
          {mfaPhase === "verify" ? "Two-Factor Authentication" : "Set Up Two-Factor Auth"}
        </h1>
        <p className="text-sm text-beige-600 mt-2 mb-8 text-center max-w-sm leading-relaxed">
          {mfaPhase === "verify"
            ? "Enter the 6-digit code from your authenticator app to continue."
            : "Secure your account by linking an authenticator app."}
        </p>

        {/* Progress — setup only */}
        {mfaPhase === "setup" && (
          <div className="w-full flex items-center gap-3 mb-6">
            {[
              { n: 1, label: "Scan" },
              { n: 2, label: "Save" },
            ].map(({ n, label }, idx) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border transition-all ${
                    step > n
                      ? "bg-teal-500 text-white border-teal-500"
                      : step === n
                      ? "bg-brown-600 text-white border-brown-600"
                      : "bg-white text-beige-400 border-beige-200"
                  }`}
                >
                  {step > n ? <CheckCircle className="w-3.5 h-3.5" /> : n}
                </div>
                <span className={`text-xs font-medium ${step >= n ? "text-brown-950" : "text-beige-400"}`}>
                  {label}
                </span>
                {idx === 0 && (
                  <div className={`flex-1 h-px ${step > n ? "bg-teal-500" : "bg-beige-200"}`} />
                )}
              </div>
            ))}
          </div>
        )}

      {/* ── Step 1: Scan QR or Verify ── */}
      {step === 1 && (
        <div className="w-full bg-white/90 backdrop-blur rounded-2xl border border-beige-200/70 shadow-xl shadow-brown-900/5 p-8">
          {mfaPhase === "setup" && (
            <div className="mb-6">
              <div className="flex flex-col items-center">
                <div className="relative p-4 bg-white rounded-2xl shadow-sm border border-beige-200 w-52 h-52 flex items-center justify-center">
                  <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brown-400 rounded-tl" />
                  <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brown-400 rounded-tr" />
                  <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brown-400 rounded-bl" />
                  <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brown-400 rounded-br" />
                  {initLoading ? (
                    <RefreshCw className="w-8 h-8 text-beige-300 animate-spin" />
                  ) : qrUri ? (
                    <img src={qrUri} alt="MFA QR Code" width={168} height={168} />
                  ) : (
                    <div className="text-center text-sm text-red-400 px-4">
                      <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                      Failed to load QR
                    </div>
                  )}
                </div>
                <p className="text-xs text-beige-500 text-center mt-3">
                  Scan with Google / Microsoft Authenticator
                </p>
              </div>

              {!initLoading && secret && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowManual((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    {showManual ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Can&apos;t scan? Enter code manually
                  </button>
                  {showManual && (
                    <div className="mt-3 p-4 rounded-xl bg-beige-50 border border-beige-200 text-left">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-beige-600 mb-1">
                        Manual entry key
                      </p>
                      <p className="font-mono text-sm font-semibold text-brown-950 tracking-widest break-all">
                        {secret}
                      </p>
                      <p className="text-[11px] text-beige-500 mt-1.5">Account: GlimmoraTeam</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mfaPhase === "verify" && initLoading && (
            <div className="flex justify-center py-6">
              <RefreshCw className="w-7 h-7 text-beige-300 animate-spin" />
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="verify" className="text-sm font-medium text-brown-900">
                  Verification code
                </Label>
                <span className="text-xs font-medium text-beige-500">6 digits</span>
              </div>
              <Input
                id="verify"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="– – – – – –"
                className="h-14 text-center text-2xl tracking-[0.6em] font-mono font-semibold rounded-xl border-beige-300 bg-white focus:border-brown-400 focus:ring-2 focus:ring-brown-200 transition-all"
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                disabled={initLoading}
                autoFocus={!initLoading}
              />
              <p className="text-[11px] text-beige-500 text-center mt-2">
                Code refreshes every 30 seconds
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading || initLoading || verifyCode.length !== 6}
            >
              {isLoading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</>
              ) : (
                <>Verify &amp; Continue</>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* ── Step 2: Recovery Codes ── */}
      {step === 2 && (
        <div className="w-full bg-white/90 backdrop-blur rounded-2xl border border-beige-200/70 shadow-xl shadow-brown-900/5 p-8">
          {recoveryCodes.length > 0 ? (
            <div className="space-y-5">
              <div className="text-center pb-5 border-b border-beige-200/70">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 mb-3">
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                </div>
                <p className="font-semibold text-brown-950">Save Recovery Codes</p>
                <p className="text-xs text-beige-600 mt-1 leading-relaxed max-w-sm mx-auto">
                  Store these one-time codes safely. <strong className="text-brown-800">They will not be shown again.</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-5 rounded-xl bg-brown-950 font-mono">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="text-sm text-brown-100 py-0.5 tracking-wide">
                    <span className="text-brown-500 mr-2 text-[11px] tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {code}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCopyCodes}>
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadCodes}>
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gold-50 border border-gold-200">
                <Checkbox
                  id="saved"
                  checked={savedCodes}
                  onCheckedChange={(v) => setSavedCodes(!!v)}
                  className="mt-0.5"
                />
                <label htmlFor="saved" className="text-sm text-gold-800 cursor-pointer leading-relaxed">
                  I have saved my recovery codes in a secure location
                </label>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!savedCodes}
                onClick={handleFinish}
              >
                <Shield className="w-4 h-4" /> Complete Setup
              </Button>
            </div>
          ) : (
            <div className="space-y-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100">
                <CheckCircle className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-brown-950">Verified Successfully</p>
                <p className="text-xs text-beige-600 mt-1 leading-relaxed">
                  Your identity has been confirmed. You can now continue to your dashboard.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleFinish}
              >
                <Shield className="w-4 h-4" /> Continue to Dashboard
              </Button>
            </div>
          )}
        </div>
      )}

        {/* Trust footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-beige-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>End-to-end encrypted</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-beige-300" />
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            <span>SOC 2 compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MFASetupPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center text-beige-500">Loading…</div>}>
      <MFASetupContent />
    </Suspense>
  );
}
