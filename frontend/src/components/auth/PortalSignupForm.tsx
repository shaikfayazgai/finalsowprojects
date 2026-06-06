"use client";

/**
 * Contributor self-signup (the open portal). Minimal account creation —
 * name + email + password — then NextAuth sign-in and hand-off to onboarding.
 * The heavy profile fields are collected later (profile must reach 100% to
 * unlock the dashboard). OAuth (Google/Microsoft) is offered as an alternative.
 *
 * Email uniqueness is enforced server-side: the backend's single
 * `login_accounts` table holds every role, so /register/contributor's
 * find_account_by_email check rejects any email already used by ANY role.
 */

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Paperclip, X, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { apiCall, ApiError } from "@/lib/api/client";

type UploadedDoc = { url: string; filename: string; contentType: string; size: number };

export function ContributorSignupScreen() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[440px] flex-col justify-between overflow-hidden p-10 text-white lg:flex
                      bg-[linear-gradient(150deg,#1f3a34_0%,#2f6b5a_45%,#a47b2e_100%)]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
        <Link href="/" className="relative inline-flex w-fit items-center rounded-lg bg-white/15 px-3 py-2 ring-1 ring-white/20 transition-colors hover:bg-white/25">
          <div className="relative h-8 w-32">
            <Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain object-left" />
          </div>
        </Link>
        <div className="relative space-y-4">
          <span className="inline-block rounded-full bg-gold-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-100 ring-1 ring-gold-300/30">
            Contributor Portal
          </span>
          <h2 className="font-heading text-3xl font-bold leading-tight">Your career starts here</h2>
          <p className="text-base leading-relaxed text-white/75">
            Get AI-matched to real projects and build a verified global portfolio — student, professional, or freelancer.
          </p>
          <ul className="space-y-2 pt-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold-200" /> AI-matched tasks & internships</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold-200" /> Build a verified skill portfolio</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold-200" /> Earn globally — any experience level</li>
          </ul>
        </div>
        <p className="relative text-sm text-white/40">&copy; 2026 GlimmoraTeam. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-beige-50 p-6">
        <div className="w-full max-w-[420px]">
          <ContributorSignupForm />
        </div>
      </div>
    </div>
  );
}

