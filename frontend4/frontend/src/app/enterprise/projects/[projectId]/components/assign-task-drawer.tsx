"use client";

/**
 * Assign task — My organization / Glimmora network tabs + live API.
 */

import * as React from "react";
import { Building2, Check, Globe2, Loader2, Search, Users } from "lucide-react";
import {
  Drawer,
  GlassAvatar,
  GlassCard,
  GlassEmpty,
  GlassMatchScore,
  GlassSection,
  GlassSuccess,
  glassBtnPrimary,
  glassBtnSecondary,
} from "@/components/meridian";
import {
  matchCandidatesMock,
  type MatchedCandidate,
} from "@/lib/enterprise/mocks/matching";
import { assignProjectTaskMock } from "@/lib/projects/projects-mock";
import { useAssignTask, useMatchCandidates, useWorkforceDirectory } from "@/lib/hooks/use-workforce";
import type { MatchCandidate } from "@/lib/matching/types";
import type { WorkforceMember } from "@/lib/workforce/types";
import { cn } from "@/lib/utils/cn";

type Tab = "organization" | "network";

interface PickCandidate {
  id: string;
  name: string;
  email: string;
  subtitle: string;
  detail: string;
  score?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  requiredSkills: string[];
  workforceSourcing?: string | null;
  onAssigned?: () => void;
}

function isDbTask(taskId: string): boolean {
  return taskId.startsWith("task-");
}

function matchToPick(c: MatchCandidate): PickCandidate {
  const topReason = c.reasons[0]?.label ?? `${Math.round(c.coverage * 100)}% skill coverage`;
  return {
    id: c.userId,
    name: c.displayName,
    email: c.email,
    subtitle: c.skillMatches
      .filter((s) => s.isRequired)
      .slice(0, 2)
      .map((s) => s.code)
      .join(" · ") || "Skills match",
    detail: topReason,
    score: c.score,
  };
}

function workforceToPick(m: WorkforceMember): PickCandidate {
  return {
    id: m.userId,
    name: m.displayName,
    email: m.email,
    subtitle: m.department ?? "Internal",
    detail: m.primarySkills.slice(0, 3).join(" · ") || "Internal employee",
  };
}

function mockToPick(c: MatchedCandidate): PickCandidate {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    subtitle: c.roleLabel,
    detail: c.signals.skills.detail,
    score: c.matchScore * 100,
  };
}

