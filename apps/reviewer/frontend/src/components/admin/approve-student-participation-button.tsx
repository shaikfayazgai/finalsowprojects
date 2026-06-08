"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { approveStudentParticipationAction } from "@/lib/actions/student-supervision";
import type { MockUniversityStudent } from "@/mocks/admin/partnerships";

export function ApproveStudentParticipationButton({
  universityId,
  student,
  readOnly,
  onDone,
}: {
  universityId: string;
  student: MockUniversityStudent;
  readOnly?: boolean;
  onDone?: (msg: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);

  const canApprove =
    !readOnly &&
    (student.status === "onboarding" || student.status === "registered") &&
    !!student.supervisorEmail;

  if (!canApprove) return null;

  async function approve() {
    setLoading(true);
    try {
      const result = await approveStudentParticipationAction(
        universityId,
        student.email,
      );
      if (!result.success) {
        onDone?.(result.error);
        return;
      }
      onDone?.(`Participation approved for ${student.name}.`);
    } catch {
      onDone?.("Could not approve participation. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={approve}
      className={cn(
        "inline-flex items-center gap-1 h-7 px-2 rounded-md border font-body text-[11px] font-semibold transition-colors duration-fast",
        "border-success-border bg-success-subtle text-success-text hover:opacity-90",
      )}
    >
      <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
      {loading ? "Approving…" : "Approve participation"}
    </button>
  );
}
