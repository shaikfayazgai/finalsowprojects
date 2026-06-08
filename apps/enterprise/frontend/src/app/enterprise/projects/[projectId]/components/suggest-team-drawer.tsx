"use client";

/**
 * Suggest team — gradient-glass drawer for AI-ranked contributor matching.
 */

import * as React from "react";
import { Check, Loader2, Search, Sparkles, Users } from "lucide-react";
import {
  Drawer,
  GlassAvatar,
  GlassCard,
  GlassChip,
  GlassEmpty,
  GlassField,
  GlassMatchScore,
  GlassPhaseRail,
  GlassSection,
  GlassSegmentedControl,
  GlassSuccess,
  glassBtnPrimary,
  glassBtnSecondary,
  glassInputCls,
} from "@/components/meridian";
import {
  matchCandidatesMock,
  type MatchedCandidate,
} from "@/lib/enterprise/mocks/matching";
import { cn } from "@/lib/utils/cn";

const SKILL_CHOICES = [
  "Figma", "Design Systems", "Motion", "Accessibility", "Research",
  "TypeScript", "React", "Testing",
  "Python", "OpenAPI", "Postgres", "SQL", "dbt", "Go",
  "AWS", "Terraform", "Observability", "SRE", "Security",
  "Discovery", "Roadmaps", "OKRs",
];

const LEVELS = ["L1", "L2", "L3", "L4", "L5"] as const;
const REGIONS = ["India", "UAE", "Europe", "Americas"] as const;

type Phase = "criteria" | "results";

interface Props {
  open: boolean;
  onClose: () => void;
  projectName: string;
}

export function SuggestTeamDrawer({ open, onClose, projectName }: Props) {
  const [phase, setPhase] = React.useState<Phase>("criteria");
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(["Figma", "TypeScript"]);
  const [level, setLevel] = React.useState<string>("L3");
  const [region, setRegion] = React.useState<string>("India");
  const [skillQuery, setSkillQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [candidates, setCandidates] = React.useState<MatchedCandidate[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setPhase("criteria");
    setSearching(false);
    setCandidates([]);
    setSelected(new Set());
    setConfirmed(false);
    setSkillQuery("");
  }, [open]);

  const runMatch = async () => {
    setSearching(true);
    setPhase("results");
    setConfirmed(false);
    await new Promise((r) => setTimeout(r, 900));
    const { candidates: list } = matchCandidatesMock({
      requiredSkills: selectedSkills,
      level,
      region,
      limit: 6,
    });
    setCandidates(list);
    setSearching(false);
  };

  const toggleCandidate = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmTeam = () => {
    if (selected.size === 0) return;
    setConfirmed(true);
  };

  const criteriaSummary = `${selectedSkills.length} skills · ${level} · ${region}`;
  const filteredSkills = SKILL_CHOICES.filter((s) =>
    s.toLowerCase().includes(skillQuery.trim().toLowerCase()),
  );

  const phaseStep = confirmed ? 3 : phase === "criteria" ? 1 : 2;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      appearance="gradient-glass"
      eyebrow="Matching · AI assist"
      title="Suggest team"
      description={projectName}
      footer={
        confirmed ? (
          <button type="button" onClick={onClose} className={glassBtnPrimary}>
            Done
          </button>
        ) : phase === "criteria" ? (
          <>
            <button type="button" onClick={onClose} className={glassBtnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              onClick={runMatch}
              disabled={selectedSkills.length === 0}
              className={glassBtnPrimary}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              Find candidates
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setPhase("criteria");
                setConfirmed(false);
              }}
              className={glassBtnSecondary}
            >
              Edit criteria
            </button>
            <button
              type="button"
              onClick={confirmTeam}
              disabled={selected.size === 0 || searching}
              className={glassBtnPrimary}
            >
              <Users className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              {selected.size > 0 ? `Add ${selected.size} to team` : "Add to team"}
            </button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <GlassPhaseRail steps={["Criteria", "Candidates", "Confirmed"]} current={phaseStep} />

        {confirmed ? (
          <GlassSuccess
            title={`${selected.size} contributor${selected.size === 1 ? "" : "s"} added to ${projectName}`}
            description="Notifications sent · audit recorded · SLAs start when each contributor accepts."
          />
        ) : phase === "criteria" ? (
          <CriteriaPanel
            selectedSkills={selectedSkills}
            onToggleSkill={(s) =>
              setSelectedSkills((cur) =>
                cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
              )
            }
            skillQuery={skillQuery}
            onSkillQueryChange={setSkillQuery}
            filteredSkills={filteredSkills}
            level={level}
            onLevelChange={setLevel}
            region={region}
            onRegionChange={setRegion}
          />
        ) : (
          <ResultsPanel
            searching={searching}
            candidates={candidates}
            selected={selected}
            onToggle={toggleCandidate}
            criteriaSummary={criteriaSummary}
          />
        )}
      </div>
    </Drawer>
  );
}