export function AssignTaskDrawer({
  open,
  onClose,
  projectId,
  projectName,
  taskId,
  taskTitle,
  requiredSkills,
  workforceSourcing,
  onAssigned,
}: Props) {
  const live = isDbTask(taskId);
  const defaultTab: Tab =
    workforceSourcing === "internal_only" || workforceSourcing === "internal_first"
      ? "organization"
      : "network";
  const orgOnly = workforceSourcing === "internal_only";
  const netOnly = workforceSourcing === "external_only";

  const [tab, setTab] = React.useState<Tab>(defaultTab);
  const [search, setSearch] = React.useState("");
  const [picked, setPicked] = React.useState<PickCandidate | null>(null);
  const [done, setDone] = React.useState(false);
  const [mockCandidates, setMockCandidates] = React.useState<MatchedCandidate[]>([]);
  const [mockLoading, setMockLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const assignMutation = useAssignTask(taskId);
  const orgQuery = useWorkforceDirectory({
    search: search || undefined,
    enabled: open && live && tab === "organization",
  });
  const orgMatchQuery = useMatchCandidates(
    taskId,
    "organization",
    open && live && tab === "organization" && !orgOnly,
  );
  const netMatchQuery = useMatchCandidates(
    taskId,
    "network",
    open && live && tab === "network",
  );

  React.useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
    setPicked(null);
    setDone(false);
    setError(null);
    setSearch("");
    if (!live) {
      setMockLoading(true);
      void (async () => {
        await new Promise((r) => setTimeout(r, 400));
        const { candidates: list } = matchCandidatesMock({
          requiredSkills: requiredSkills.length ? requiredSkills : ["TypeScript"],
          limit: 8,
        });
        setMockCandidates(list);
        setMockLoading(false);
      })();
    }
  }, [open, requiredSkills, defaultTab, live]);

  const loading =
    live &&
    (tab === "organization"
      ? orgQuery.isLoading || orgMatchQuery.isLoading
      : netMatchQuery.isLoading);

  const candidates: PickCandidate[] = React.useMemo(() => {
    if (!live) {
      return mockCandidates.map(mockToPick);
    }
    if (tab === "organization") {
      const ranked = orgMatchQuery.data?.candidates.map(matchToPick) ?? [];
      if (ranked.length > 0) return ranked;
      return (orgQuery.data?.items ?? []).map(workforceToPick);
    }
    return (netMatchQuery.data?.candidates ?? []).map(matchToPick);
  }, [
    live,
    tab,
    mockCandidates,
    orgQuery.data,
    orgMatchQuery.data,
    netMatchQuery.data,
  ]);

  const confirm = async () => {
    if (!picked) return;
    setError(null);
    if (live) {
      try {
        await assignMutation.mutateAsync({
          contributorUserId: picked.id,
          directAssign: tab === "organization",
        });
        setDone(true);
        onAssigned?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Assignment failed");
      }
      return;
    }
    assignProjectTaskMock(projectId, taskId, {
      id: picked.id,
      name: picked.name,
      email: picked.email,
    });
    setDone(true);
    onAssigned?.();
  };

  const skillsLabel = requiredSkills.length ? requiredSkills.join(" · ") : "—";
  const orgCount = live ? (orgQuery.data?.total ?? 0) : 0;
  const netCount = live ? (netMatchQuery.data?.candidates.length ?? 0) : mockCandidates.length;
  const searching = !live ? mockLoading : loading;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="md"
      appearance="gradient-glass"
      eyebrow="Matching · Task assign"
      title="Assign contributor"
      description={`${projectName} · ${taskTitle}`}
      footer={
        done ? (
          <button type="button" onClick={onClose} className={glassBtnPrimary}>
            Done
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className={glassBtnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!picked || searching || assignMutation.isPending}
              onClick={() => void confirm()}
              className={glassBtnPrimary}
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} aria-hidden />
              ) : (
                <Users className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              )}
              Assign{picked ? ` · ${picked.name.split(" ")[0]}` : ""}
            </button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <GlassCard className="p-3.5">
          <p className="font-mono text-[10px] text-text-tertiary tabular-nums">{taskId}</p>
          <p className="mt-0.5 font-body text-[13px] font-semibold text-foreground">{taskTitle}</p>
          <p className="mt-1 font-body text-[11.5px] text-text-tertiary">Skills · {skillsLabel}</p>
        </GlassCard>

        {!done && live && (
          <div className="flex gap-1 p-1 rounded-lg bg-white/30 border border-white/40">
            {!netOnly && (
              <TabButton
                active={tab === "organization"}
                onClick={() => {
                  setTab("organization");
                  setPicked(null);
                }}
                icon={Building2}
                label={`My organization (${orgCount})`}
              />
            )}
            {!orgOnly && (
              <TabButton
                active={tab === "network"}
                onClick={() => {
                  setTab("network");
                  setPicked(null);
                }}
                icon={Globe2}
                label={`Glimmora network (${netCount})`}
              />
            )}
          </div>
        )}

        {!done && live && tab === "organization" && (
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full h-9 pl-9 pr-3 rounded-md bg-white/50 border border-white/60 font-body text-[13px] text-foreground placeholder:text-text-tertiary"
            />
          </div>
        )}

        {error && (
          <p className="font-body text-[12px] text-danger-text px-1" role="alert">
            {error}
          </p>
        )}

        {done && picked ? (
          <GlassSuccess
            title={`Assigned to ${picked.name}`}
            description={`Task is matched. ${picked.name} must accept before work begins.`}
          />
        ) : searching ? (
          <GlassCard className="py-8 text-center">
            <Loader2
              className="h-5 w-5 mx-auto text-brand animate-spin mb-2"
              strokeWidth={2}
              aria-hidden
            />
            <p className="font-body text-[13px] font-semibold text-foreground">
              {tab === "organization" ? "Loading your organization…" : "Ranking candidates…"}
            </p>
            <p className="mt-1 font-body text-[12px] text-text-tertiary">
              {tab === "organization"
                ? "Internal employees · direct assign"
                : "skills × availability × quality"}
            </p>
          </GlassCard>
        ) : candidates.length === 0 ? (
          <GlassEmpty
            title={tab === "organization" ? "No synced employees" : "No matches"}
            description={
              tab === "organization"
                ? "No internal employees match these skills. Import a CSV on Workforce or widen skills on the task."
                : "No contributors matched these skills in the Glimmora network."
            }
          />
        ) : (
          <GlassSection
            step="01"
            title={tab === "organization" ? "Pick from your team" : "Pick one contributor"}
            hint={
              tab === "organization"
                ? "Direct assign — no global ranker required."
                : "Tap a row to select, then confirm in the footer."
            }
          >
            <ul className="space-y-2">
              {candidates.map((c) => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  selected={picked?.id === c.id}
                  onSelect={() => setPicked(c)}
                />
              ))}
            </ul>
          </GlassSection>
        )}
      </div>
    </Drawer>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md font-body text-[11.5px] font-semibold transition-colors",
        active
          ? "bg-white/80 text-foreground shadow-sm"
          : "text-text-secondary hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}

function CandidateRow({
  candidate: c,
  selected,
  onSelect,
}: {
  candidate: PickCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const pct = c.score != null ? Math.min(100, Math.round(c.score)) : null;

  return (
    <li>
      <GlassCard selected={selected} onClick={onSelect} className="p-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid place-items-center h-5 w-5 rounded-full border shrink-0 transition-colors",
              selected ? "border-brand bg-brand text-on-brand" : "border-white/60 bg-white/45",
            )}
          >
            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          <GlassAvatar name={c.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-body text-[13px] font-semibold text-foreground truncate">
                {c.name}
              </p>
              {pct != null && <GlassMatchScore pct={pct} />}
            </div>
            <p className="font-body text-[11.5px] text-text-tertiary truncate mt-0.5">
              {c.subtitle}
            </p>
            <p className="font-body text-[11px] text-text-secondary truncate mt-1">{c.detail}</p>
          </div>
        </div>
      </GlassCard>
    </li>
  );
}
