/**
 * Enterprise profile v3 overview — derives the operator's decisions,
 * interventions, and activity from the contributor task store and
 * delivery store. Profile-editable fields come from the profile store.
 */

"use client";

import * as React from "react";
import { useContributorTasksStore } from "@/lib/stores/contributor-tasks-store";
import { useDeliveryStoreV3 } from "@/lib/stores/delivery-store-v3";
import { useProfileStoreV3 } from "@/lib/stores/profile-store-v3";
import {
  DEFAULT_OPERATOR_IDENTITY,
  DEFAULT_SCOPE,
  type DecisionRecord,
  type InterventionSummaryRow,
  type OperatorIdentity,
  type ProfileActivityEvent,
  type ProfileEditableState,
  type ProfileSurface,
  type ScopeOfAuthority,
} from "@/types/profile";

export interface ProfileOverviewV3 {
  identity: OperatorIdentity;
  editable: ProfileEditableState;
  scope: ScopeOfAuthority;
  decisions: DecisionRecord[];
  interventions: InterventionSummaryRow[];
  activity: ProfileActivityEvent[];
  kpis: {
    decisions7d: number;
    decisions30d: number;
    accepted: number;
    reworked: number;
    escalated: number;
    interventions7d: number;
    interventions30d: number;
    holdsRaised: number;
    holdsReleased: number;
  };
  tenureDays: number;
}

function hoursSince(raw?: string): number {
  if (!raw) return Infinity;
  const t = new Date(raw).getTime();
  if (isNaN(t)) return Infinity;
  return Math.max(0, (Date.now() - t) / 36e5);
}

export function useProfileOverviewV3(): ProfileOverviewV3 {
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  const metaById = useDeliveryStoreV3((s) => s.metaById);
  const editable = useProfileStoreV3((s) => s.editable);

  return React.useMemo(() => {
    const identity: OperatorIdentity = {
      ...DEFAULT_OPERATOR_IDENTITY,
      displayName: editable.displayName || DEFAULT_OPERATOR_IDENTITY.displayName,
      initials: editable.initials || DEFAULT_OPERATOR_IDENTITY.initials,
      title: editable.title || DEFAULT_OPERATOR_IDENTITY.title,
      department: editable.department || DEFAULT_OPERATOR_IDENTITY.department,
      timezone: editable.timezone || DEFAULT_OPERATOR_IDENTITY.timezone,
      phone: editable.phone,
    };

    // Derive decisions from tasks the operator has decided on.
    const tasks = Object.values(tasksById);
    const decisions: DecisionRecord[] = [];
    tasks.forEach((task) => {
      if (task.enterpriseDecisionAt) {
        const action: DecisionRecord["action"] = task.enterpriseAccepted
          ? "accepted"
          : "reworked";
        decisions.push({
          id: `dec-${task.id}`,
          decidedAt: task.enterpriseDecisionAt,
          action,
          subject: task.title,
          surface: "review" as ProfileSurface,
          taskId: task.id,
          outcome: action === "accepted" ? "Released to billing" : "Returned for revision",
        });
      }
    });

    // Derive interventions from delivery store metadata.
    const interventions: InterventionSummaryRow[] = [];
    Object.values(metaById).forEach((meta) => {
      const task = tasksById[meta.taskId];
      const title = task?.title ?? `Delivery ${meta.taskId}`;
      meta.interventions.forEach((iv) => {
        interventions.push({
          id: iv.id,
          at: iv.at,
          kind: iv.kind,
          subject: title,
          surface: "delivery_tracking" as ProfileSurface,
          taskId: iv.taskId,
          cosignActor: iv.cosignActor,
          note: iv.note,
        });
      });
    });

    decisions.sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1));
    interventions.sort((a, b) => (a.at < b.at ? 1 : -1));

    const accepted = decisions.filter((d) => d.action === "accepted").length;
    const reworked = decisions.filter((d) => d.action === "reworked").length;
    const escalated = interventions.filter((iv) => iv.kind === "escalated").length;
    const holdsRaised = interventions.filter((iv) => iv.kind === "held").length;
    const holdsReleased = interventions.filter((iv) => iv.kind === "released").length;

    const decisions7d = decisions.filter((d) => hoursSince(d.decidedAt) < 24 * 7).length;
    const decisions30d = decisions.filter((d) => hoursSince(d.decidedAt) < 24 * 30).length;
    const interventions7d = interventions.filter((iv) => hoursSince(iv.at) < 24 * 7).length;
    const interventions30d = interventions.filter((iv) => hoursSince(iv.at) < 24 * 30).length;

    // Build activity feed — interleave decisions + interventions.
    const activity: ProfileActivityEvent[] = [
      ...decisions.slice(0, 30).map((d) => ({
        id: `act-${d.id}`,
        at: d.decidedAt,
        kind: "decision" as const,
        title:
          d.action === "accepted"
            ? "Accepted delivery"
            : d.action === "reworked"
              ? "Returned for rework"
              : "Decision recorded",
        detail: d.subject,
        surface: d.surface,
        taskId: d.taskId,
        tone:
          d.action === "accepted"
            ? ("success" as const)
            : d.action === "reworked"
              ? ("warning" as const)
              : ("info" as const),
      })),
      ...interventions.slice(0, 30).map((iv) => ({
        id: `act-${iv.id}`,
        at: iv.at,
        kind: "intervention" as const,
        title: labelForInterventionKind(iv.kind),
        detail: iv.subject,
        surface: iv.surface,
        taskId: iv.taskId,
        tone:
          iv.kind === "escalated"
            ? ("warning" as const)
            : iv.kind === "released"
              ? ("success" as const)
              : iv.kind === "held"
                ? ("warning" as const)
                : ("info" as const),
      })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));

    const tenureDays = Math.max(
      0,
      Math.floor((Date.now() - new Date(identity.joinedAt).getTime()) / 86_400_000),
    );

    return {
      identity,
      editable,
      scope: DEFAULT_SCOPE,
      decisions,
      interventions,
      activity,
      kpis: {
        decisions7d,
        decisions30d,
        accepted,
        reworked,
        escalated,
        interventions7d,
        interventions30d,
        holdsRaised,
        holdsReleased,
      },
      tenureDays,
    };
  }, [tasksById, metaById, editable]);
}

function labelForInterventionKind(kind: InterventionSummaryRow["kind"]): string {
  switch (kind) {
    case "reassigned":
      return "Reassigned reviewer";
    case "sla_overridden":
      return "Overrode SLA";
    case "convened":
      return "Convened async review";
    case "held":
      return "Placed on hold";
    case "released":
      return "Released hold";
    case "escalated":
      return "Escalated";
    case "withdrawn":
      return "Withdrew escalation";
  }
}