export default function ContributorSignupForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isWomen, setIsWomen] = useState(false);
  // Women-in-Tech application fields (revealed when isWomen is on).
  const [wwOrg, setWwOrg] = useState("");
  const [wwBackground, setWwBackground] = useState("");
  const [wwDocUrl, setWwDocUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  // Email OTP verification (required before a Women in Tech application submits).
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  // Supporting file uploads (images/PDF) → Vercel Blob via the public proxy.
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);

  const sendOtp = async () => {
    setError(null); setOtpInfo(null);
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) { setError("Enter a valid email first."); return; }
    setOtpBusy(true);
    try {
      // Check the email isn't already taken BEFORE sending an OTP — otherwise the
      // user verifies a code only to be told the account exists (OTP wasted).
      const avail = await apiCall<{ available?: boolean; exists?: boolean }>(
        `/api/auth/email-available?email=${encodeURIComponent(e)}`, { method: "GET" });
      if (avail?.exists) {
        setError("An account with this email already exists. Try signing in instead.");
        return;
      }
      await apiCall("/api/auth/otp?action=send", { method: "POST", body: JSON.stringify({ email: e }) });
      setOtpSent(true);
      setOtpInfo("We emailed a 6-digit code. Enter it to verify your email.");
    } catch {
      setError("Couldn't send the code. Try again.");
    } finally { setOtpBusy(false); }
  };

  const verifyOtp = async () => {
    setError(null); setOtpInfo(null);
    setOtpBusy(true);
    try {
      await apiCall("/api/auth/otp?action=verify", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim() }),
      });
      setOtpVerified(true);
      setOtpInfo("Email verified ✓");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired code.");
    } finally { setOtpBusy(false); }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/auth/application-upload", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as Partial<UploadedDoc> & { detail?: string };
        if (!res.ok || !data.url) {
          setError(data.detail || `Could not upload ${file.name}.`);
          continue;
        }
        setDocs((prev) => [...prev, data as UploadedDoc]);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (url: string) => setDocs((prev) => prev.filter((d) => d.url !== url));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isWomen && !wwBackground.trim()) {
      setError("Please add a short background for your Women in Tech application.");
      return;
    }
    // Women in Tech: email must be OTP-verified before the application can be created.
    if (isWomen && !otpVerified) {
      setError("Please verify your email with the code we sent before submitting.");
      return;
    }
    setIsLoading(true);
    try {
      // 1) Create the account via the public frontend proxy (mirrors login).
      //    Backend rejects duplicate emails across all roles (one accounts table).
      //    Women-in-tech applicants are held 'pending' for Super Admin approval,
      //    with their application details attached.
      await apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword: password,
          gender: gender || undefined,
          segment: isWomen ? "women" : "general",
          requiresApproval: isWomen,
          ...(isWomen ? {
            applicationOrg: wwOrg.trim() || undefined,
            applicationBackground: wwBackground.trim(),
            applicationDocUrl: wwDocUrl.trim() || undefined,
            applicationDocs: docs,
          } : {}),
        }),
      });

      // Women applicants can't sign in until approved — show a confirmation.
      if (isWomen) {
        setApplied(true);
        setIsLoading(false);
        return;
      }

      // 2) Sign in via NextAuth, then route by role → onboarding/profile.
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!result?.ok || result.error) {
        // Account created but auto-login failed — send them to login.
        window.location.href = "/contributor/login";
        return;
      }
      window.location.href = "/auth/redirect";
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError(err instanceof ApiError ? err.message : "Could not create your account. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const inputCls = cn(
    "flex h-11 w-full rounded-lg border border-beige-200 bg-white px-3 text-sm transition-colors",
    "placeholder:text-beige-400 hover:border-beige-400",
    "focus:outline-none focus:ring-2 focus:ring-brown-400 focus:ring-offset-1",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

  if (applied) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest-600" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-brown-950">Application received</h1>
          <p className="text-sm text-beige-500">
            Thanks for applying to the Women in Tech track. You can sign in any time to track your
            approval status. Once our team approves your application, your dashboard unlocks and you
            can complete your profile.
          </p>
        </div>
        <Link href="/contributor/login" className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] px-6 text-sm font-semibold text-white">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-brown-950">Create your account</h1>
        <p className="text-sm text-beige-500">Join the Global Workforce Intelligence Platform</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium text-brown-900">First name</label>
            <input id="firstName" required disabled={isLoading} value={firstName}
              onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="Kavi" />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium text-brown-900">Last name</label>
            <input id="lastName" disabled={isLoading} value={lastName}
              onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Senthil" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-brown-900">Email</label>
          <input id="email" type="email" autoComplete="email" required disabled={isLoading} value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-brown-900">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required
              disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)}
              className={cn(inputCls, "pr-10")} placeholder="At least 8 characters" />
            <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-400 hover:text-brown-700">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="gender" className="text-sm font-medium text-brown-900">Gender</label>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} disabled={isLoading}
            className={inputCls}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non_binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Women in Tech — toggling this reveals an application form (reviewed
            by the team before access), not just a flag. */}
        <div className="rounded-lg border border-beige-200 bg-white/60 p-3">
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" checked={isWomen}
              onChange={(e) => { setIsWomen(e.target.checked); if (e.target.checked && !gender) setGender("female"); }}
              className="mt-0.5 h-4 w-4 rounded border-beige-300 text-brown-700 focus:ring-brown-400" />
            <span className="text-brown-800">
              Apply through the <span className="font-medium">Women in Tech</span> track
              <span className="block text-xs text-beige-500">Opens a short application — reviewed by our team before access is granted.</span>
            </span>
          </label>

          {isWomen && (
            <div className="mt-3 space-y-3 border-t border-beige-200 pt-3">
              {/* Email OTP verification — required before the application submits. */}
              <div className={cn("rounded-lg border p-2.5",
                otpVerified ? "border-forest-200 bg-forest-50" : "border-beige-200 bg-beige-50/60")}>
                {otpVerified ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-forest-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Email verified — {email}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-brown-900">
                      Verify your email <span className="text-red-500">*</span>
                      <span className="block text-[11px] font-normal text-beige-500">
                        We&apos;ll send a 6-digit code to {email || "your email"}.
                      </span>
                    </p>
                    {!otpSent ? (
                      <button type="button" onClick={sendOtp} disabled={otpBusy || !email.trim()}
                        className="inline-flex h-9 items-center justify-center rounded-md bg-brown-700 px-3 text-xs font-semibold text-white disabled:opacity-60">
                        {otpBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send verification code"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input inputMode="numeric" maxLength={6} value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          className={cn(inputCls, "h-9 w-28 text-center font-mono tracking-[0.3em]")} placeholder="••••••" />
                        <button type="button" onClick={verifyOtp} disabled={otpBusy || otpCode.length !== 6}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-brown-700 px-3 text-xs font-semibold text-white disabled:opacity-60">
                          {otpBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                        </button>
                        <button type="button" onClick={sendOtp} disabled={otpBusy}
                          className="text-xs text-brown-600 hover:underline disabled:opacity-60">Resend</button>
                      </div>
                    )}
                    {otpInfo && <p className="text-[11px] text-forest-700">{otpInfo}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="wwOrg" className="text-xs font-medium text-brown-900">Organization / program (optional)</label>
                <input id="wwOrg" value={wwOrg} onChange={(e) => setWwOrg(e.target.value)} disabled={isLoading}
                  className={cn(inputCls, "h-10")} placeholder="e.g. WomenWho Code, university, NGO" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="wwBg" className="text-xs font-medium text-brown-900">Your background <span className="text-red-500">*</span></label>
                <textarea id="wwBg" value={wwBackground} onChange={(e) => setWwBackground(e.target.value)} disabled={isLoading}
                  rows={3} className={cn(inputCls, "h-auto py-2 resize-none")}
                  placeholder="A few lines about your experience, skills, and what you're looking for." />
              </div>

              {/* Supporting files — images / PDF, multiple, all optional. */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-brown-900">Supporting documents (optional)</label>
                <p className="text-[11px] text-beige-500">Resume, certificates, portfolio — images or PDF, up to 10 MB each.</p>
                <label className={cn(
                  "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-beige-300 bg-white text-xs font-medium text-brown-700 hover:bg-beige-50",
                  (uploading || isLoading) && "pointer-events-none opacity-60")}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                  {uploading ? "Uploading…" : "Attach files"}
                  <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    className="hidden" disabled={uploading || isLoading}
                    onChange={(e) => { void onPickFiles(e.target.files); e.target.value = ""; }} />
                </label>
                {docs.length > 0 && (
                  <ul className="space-y-1.5">
                    {docs.map((d) => (
                      <li key={d.url} className="flex items-center gap-2 rounded-md border border-beige-200 bg-white px-2.5 py-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-brown-500" />
                        <span className="flex-1 truncate text-[11px] text-brown-800">{d.filename}</span>
                        <span className="text-[10px] text-beige-400">{Math.round((d.size || 0) / 1024)} KB</span>
                        <button type="button" onClick={() => removeDoc(d.url)} className="text-beige-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="wwDoc" className="text-xs font-medium text-brown-900">…or a document link (optional)</label>
                <input id="wwDoc" value={wwDocUrl} onChange={(e) => setWwDocUrl(e.target.value)} disabled={isLoading}
                  className={cn(inputCls, "h-10")} placeholder="Resume / portfolio URL" />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={isLoading || (isWomen && !otpVerified)}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg shadow-brown-500/20 transition-all",
            "bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] hover:shadow-brown-500/40 hover:brightness-105",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}>
          {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isWomen ? "Submitting…" : "Creating account…"}</>)
            : (isWomen ? (otpVerified ? "Submit application" : "Verify email to submit") : "Create account")}
        </button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-beige-200" /><span className="text-xs text-beige-400">or</span><span className="h-px flex-1 bg-beige-200" />
        </div>

        <button type="button" disabled={isLoading} onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-beige-200 bg-white text-sm font-medium text-brown-900 transition-colors hover:bg-beige-50 disabled:opacity-60">
          <span className="font-semibold text-[#4285F4]">G</span> Sign up with Google
        </button>
        <button type="button" disabled={isLoading} onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/auth/redirect" })}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-beige-200 bg-white text-sm font-medium text-brown-900 transition-colors hover:bg-beige-50 disabled:opacity-60">
          <span className="font-semibold text-[#00A4EF]">⊞</span> Sign up with Microsoft
        </button>

        <p className="text-center text-sm text-beige-500">
          Already have an account?{" "}
          <Link href="/contributor/login" className="font-medium text-brown-700 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
