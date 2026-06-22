"use client";

/**
 * Marketplace assignment — popup. Publish a task to the skilled pool, review
 * the interested contributors, and select ONE. The selected contributor is
 * assigned; others are marked not selected.
 */

import * as React from "react";
import { Megaphone, Check, Users, Loader2, CheckCircle2, Hourglass } from "lucide-react";
import {
  getMarketTask,
  listInterested,
  marketplaceOverlay,
  publishTaskToMarket,
  selectContributor,
} from "@/lib/enterprise/mocks/task-marketplace";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { assignProjectTaskMock } from "@/lib/projects/projects-mock";
import { GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { AdminModal, Chip, primaryBtnClass, primaryStyle, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  requiredSkills: string[];
  effortHours: number;
  onAssigned?: () => void;
}

function Avatar({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <span className="grid place-items-center h-9 w-9 rounded-full bg-bg-subtle border border-stroke-subtle font-body text-[12px] font-semibold text-text-secondary shrink-0">
      {initials}
    </span>
  );
}

function StatePanel({ icon: Icon, tone, title, description }: { icon: typeof Megaphone; tone: "ai" | "success"; title: string; description: string }) {
  const color = tone === "success" ? "var(--color-success-text)" : "var(--color-ai-text)";
  const soft = tone === "success" ? "var(--color-success-subtle)" : "var(--color-ai-surface)";
  return (
    <div className="rounded-lg border border-stroke-subtle px-4 py-6 text-center">
      <span className="grid place-items-center h-10 w-10 rounded-xl mx-auto mb-2.5" style={{ background: soft, color }} aria-hidden>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

export function MarketplaceAssignDrawer({
  open,
  onClose,
  projectId,
  projectName,
  taskId,
  taskTitle,
  requiredSkills,
  effortHours,
  onAssigned,
}: Props) {
  useOverlayVersion(marketplaceOverlay);
  const market = getMarketTask(taskId);
  const interested = listInterested(taskId);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPicked(null);
      setDone(false);
      setBusy(false);
    }
  }, [open, taskId]);

  const published = market?.status === "open" || market?.status === "assigned";

  const onPublish = () => {
    publishTaskToMarket({
      taskId,
      projectId,
      projectName,
      title: taskTitle,
      requiredSkills,
      estimatedHours: effortHours,
    });
  };

  const onSelect = () => {
    if (!picked) return;
    setBusy(true);
    const winner = selectContributor(taskId, picked);
    if (winner) {
      assignProjectTaskMock(projectId, taskId, {
        id: winner.contributorId,
        name: winner.contributorName,
        email: winner.contributorEmail,
      });
    }
    setBusy(false);
    setDone(true);
    onAssigned?.();
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={Megaphone}
      tone="ai"
      title="Assign task"
      description={`${projectName} · ${taskTitle}`}
      footer={
        done ? (
          <button type="button" onClick={onClose} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
            Done
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              Close
            </button>
            {published ? (
              <button
                type="button"
                disabled={!picked || busy || market?.status === "assigned"}
                onClick={onSelect}
                className={cn(primaryBtnClass, "px-5")}
                style={primaryStyle}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} aria-hidden /> : <Users className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
                Select contributor
              </button>
            ) : (
              <button type="button" onClick={onPublish} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
                <Megaphone className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                Publish to pool
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        {/* Task summary */}
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3.5 py-3">
          <p className="font-body text-[13.5px] font-semibold text-foreground">{taskTitle}</p>
          <p className="mt-1 font-body text-[11.5px] text-text-tertiary">
            {requiredSkills.length ? requiredSkills.join(" · ") : "No skills"} · {effortHours}h
          </p>
        </div>

        {done ? (
          <StatePanel
            icon={CheckCircle2}
            tone="success"
            title="Contributor selected"
            description="The selected contributor is now assigned. Other interested contributors were notified the task is closed."
          />
        ) : !published ? (
          <StatePanel
            icon={Megaphone}
            tone="ai"
            title="Not published yet"
            description="Publish this task to the skilled contributor pool. Contributors see the price and can express interest."
          />
        ) : interested.length === 0 ? (
          <StatePanel
            icon={Hourglass}
            tone="ai"
            title="Awaiting interest"
            description="Published. Waiting for skilled contributors to review the price and express interest."
          />
        ) : (
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Interested contributors</p>
              <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">{interested.length}</span>
            </div>
            <p className="font-body text-[11.5px] text-text-tertiary mb-2.5">Pick one to assign — others are marked not selected.</p>
            <ul className="space-y-2 max-h-[44vh] overflow-y-auto pr-0.5">
              {interested.map((c) => {
                const selected = picked === c.contributorEmail;
                return (
                  <li key={c.contributorEmail}>
                    <button
                      type="button"
                      onClick={() => setPicked(c.contributorEmail)}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition-all duration-fast",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
                        selected
                          ? "border-[var(--c-violet-400)] bg-[var(--color-ai-surface)] ring-1 ring-[var(--c-violet-400)]"
                          : "border-stroke-subtle bg-surface hover:bg-bg-subtle/50 hover:border-stroke",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className={cn(
                            "grid place-items-center h-5 w-5 rounded-full border shrink-0",
                            selected ? "border-transparent text-white" : "border-stroke-strong bg-surface",
                          )}
                          style={selected ? GLASS_GRADIENT : undefined}
                        >
                          {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                        <Avatar name={c.contributorName} />
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-[13px] font-semibold text-foreground truncate flex items-center gap-2">
                            {c.contributorName}
                            {c.status === "selected" ? (
                              <Chip tone="success" dot={false}>
                                Selected
                              </Chip>
                            ) : null}
                          </p>
                          <p className="font-body text-[11.5px] text-text-tertiary truncate mt-0.5">{c.contributorEmail}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AdminModal>
  );
}
