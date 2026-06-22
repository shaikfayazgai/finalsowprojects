"use client";

/**
 * Marketplace assignment — publish a task to the skilled pool, review the
 * interested contributors, and select ONE. The selected contributor is
 * assigned (downstream delivery); others are marked not selected.
 */

import * as React from "react";
import { Megaphone, Check, Users, Loader2 } from "lucide-react";
import {
  Drawer,
  GlassAvatar,
  GlassCard,
  GlassEmpty,
  GlassSection,
  GlassSuccess,
  glassBtnPrimary,
  glassBtnSecondary,
} from "@/components/meridian";
import {
  getMarketTask,
  listInterested,
  marketplaceOverlay,
  publishTaskToMarket,
  selectContributor,
} from "@/lib/enterprise/mocks/task-marketplace";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { assignProjectTaskMock } from "@/lib/projects/projects-mock";
import { AURORA_ACCENT, Chip } from "@/app/admin/_shell/aurora-ui";
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
    <Drawer
      open={open}
      onClose={onClose}
      size="md"
      appearance="gradient-glass"
      eyebrow="Marketplace · Task assign"
      title="Publish & select contributor"
      description={`${projectName} · ${taskTitle}`}
      footer={
        done ? (
          <button type="button" onClick={onClose} className={glassBtnPrimary}>
            Done
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className={glassBtnSecondary}>
              Close
            </button>
            {published ? (
              <button
                type="button"
                disabled={!picked || busy || market?.status === "assigned"}
                onClick={onSelect}
                className={glassBtnPrimary}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} aria-hidden />
                ) : (
                  <Users className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                )}
                Select contributor
              </button>
            ) : (
              <button type="button" onClick={onPublish} className={glassBtnPrimary}>
                <Megaphone className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                Publish to skilled pool
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-5">
        <GlassCard className="p-3.5">
          <p className="font-mono text-[10px] text-text-tertiary tabular-nums">{taskId}</p>
          <p className="mt-0.5 font-body text-[13px] font-semibold text-foreground">{taskTitle}</p>
          <p className="mt-1 font-body text-[11.5px] text-text-tertiary">
            Skills · {requiredSkills.length ? requiredSkills.join(" · ") : "—"} · {effortHours}h
          </p>
        </GlassCard>

        {done ? (
          <GlassSuccess
            title="Contributor selected"
            description="The selected contributor is assigned. Other interested contributors were notified the task is closed."
          />
        ) : !published ? (
          <GlassEmpty
            title="Not published yet"
            description="Publish this task to the skilled contributor pool. Contributors will see the price and can express interest."
          />
        ) : interested.length === 0 ? (
          <GlassEmpty
            title="Awaiting interest"
            description="Published. Waiting for skilled contributors to review the price and express interest."
          />
        ) : (
          <GlassSection
            step="01"
            title="Interested contributors"
            hint="Pick one to assign. Others will be marked not selected."
          >
            <ul className="space-y-2">
              {interested.map((c) => (
                <li key={c.contributorEmail}>
                  <GlassCard
                    selected={picked === c.contributorEmail}
                    onClick={() => setPicked(c.contributorEmail)}
                    className="p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid place-items-center h-5 w-5 rounded-full border shrink-0 transition-colors",
                          picked === c.contributorEmail
                            ? "border-transparent text-white"
                            : "border-white/55 bg-white/45",
                        )}
                        style={
                          picked === c.contributorEmail
                            ? { backgroundImage: AURORA_ACCENT }
                            : undefined
                        }
                      >
                        {picked === c.contributorEmail && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <GlassAvatar name={c.contributorName} />
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-[13px] font-semibold text-foreground truncate flex items-center gap-2">
                          {c.contributorName}
                          {c.status === "selected" && (
                            <Chip tone="success" dot={false}>
                              Selected
                            </Chip>
                          )}
                        </p>
                        <p className="font-body text-[11.5px] text-text-tertiary truncate mt-0.5">
                          {c.contributorEmail}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </GlassSection>
        )}
      </div>
    </Drawer>
  );
}
