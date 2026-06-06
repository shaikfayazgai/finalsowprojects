"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { AppShell } from "@/components/layout";
import { contributorNav } from "@/lib/config/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";
import { fetchProfileCompletion } from "@/lib/api/contributor";
import OnboardingModal from "./onboarding/components/OnboardingModal";

export default function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The portal's public auth pages (login / signup / forgot / reset / setup)
  // render their own full-screen shell — skip the guard + AppShell for them.
  // Hooks still run unconditionally; we branch the render at the end.
  const isPublicAuth = /^\/contributor\/(login|signup|forgot-password|reset-password|setup-password|verify-email)$/.test(pathname);
  useRoleGuard(isPublicAuth ? [] : ["contributor"]);
  const router = useRouter();
  const { data: session, status } = useSession();
  const isOnboardingComplete = useAuthStore((s) => s.isOnboardingComplete);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const isOnboarding = pathname.startsWith("/contributor/onboarding");

  const provider = (session?.user as { provider?: string })?.provider;
  const isSSO = provider === "google" || provider === "microsoft-entra-id";
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  // Approval gate (Women in Tech self-applicants): they CAN sign in while
  // pending/rejected, but see ONLY their status + logout — no dashboard, no
  // profile, nothing else — until a Super Admin approves.
  const approvalStatus =
    (session?.user as { approvalStatus?: string } | undefined)?.approvalStatus ?? "approved";
  const needsApproval = status === "authenticated" && approvalStatus !== "approved";

  // Manual (credentials) registrations complete their profile during the 4-step form,
  // so mark onboarding as done immediately — wizard is only for SSO users.
  useEffect(() => {
    if (status === "authenticated" && !isSSO && !isOnboardingComplete) {
      setOnboardingComplete(true);
    }
  }, [status, isSSO, isOnboardingComplete, setOnboardingComplete]);

  // ── Hard-block profile gate ──────────────────────────────────────────────
  // Contributor-umbrella personas must reach 100% profile completeness before
  // any dashboard/work route. The completion flow + onboarding are exempt so
  // the user can actually fill it in. (Mentor/Enterprise/Super Admin live in
  // other portals and never hit this layout, so they're naturally exempt.)
  const isCompletionFlow = pathname.startsWith("/contributor/profile/complete");
  const isVerifyFlow = pathname.startsWith("/contributor/verify-email");
  const gateExempt = isPublicAuth || isOnboarding || isCompletionFlow || isVerifyFlow;

  // Manual (credentials) signups must verify their email via OTP before the
  // dashboard. SSO users (Google/Microsoft) are already verified, so exempt.
  const emailVerified = (session?.user as { emailVerified?: boolean } | undefined)?.emailVerified;
  const needsEmailVerify =
    status === "authenticated" && !isSSO && emailVerified === false && !gateExempt;

  const [gateChecked, setGateChecked] = useState(false);
  const [gateBlocked, setGateBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Unapproved applicants never run the profile/verify gates — they only see
    // the status screen (handled in the render branch below).
    if (status !== "authenticated" || !token || gateExempt || needsApproval) { setGateChecked(true); return; }
    // 1) Email verification gate first.
    if (needsEmailVerify) {
      setGateBlocked(true);
      router.replace("/contributor/verify-email");
      return;
    }
    // 2) Then the 100% profile-completion gate.
    setGateChecked(false);
    fetchProfileCompletion(token)
      .then((c) => {
        if (cancelled) return;
        if (!c.complete) { setGateBlocked(true); router.replace("/contributor/profile/complete"); }
        else setGateChecked(true);
      })
      .catch(() => { if (!cancelled) setGateChecked(true); }); // fail-open on API error
    return () => { cancelled = true; };
  }, [status, token, gateExempt, needsApproval, needsEmailVerify, pathname, router]);

  const showOnboarding = status === "authenticated" && isSSO && (isOnboarding || !isOnboardingComplete);

  // Public login page renders its own full-screen branded shell.
  if (isPublicAuth) return <>{children}</>;

  // Approval gate: an unapproved applicant sees ONLY their status + logout.
  // Nothing else loads — no shell, no dashboard, no profile.
  if (needsApproval) {
    return <ApprovalStatusScreen status={approvalStatus} email={session?.user?.email ?? ""} />;
  }

  // While the gate verdict is pending (or we're redirecting an incomplete
  // profile), don't flash the dashboard.
  if (!gateExempt && (!gateChecked || gateBlocked)) {
    return <div className="flex min-h-screen items-center justify-center bg-beige-50 text-sm text-beige-500">Loading…</div>;
  }

  return (
    <>
      <AppShell config={contributorNav}>
        {isOnboarding ? null : children}
      </AppShell>
      {showOnboarding && <OnboardingModal />}
    </>
  );
}

/**
 * Status-only screen for Women in Tech applicants awaiting (or denied) approval.
 * They can sign in but see nothing except their application status + a logout
 * button until a Super Admin approves them.
 */
function ApprovalStatusScreen({ status, email }: { status: string; email: string }) {
  const rejected = status === "rejected";
  return (
    <div className="flex min-h-screen items-center justify-center bg-beige-50 p-6">
      <div className="w-full max-w-[460px] space-y-7 text-center">
        <div className="relative mx-auto h-9 w-36">
          <Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain" />
        </div>

        <div className={cnLite(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
          rejected ? "bg-red-50 text-red-500" : "bg-gold-50 text-gold-600",
        )}>
          {rejected ? <XCircle className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-brown-950">
            {rejected ? "Application not approved" : "Application under review"}
          </h1>
          <p className="text-sm text-beige-500">
            {rejected
              ? "Your Women in Tech application wasn't approved at this time. If you believe this is a mistake, please contact support."
              : "Thanks for applying to the Women in Tech track. Our team is reviewing your application — you'll get an email the moment it's approved, and your dashboard will unlock here."}
          </p>
          {email && <p className="text-xs text-beige-400">Signed in as {email}</p>}
        </div>

        {!rejected && (
          <ol className="mx-auto max-w-[320px] space-y-2.5 text-left">
            <StatusStep done label="Application submitted" />
            <StatusStep done label="Email verified" />
            <StatusStep label="Super Admin review" current />
            <StatusStep label="Dashboard access" />
          </ol>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-beige-200 bg-white px-6 text-sm font-semibold text-brown-900 hover:bg-beige-50"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}

function StatusStep({ label, done, current }: { label: string; done?: boolean; current?: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-forest-600" />
      ) : current ? (
        <Clock className="h-4 w-4 shrink-0 text-gold-600" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border border-beige-300" />
      )}
      <span className={done ? "text-brown-800" : current ? "font-medium text-brown-900" : "text-beige-400"}>
        {label}
      </span>
    </li>
  );
}

// Tiny local class joiner (avoids importing cn just for this file's footer).
function cnLite(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
