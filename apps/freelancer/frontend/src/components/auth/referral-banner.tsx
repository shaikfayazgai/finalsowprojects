"use client";

/**
 * Referral banner on /auth/register. Reads ?ref + ?track + ?invite from the URL.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { GraduationCap, HeartHandshake, CheckCircle2, AlertCircle } from "lucide-react";
import {
  resolvePartnerReferral,
  resolveStudentInvite,
  resolveWWContributorInvite,
} from "@/lib/admin/mocks/partnerships-service";

export function ReferralBanner() {
  return (
    <React.Suspense fallback={null}>
      <ReferralInner />
    </React.Suspense>
  );
}

function ReferralInner() {
  const sp = useSearchParams();
  const ref = sp.get("ref");
  const track = sp.get("track");
  const invite = sp.get("invite");

  const partner = React.useMemo(() => {
    if (!ref || !track) return null;
    return resolvePartnerReferral(ref, track);
  }, [ref, track]);

  const studentInvite = React.useMemo(() => {
    if (!invite) return null;
    return resolveStudentInvite(invite);
  }, [invite]);

  const wwInvite = React.useMemo(() => {
    if (!invite) return null;
    return resolveWWContributorInvite(invite);
  }, [invite]);

  const personalInvite = studentInvite ?? wwInvite;

  if (track === "student" && ref && !invite) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-warning-border bg-warning-subtle px-4 py-3 flex items-start gap-3"
      >
        <AlertCircle className="h-4 w-4 text-warning-text mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
        <div>
          <p className="font-body text-[12.5px] font-semibold text-foreground">Personal invite required</p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
            Ask your university coordinator for your individual registration link — a shared class link is not supported.
          </p>
        </div>
      </section>
    );
  }

  if (track === "women_wf" && ref && !invite) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-warning-border bg-warning-subtle px-4 py-3 flex items-start gap-3"
      >
        <AlertCircle className="h-4 w-4 text-warning-text mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
        <div>
          <p className="font-body text-[12.5px] font-semibold text-foreground">Personal invite required</p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
            Ask your partner organisation for your individual registration link — a shared org link is not supported.
          </p>
        </div>
      </section>
    );
  }

  if (invite && !personalInvite) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-3"
      >
        <AlertCircle className="h-4 w-4 text-error-text mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12.5px] text-error-text">This invite link is invalid or has expired.</p>
      </section>
    );
  }

  if (!partner) return null;

  const Icon = partner.track === "student" ? GraduationCap : HeartHandshake;
  const trackLabel = partner.track === "student" ? "Student track" : "Women workforce track";
  const inviteName = studentInvite?.student.name ?? wwInvite?.contributor.name;
  const inviteEmail = studentInvite?.student.email ?? wwInvite?.contributor.email;

  return (
    <section
      role="status"
      className="rounded-xl border border-stroke bg-surface px-4 py-3 flex items-start gap-3"
    >
      <div className="h-8 w-8 rounded-full bg-brand text-on-brand inline-flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-body text-[12.5px] font-semibold text-foreground">
            {personalInvite && inviteName ? (
              <>
                Hi <span className="text-brand-emphasis">{inviteName.split(" ")[0]}</span>
                {" — "}
                <span className="text-brand-emphasis">{partner.name}</span> invited you
              </>
            ) : (
              <>
                You&apos;ve been invited by <span className="text-brand-emphasis">{partner.name}</span>
              </>
            )}
          </p>
          <CheckCircle2 className="h-3.5 w-3.5 text-success-text shrink-0" strokeWidth={2} aria-hidden />
        </div>
        <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
          {personalInvite && inviteEmail ? (
            <>
              Personal invite for <strong className="font-semibold text-foreground">{inviteEmail}</strong>
              {" · "}
              {trackLabel} onboarding
            </>
          ) : (
            <>
              We&apos;ll route you through the <strong className="font-semibold text-foreground">{trackLabel}</strong> onboarding.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
