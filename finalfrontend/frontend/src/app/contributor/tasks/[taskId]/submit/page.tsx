"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { SubmissionHeader } from "./v2-components/submission-header";
import { ReadinessValidation } from "./v2-components/readiness-validation";
import { SubmissionPreview } from "./v2-components/submission-preview";
import { AiSubmissionCheck } from "./v2-components/ai-submission-check";
import { SubmissionConfirmation } from "./v2-components/submission-confirmation";
import { SubmissionFlowFooter } from "./v2-components/submission-footer";
import { useContributorTasksStore } from "@/lib/stores/contributor-tasks-store";
import { adaptTaskToWorkroom } from "@/lib/contributor/task-adapters";
import { TaskNotFound } from "@/app/contributor/_shared/task-not-found";

/**
 * Contributor Submission Flow — `/contributor/tasks/[taskId]/submit`.
 *
 * Reads the active task from the unified contributor tasks store.
 * On submit, mutates store state to `under_review` (or to next revision
 * round if this is a resubmission) and routes back to the workroom so
 * the contributor immediately sees the new state.
 */
export default function ContributorSubmissionPage() {
  const params = useParams();
  const taskId = String(params?.taskId ?? "");
  const router = useRouter();

  const storeTask = useContributorTasksStore((s) => s.tasksById[taskId]);
  const submitTask = useContributorTasksStore((s) => s.submitTask);
  const resubmitTask = useContributorTasksStore((s) => s.resubmitTask);
  const saveDraft = useContributorTasksStore((s) => s.saveDraft);

  const [note, setNote] = React.useState("");
  const [declarationChecked, setDeclarationChecked] = React.useState(false);
  const [shareWorkingNotes, setShareWorkingNotes] = React.useState(false);

  if (!storeTask) {
    return <TaskNotFound taskId={taskId} context="submission" />;
  }

  const task = adaptTaskToWorkroom(storeTask);
  const isResubmission =
    storeTask.reworkRound > 1 ||
    storeTask.revisionSubState === "ready_for_resubmission" ||
    storeTask.state === "revision_requested";

  const stage: "prepare" | "review" | "confirm" = declarationChecked
    ? "confirm"
    : note.length > 0
    ? "review"
    : "prepare";

  const handleSubmit = () => {
    if (isResubmission) {
      resubmitTask(taskId);
    } else {
      submitTask(taskId);
    }
    router.push(`/contributor/tasks/${taskId}`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] pb-4">
      <SubmissionHeader task={task} stage={stage} />

      <div className="mt-5 space-y-4 flex-1">
        <ReadinessValidation task={task} />
        <SubmissionPreview task={task} />
        <AiSubmissionCheck task={task} />
        <SubmissionConfirmation
          task={task}
          note={note}
          onNoteChange={setNote}
          declarationChecked={declarationChecked}
          onDeclarationChange={setDeclarationChecked}
          shareWorkingNotes={shareWorkingNotes}
          onShareNotesChange={setShareWorkingNotes}
        />
      </div>

      <SubmissionFlowFooter
        task={task}
        declarationChecked={declarationChecked}
        onSubmit={handleSubmit}
        onSaveDraft={() => saveDraft(taskId, storeTask.draftNotes)}
      />
    </div>
  );
}
