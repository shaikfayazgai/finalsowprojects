"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSession, getSession } from "next-auth/react";
import {
  Sparkles, Shield, CheckCircle, Copy, Download, RefreshCw,
  AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { GlassCard, GlassCardContent, Button, Input, Label, Checkbox } from "@/components/ui";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

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

      const res = await fetch("/api/auth/mfa-confirm", {
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
        setQrUri(data.qr_uri);
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
      const res = await fetch("/api/auth/mfa-confirm", {
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
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brown-500 to-brown-700 shadow-xl shadow-brown-500/20 mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">Set Up Two-Factor Auth</h1>
        <p className="text-sm text-beige-600 mt-1">Secure your account with an authenticator app</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              step > n ? "bg-teal-500" : step === n ? "bg-brown-400" : "bg-beige-200"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Scan QR or Verify ── */}
      {step === 1 && (
        <GlassCard variant="heavy" padding="lg">
          <GlassCardContent>
            <div className="space-y-5">
              <div>
                {mfaPhase === "setup" ? (
                  <>
                    <p className="font-semibold text-brown-950 mb-1">Step 1 — Scan QR Code</p>
                    <p className="text-sm text-beige-600">
                      Open <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> and scan this code.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-brown-950 mb-1">Verify Your Identity</p>
                    <p className="text-sm text-beige-600">
                      MFA is already configured. Enter the 6-digit code from your authenticator app.
                    </p>
                  </>
                )}
              </div>

              {/* QR code — only shown for setup phase */}
              {mfaPhase === "setup" && (
                <>
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-white rounded-2xl shadow-md border border-beige-200 min-h-48 min-w-48 flex items-center justify-center">
                      {initLoading ? (
                        <RefreshCw className="w-8 h-8 text-beige-300 animate-spin" />
                      ) : qrUri ? (
                        <img src={qrUri} alt="MFA QR Code" width={160} height={160} />
                      ) : (
                        <div className="text-center text-sm text-red-400 px-4">
                          <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                          Failed to load QR
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-beige-500 text-center">
                      Point your authenticator camera at this QR code
                    </p>
                  </div>

                  {/* Manual entry */}
                  {!initLoading && secret && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowManual((v) => !v)}
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        {showManual ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Can&apos;t scan? Enter this code manually
                      </button>
                      {showManual && (
                        <div className="mt-2 p-3 rounded-lg bg-beige-50 border border-beige-200">
                          <p className="text-xs text-beige-600 mb-1">Manual entry key</p>
                          <p className="font-mono text-sm font-semibold text-brown-950 tracking-widest break-all">
                            {secret}
                          </p>
                          <p className="text-xs text-beige-500 mt-1">Account: GlimmoraTeam</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Loading spinner for verify phase */}
              {mfaPhase === "verify" && initLoading && (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-8 h-8 text-beige-300 animate-spin" />
                </div>
              )}

              {/* Verify field */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verify">Enter the 6-digit code to confirm</Label>
                  <Input
                    id="verify"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono"
                    value={verifyCode}
                    onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    disabled={initLoading}
                    autoFocus={!initLoading}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
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
          </GlassCardContent>
        </GlassCard>
      )}

      {/* ── Step 2: Recovery Codes ── */}
      {step === 2 && (
        <GlassCard variant="heavy" padding="lg">
          <GlassCardContent>
            <div className="space-y-5">
              {recoveryCodes.length > 0 ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-brown-950">Step 2 — Save Recovery Codes</p>
                      <CheckCircle className="w-4 h-4 text-teal-500" />
                    </div>
                    <p className="text-sm text-beige-600">
                      Save these one-time recovery codes somewhere safe. Use them if you lose access
                      to your authenticator app. <strong>They will not be shown again.</strong>
                    </p>
                  </div>

                  {/* Codes grid */}
                  <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-brown-950 font-mono">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="text-sm text-brown-100 py-0.5">
                    <span className="text-brown-500 mr-1 text-xs">{i + 1}.</span>{code}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={handleCopyCodes}>
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={handleDownloadCodes}>
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>

              {/* Confirmation checkbox */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gold-50 border border-gold-200">
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
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-brown-950">MFA Verified Successfully</p>
                      <CheckCircle className="w-4 h-4 text-teal-500" />
                    </div>
                    <p className="text-sm text-beige-600">
                      Your identity has been verified. You can now continue to the dashboard.
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
                </>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}

export default function MFASetupPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md flex items-center justify-center py-20 text-beige-500">Loading…</div>}>
      <MFASetupContent />
    </Suspense>
  );
}
