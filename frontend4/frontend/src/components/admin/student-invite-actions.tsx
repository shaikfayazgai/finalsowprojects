"use client";

/**
 * Per-student invite actions on the university cohort table.
 */

import * as React from "react";
import Link from "next/link";
import { Copy, Check, Mail, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  buildStudentInviteMailto,
  buildUniversityStudentInviteUrl,
} from "@/lib/admin/university-student-invite";
import { markUniversityStudentInviteSent } from "@/lib/admin/mocks/partnerships-service";
import type { MockUniversity, MockUniversityStudent } from "@/mocks/admin/partnerships";

export function StudentInviteActions({
  university,
  student,
  readOnly,
  onSent,
}: {
  university: MockUniversity;
  student: MockUniversityStudent;
  readOnly?: boolean;
  onSent?: (msg: string) => void;
}) {
  const [origin, setOrigin] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin
    ? buildUniversityStudentInviteUrl(origin, university.id, student.inviteToken)
    : "";

  function recordSent() {
    markUniversityStudentInviteSent(university.id, student.id);
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      recordSent();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onSent?.("Personal invite link copied.");
    } catch {
      onSent?.("Couldn't copy — select the link manually.");
    }
  }

  function sendInvite() {
    if (!inviteUrl || readOnly) return;
    recordSent();
    const mailto = buildStudentInviteMailto({
      studentName: student.name,
      studentEmail: student.email,
      universityName: university.name,
      inviteUrl,
      fromEmail: university.leadContact.email,
    });
    window.location.href = mailto;
    onSent?.(`Invite email opened for ${student.name}.`);
  }

  if (student.status === "invited") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={readOnly || !origin}
          onClick={sendInvite}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2 rounded-md font-body text-[11px] font-semibold transition-colors duration-fast",
            readOnly
              ? "text-text-tertiary cursor-not-allowed"
              : "bg-brand text-on-brand hover:bg-brand-hover",
          )}
        >
          <Mail className="h-3 w-3" strokeWidth={2} aria-hidden />
          Send invite
        </button>
        <button
          type="button"
          disabled={readOnly || !origin}
          onClick={copyLink}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2 rounded-md border font-body text-[11px] font-semibold transition-colors duration-fast",
            copied
              ? "border-success-border bg-success-subtle text-success-text"
              : "border-stroke bg-surface text-foreground hover:bg-surface-hover",
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" strokeWidth={2} aria-hidden />
              Copy link
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-body text-[11px] text-text-tertiary">
        {student.registeredAt
          ? `Registered ${new Date(student.registeredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
          : "—"}
      </span>
      {(student.status === "onboarding" || student.status === "active") && (
        <Link
          href={`/admin/kyc?track=Student&email=${encodeURIComponent(student.email)}`}
          className="inline-flex items-center gap-1 font-body text-[11px] font-semibold text-brand-emphasis hover:text-brand"
        >
          KYC <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
        </Link>
      )}
    </div>
  );
}
