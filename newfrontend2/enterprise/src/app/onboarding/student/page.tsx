"use client";

/**
 * Onboarding · Student track — requires a valid personal university invite.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, AlertCircle } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  listAdminUniversities,
  confirmUniversityStudentEnrollment,
  resolveStudentInvite,
} from "@/lib/admin/mocks/partnerships-service";
import { readReferralContext } from "@/lib/referral/context";
import { patchOnboardingDraft } from "@/lib/contributor/onboarding-draft";
import { nextStepPath } from "@/lib/contributor/onboarding-steps";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";

export default function StudentOnboardingPage() {
  return (
    <React.Suspense fallback={null}>
      <Inner />
    </React.Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { track, steps } = useOnboardingTrack();
  const universities = listAdminUniversities();
  const refId = sp.get("ref") ?? readReferralContext()?.ref;
  const inviteToken = sp.get("invite") ?? readReferralContext()?.invite;
  const studentInvite = inviteToken ? resolveStudentInvite(inviteToken) : null;
  const referredUni = studentInvite?.university ?? (refId ? universities.find((u) => u.id === refId) : undefined);

  const [studentId, setStudentId] = React.useState("");
  const [program, setProgram] = React.useState("");
  const [supervisor, setSupervisor] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!studentInvite || !inviteToken) {
      router.replace("/auth/register?error=student-invite-required");
      return;
    }
    if (refId && studentInvite.university.id !== refId) {
      router.replace("/auth/register?error=student-invite-required");
    }
  }, [studentInvite, inviteToken, refId, router]);

  React.useEffect(() => {
    if (!studentInvite) return;
    if (studentInvite.student.rollNumber) setStudentId(studentInvite.student.rollNumber);
    if (studentInvite.student.programme) setProgram(studentInvite.student.programme);
    if (studentInvite.student.supervisorEmail) setSupervisor(studentInvite.student.supervisorEmail);
  }, [studentInvite]);

  const uni = referredUni;
  const can =
    !!uni &&
    !!inviteToken &&
    !!studentInvite &&
    studentId.trim().length >= 3 &&
    program.trim().length >= 2 &&
    supervisor.length > 0;

  async function onContinue() {
    if (!can || !uni || !inviteToken) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const session = await fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()) as {
        user?: { name?: string | null; email?: string | null };
      };
      const email = session.user?.email?.trim().toLowerCase() ?? "";
      const name = session.user?.name?.trim() || "Student";
      if (!email) {
        router.replace("/auth/login");
        return;
      }
      const updated = confirmUniversityStudentEnrollment(uni.id, {
        name,
        email,
        rollNumber: studentId.trim(),
        programme: program.trim(),
        supervisorEmail: supervisor,
        inviteToken,
      });
      if (!updated) {
        throw new Error("Could not save university details — check you used your invite email to register.");
      }
      patchOnboardingDraft({
        track: "student",
        degree: program.trim(),
        branch: uni.name,
        programme: program.trim(),
        studentId: studentId.trim(),
        supervisorEmail: supervisor,
        supervisorName:
          uni.supervisors.find((s) => s.email === supervisor)?.name ?? undefined,
        country: uni.country,
      });
      const dest = nextStepPath(track, "/onboarding/student");
      if (dest) router.push(dest);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!studentInvite || !uni) {
    return null;
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Student track"
        title="Your university details"
        subtitle="Helps us pair you with your supervisor and apply your university's academic-credit rules."
      >
        <OnboardingProgress steps={steps} current="/onboarding/student" />

        <div className="rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-emphasis">
            <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">University</h2>
          </div>
          <div>
            <FieldLabel htmlFor="uni">Institution</FieldLabel>
            <input
              id="uni"
              readOnly
              value={`${uni.name} · ${uni.country}`}
              className={`${inputCls} bg-bg-subtle cursor-default`}
            />
            <p className="mt-1 font-body text-[11.5px] text-text-secondary">
              Locked to your personal invite for {studentInvite.student.email}.
            </p>
          </div>
          <div>
            <FieldLabel htmlFor="sid">Student / roll number</FieldLabel>
            <input id="sid" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls} placeholder="e.g. CS2026-148" required />
          </div>
          <div>
            <FieldLabel htmlFor="program">Programme</FieldLabel>
            <input id="program" value={program} onChange={(e) => setProgram(e.target.value)} className={inputCls} placeholder="B.Tech Computer Science, Year 3" required />
          </div>
          <div>
            <FieldLabel htmlFor="sup">Supervisor</FieldLabel>
            <select id="sup" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} className={inputCls} required>
              <option value="">— select your supervisor —</option>
              {uni.supervisors.map((s, i) => (
                <option key={i} value={s.email}>{s.name} ({s.department})</option>
              ))}
            </select>
            {uni.supervisors.length === 0 && (
              <p className="mt-1 font-body text-[11.5px] text-warning-text flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 mt-0.5" strokeWidth={2} aria-hidden />
                No supervisors registered yet — ask your faculty coordinator to be added before you continue.
              </p>
            )}
          </div>
        </div>

        {formError && (
          <p role="alert" className="font-body text-[12px] text-error-text">{formError}</p>
        )}

        <PrimaryButton onClick={onContinue} disabled={!can || submitting}>{submitting ? "Saving…" : "Continue →"}</PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}
