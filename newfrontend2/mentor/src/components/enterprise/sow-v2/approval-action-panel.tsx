"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  useApproveSow,
  useRejectSow,
  useSendBackSow,
} from "@/lib/hooks/use-sow-v2";
import { SowApiError } from "@/lib/api/sow-v2";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { APPROVAL_STAGE_ORDER, type SowDetail, type SowStage } from "@/lib/sow/types";
import { stageLabel } from "./sow-status-badge";

type Mode = "approve" | "reject" | "send_back";

interface Props {
  sow: SowDetail;
}

/**
 * Shown only when the SOW is in approval. The current stage drives
 * the available actions:
 *   - Approve at current stage
 *   - Reject at current stage (terminal)
 *   - Send back to any earlier stage
 *
 * The route's per-stage permission gate catches users who land here
 * without authority; the panel surfaces that as a server-rejection
 * banner so the UI doesn't pretend to act.
 */
export function ApprovalActionPanel({ sow }: Props) {
  const { email, canActOnStage, canApproveStage } = useEnterpriseAccess();
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [comment, setComment] = React.useState("");
  const [sendBackTo, setSendBackTo] = React.useState<SowStage | "">("");
  const [error, setError] = React.useState<string | null>(null);

  const approve = useApproveSow(sow.id, email);
  const reject = useRejectSow(sow.id);
  const sendBack = useSendBackSow(sow.id);

  if (sow.status !== "approval" || !sow.stage) {
    return null;
  }

  const currentStage: SowStage = sow.stage;
  const earlierStages = APPROVAL_STAGE_ORDER.slice(
    0,
    APPROVAL_STAGE_ORDER.indexOf(currentStage),
  );
  const canDecide =
    currentStage === "platform"
      ? false
      : canActOnStage(sow.ownerId, currentStage);

  const reset = () => {
    setMode(null);
    setComment("");
    setSendBackTo("");
    setError(null);
  };

  const handleError = (e: unknown) => {
    if (e instanceof SowApiError) {
      setError(
        e.reason
          ? `${e.message} (${e.reason})`
          : e.message ?? `Request failed with ${e.status}`,
      );
    } else {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const submit = async () => {
    setError(null);
    try {
      if (mode === "approve") {
        await approve.mutateAsync({ stage: currentStage, comment: comment || undefined });
      } else if (mode === "reject") {
        if (!comment.trim()) {
          setError("A comment is required to reject");
          return;
        }
        await reject.mutateAsync({ stage: currentStage, comment });
      } else if (mode === "send_back") {
        if (!sendBackTo) {
          setError("Pick a stage to send back to");
          return;
        }
        if (!comment.trim()) {
          setError("A comment is required to send back");
          return;
        }
        await sendBack.mutateAsync({
          fromStage: currentStage,
          toStage: sendBackTo,
          comment,
        });
      }
      reset();
    } catch (e) {
      handleError(e);
    }
  };

  const pending = approve.isPending || reject.isPending || sendBack.isPending;

  if (!canDecide) {
    return (
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5">
        <p className="font-body text-[12px] text-text-secondary">
          {currentStage === "platform"
            ? "This is the Glimmora platform gate — handled outside the enterprise portal."
            : "You can't act on this gate. Its assigned enterprise reviewer (and not the SOW owner) decides."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-4">
      <div>
        <h3 className="font-body text-[13.5px] font-semibold text-foreground">
          Decision · {stageLabel(currentStage)} stage
        </h3>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">
          You&apos;re acting on version v{sow.activeVersion}. Decisions are
          audited and downstream stages are notified automatically.
        </p>
      </div>

      {mode === null && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setMode("approve")} disabled={pending}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode("send_back")}
            disabled={pending || earlierStages.length === 0}
          >
            Send back…
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setMode("reject")}
            disabled={pending}
          >
            Reject
          </Button>
        </div>
      )}

      {mode !== null && (
        <div className="space-y-3">
          {mode === "send_back" && (
            <div>
              <label className="block font-body text-[11.5px] font-semibold uppercase tracking-wide text-text-tertiary mb-1">
                Send back to
              </label>
              <select
                value={sendBackTo}
                onChange={(e) => setSendBackTo(e.target.value as SowStage | "")}
                className="w-full rounded-lg border border-stroke-subtle bg-surface px-3 py-2 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brown-300"
              >
                <option value="">Pick a stage…</option>
                {earlierStages.map((s) => (
                  <option key={s} value={s}>
                    {stageLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-body text-[11.5px] font-semibold uppercase tracking-wide text-text-tertiary mb-1">
              Comment {mode === "approve" ? "(optional)" : "(required)"}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={
                mode === "approve"
                  ? "Optional context for downstream approvers"
                  : "Explain what needs to change"
              }
              className="w-full rounded-lg border border-stroke-subtle bg-surface px-3 py-2 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brown-300"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 ring-1 ring-red-100 px-3 py-2 font-body text-[12.5px] text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={reset} disabled={pending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={pending}
              variant={
                mode === "reject"
                  ? "danger"
                  : mode === "send_back"
                    ? "outline"
                    : "primary"
              }
            >
              {pending
                ? "Working…"
                : mode === "approve"
                  ? "Confirm approve"
                  : mode === "reject"
                    ? "Confirm reject"
                    : "Confirm send back"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
