"use client";

/**
 * Create account — matches login auth shell.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  AuthDivider,
  AuthField,
  AuthHeaderLink,
  AuthLegalFooter,
  AuthScreen,
  AuthSubmitButton,
  OAuthButtonStack,
  authInputCls,
} from "@/components/auth/auth-screen";
import { ReferralBanner } from "@/components/auth/referral-banner";
import {
  buildConsentPath,
  persistReferralContext,
  type ReferralTrack,
} from "@/lib/referral/context";
import {
  registerUniversityStudent,
  registerWWContributor,
  resolveStudentInvite,
  resolveWWContributorInvite,
  validateUniversityStudentInvite,
  validateWWContributorInvite,
} from "@/lib/admin/mocks/partnerships-service";
import { splitDisplayName } from "@/lib/admin/university-student-invite";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
  enterprise: "/enterprise/dashboard",
  reviewer: "/enterprise/reviewer",
  mentor: "/mentor/dashboard",
  contributor: "/contributor/dashboard",
};

export default function RegisterPage() {
  return (
    <React.Suspense fallback={null}>
      <RegisterScreen />
    </React.Suspense>
  );
}

function RegisterScreen() {
  const router = useRouter();
  const sp = useSearchParams();
  const ref = sp.get("ref") ?? undefined;
  const track = sp.get("track") ?? undefined;
  const invite = sp.get("invite") ?? undefined;

  const studentInvite = React.useMemo(
    () => (invite ? resolveStudentInvite(invite) : null),
    [invite],
  );

  const wwContributorInvite = React.useMemo(
    () => (invite ? resolveWWContributorInvite(invite) : null),
    [invite],
  );

  const personalInvite = studentInvite ?? wwContributorInvite;

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [oauthBusy, setOauthBusy] = React.useState<"google" | "microsoft" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!personalInvite) return;
    const name = studentInvite?.student.name ?? wwContributorInvite?.contributor.name ?? "";
    const { firstName: fn, lastName: ln } = splitDisplayName(name);
    setFirstName(fn);
    setLastName(ln);
    setEmail(studentInvite?.student.email ?? wwContributorInvite?.contributor.email ?? "");
  }, [personalInvite, studentInvite, wwContributorInvite]);

  const partnerInviteValid =
    (track !== "student" && track !== "women_wf") ||
    (!!ref &&
      !!invite &&
      ((track === "student" &&
        !!studentInvite &&
        studentInvite.university.id === ref) ||
        (track === "women_wf" &&
          !!wwContributorInvite &&
          wwContributorInvite.partner.id === ref)));

  const isPartnerInviteFlow = (track === "student" || track === "women_wf") && !!ref;

  const strong = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd);
  const canSubmit =
    partnerInviteValid &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 1 &&
    email.includes("@") &&
    strong &&
    agreed &&
    !submitting;

  const subtitle =
    track === "student"
      ? "Referred through a university partner — we'll route you through student-track onboarding."
      : track === "women_wf"
        ? "Referred through a women-workforce partner — supported onboarding awaits."
        : "Set up your account in under a minute with email or SSO.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      if (ref && track === "student" && invite) {
        const pre = validateUniversityStudentInvite(ref, {
          email: email.trim().toLowerCase(),
          inviteToken: invite,
        });
        if (!pre.ok) throw new Error(pre.error);
      }
      if (ref && track === "women_wf" && invite) {
        const pre = validateWWContributorInvite(ref, {
          email: email.trim().toLowerCase(),
          inviteToken: invite,
        });
        if (!pre.ok) throw new Error(pre.error);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password: pwd,
          track: track ?? "freelancer",
          referralCode: ref,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string; detail?: string };
        const msg = body.detail ?? body.message ?? "Couldn't create your account. Try again.";
        if (res.status === 409) {
          throw new Error("An account with this email already exists — sign in instead.");
        }
        throw new Error(msg);
      }

      if (ref && (track === "student" || track === "women_wf")) {
        persistReferralContext(ref, track as ReferralTrack, invite);
      }
      if (ref && track === "student" && invite) {
        const result = registerUniversityStudent(ref, {
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          inviteToken: invite,
        });
        if (!result.ok) {
          throw new Error(result.error);
        }
      }
      if (ref && track === "women_wf" && invite) {
        const result = registerWWContributor(ref, {
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          inviteToken: invite,
        });
        if (!result.ok) {
          throw new Error(result.error);
        }
      }

      const signed = await signIn("local-credentials", {
        email: email.trim().toLowerCase(),
        password: pwd,
        redirect: false,
      });
      if (signed && !signed.error) {
        const session = await (await fetch("/api/auth/session", { cache: "no-store" })).json();
        const role = (session as { user?: { role?: string } } | null)?.user?.role ?? "contributor";
        if (role === "contributor") {
          router.push(buildConsentPath(ref, track, invite));
          return;
        }
        router.push(ROLE_HOME[role] ?? buildConsentPath(ref, track, invite));
        return;
      }
      router.push("/auth/activate?pending=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onOauth(provider: "google" | "microsoft") {
    setError(null);
    setOauthBusy(provider);
    const idp = provider === "google" ? "google" : "microsoft-entra-id";
    if (ref && (track === "student" || track === "women_wf")) {
      persistReferralContext(ref, track as ReferralTrack, invite);
    }
    await signIn(idp, { callbackUrl: buildConsentPath(ref, track, invite) });
    setOauthBusy(null);
  }

  return (
    <AuthScreen
      title="Create account"
      subtitle={subtitle}
      footer={
        <>
          Already have an account? <AuthHeaderLink href="/auth/login">Sign in</AuthHeaderLink>
        </>
      }
    >
      <div className="space-y-5">
        <ReferralBanner />

        {isPartnerInviteFlow ? (
          <p className="font-body text-[11.5px] text-text-secondary text-center">
            {track === "student"
              ? "University invites use email registration so we can verify your cohort email."
              : "Partner invites use email registration so we can verify your cohort email."}
          </p>
        ) : (
          <>
            <OAuthButtonStack
              onGoogle={() => onOauth("google")}
              onMicrosoft={() => onOauth("microsoft")}
              googleBusy={oauthBusy === "google"}
              microsoftBusy={oauthBusy === "microsoft"}
              disabled={submitting}
              googleLabel="Sign up with Google"
              microsoftLabel="Sign up with Microsoft"
            />
            <AuthDivider />
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-error-border bg-error-subtle px-3.5 py-2.5 font-body text-[12.5px] text-error-text"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <AuthField label="First name" htmlFor="register-first">
              <input
                id="register-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={authInputCls}
                placeholder="Anita"
                autoComplete="given-name"
                required
              />
            </AuthField>
            <AuthField label="Last name" htmlFor="register-last">
              <input
                id="register-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={authInputCls}
                placeholder="Ramesh"
                autoComplete="family-name"
                required
              />
            </AuthField>
          </div>

          <AuthField
            label={
              isPartnerInviteFlow
                ? track === "student"
                  ? "University email"
                  : "Partner email"
                : "Work email"
            }
            htmlFor="register-email"
          >
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!personalInvite}
              className={cn(authInputCls, personalInvite && "bg-bg-subtle cursor-default")}
              placeholder={track === "student" ? "you@university.edu" : "you@partner.org"}
              autoComplete="email"
              required
            />
            {personalInvite && (
              <p className="mt-1 font-body text-[11px] text-text-secondary">
                Locked to your personal invite — register with this address.
              </p>
            )}
          </AuthField>

          <AuthField label="Password" htmlFor="register-password">
            <div className="relative">
              <input
                id="register-password"
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className={cn(authInputCls, "pr-10")}
                placeholder="8+ chars, mixed case, number"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-foreground transition-colors"
              >
                {showPwd ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                )}
              </button>
            </div>
            {pwd && !strong && (
              <p className="mt-1.5 font-body text-[11.5px] text-warning-text">
                Use at least 8 characters with upper + lowercase letters and a number.
              </p>
            )}
          </AuthField>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-stroke text-brand focus:ring-brand shrink-0"
            />
            <span className="font-body text-[12px] text-text-secondary leading-relaxed">
              I agree to the{" "}
              <Link
                href="/legal/terms"
                className="text-brand-emphasis hover:underline underline-offset-2"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/privacy"
                className="text-brand-emphasis hover:underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <AuthSubmitButton disabled={!canSubmit} loading={submitting}>
            Create account
          </AuthSubmitButton>
        </form>

        <AuthLegalFooter />
      </div>
    </AuthScreen>
  );
}