function CriteriaPanel({
  selectedSkills,
  onToggleSkill,
  skillQuery,
  onSkillQueryChange,
  filteredSkills,
  level,
  onLevelChange,
  region,
  onRegionChange,
}: {
  selectedSkills: string[];
  onToggleSkill: (s: string) => void;
  skillQuery: string;
  onSkillQueryChange: (v: string) => void;
  filteredSkills: string[];
  level: string;
  onLevelChange: (v: string) => void;
  region: string;
  onRegionChange: (v: string) => void;
}) {
  const [showHelp, setShowHelp] = React.useState(false);

  return (
    <>
      <GlassSection
        step="01"
        title="Required skills"
        hint="Pick the skill set this work needs."
        trailing={
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
            {selectedSkills.length} selected
          </span>
        }
      >
        <GlassCard className="p-3 space-y-2.5">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={skillQuery}
              onChange={(e) => onSkillQueryChange(e.target.value)}
              placeholder="Filter skills…"
              className={cn(glassInputCls, "h-8 pl-8 bg-white/45 border-white/50")}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[132px] overflow-y-auto">
            {filteredSkills.length === 0 ? (
              <p className="font-body text-[12px] text-text-tertiary italic py-1">No skills match.</p>
            ) : (
              filteredSkills.map((s) => (
                <GlassChip
                  key={s}
                  label={s}
                  active={selectedSkills.includes(s)}
                  onClick={() => onToggleSkill(s)}
                />
              ))
            )}
          </div>
        </GlassCard>
      </GlassSection>

      <GlassSection step="02" title="Constraints" hint="Minimum level and preferred region.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassField label="Minimum level">
            <GlassSegmentedControl options={LEVELS} value={level} onChange={onLevelChange} mono />
          </GlassField>
          <GlassField label="Preferred region">
            <GlassSegmentedControl options={REGIONS} value={region} onChange={onRegionChange} />
          </GlassField>
        </div>
      </GlassSection>

      <button
        type="button"
        onClick={() => setShowHelp((v) => !v)}
        className="font-body text-[11.5px] font-medium text-text-link"
      >
        {showHelp ? "Hide matching rubric" : "How matching works"}
      </button>
      {showHelp && (
        <GlassCard className="p-3">
          <p className="font-body text-[12px] text-text-secondary leading-relaxed">
            Composite score: skills 50% · availability 20% · quality 20% · reliability 10%.
            Human approval required — assistive mode only.
          </p>
        </GlassCard>
      )}
    </>
  );
}

function ResultsPanel({
  searching,
  candidates,
  selected,
  onToggle,
  criteriaSummary,
}: {
  searching: boolean;
  candidates: MatchedCandidate[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  criteriaSummary: string;
}) {
  if (searching) {
    return (
      <GlassCard className="py-10 text-center">
        <Loader2 className="h-5 w-5 mx-auto text-brand animate-spin mb-2" strokeWidth={2} aria-hidden />
        <p className="font-body text-[13px] font-semibold text-foreground">Ranking candidates…</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">{criteriaSummary}</p>
      </GlassCard>
    );
  }

  if (candidates.length === 0) {
    return (
      <GlassEmpty
        title="No matches"
        description="Try fewer skills or a lower level, then search again."
      />
    );
  }

  return (
    <GlassSection
      step="02"
      title="Ranked candidates"
      hint={criteriaSummary}
      trailing={
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
          {selected.size} selected
        </span>
      }
    >
      <ul className="space-y-2">
        {candidates.map((c) => (
          <CandidateRow
            key={c.id}
            candidate={c}
            isSelected={selected.has(c.id)}
            onToggle={() => onToggle(c.id)}
          />
        ))}
      </ul>
    </GlassSection>
  );
}

function CandidateRow({
  candidate: c,
  isSelected,
  onToggle,
}: {
  candidate: MatchedCandidate;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const pct = Math.round(c.matchScore * 100);
  const skillsMeta =
    c.topSkills.length === 0
      ? "No exact skill overlap"
      : c.topSkills
          .slice(0, 2)
          .map((s) => `${s.skill} ${Math.round(s.proficiency * 100)}%`)
          .join(" · ");

  return (
    <li>
      <GlassCard selected={isSelected} onClick={onToggle} className="p-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid place-items-center h-5 w-5 rounded-md border shrink-0 transition-colors",
              isSelected
                ? "border-brand bg-brand text-on-brand"
                : "border-white/60 bg-white/45",
            )}
          >
            {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          <GlassAvatar name={c.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-body text-[13px] font-semibold text-foreground truncate">{c.name}</p>
              <GlassMatchScore pct={pct} />
            </div>
            <p className="font-body text-[11.5px] text-text-tertiary truncate mt-0.5">
              {c.roleLabel} · {c.region.split("·")[0]?.trim() ?? c.region}
              {c.badges[0] ? ` · ${c.badges[0]}` : ""}
            </p>
            <p className="font-body text-[11.5px] text-text-secondary truncate mt-1">{skillsMeta}</p>
            <p className="font-body text-[11px] text-text-tertiary truncate mt-0.5">
              {c.signals.skills.detail}
            </p>
          </div>
        </div>
      </GlassCard>
    </li>
  );
}
