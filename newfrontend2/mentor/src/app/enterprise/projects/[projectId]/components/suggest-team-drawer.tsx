"use client";

/**
 * Suggest team — popup for AI-ranked contributor matching.
 * Criteria → ranked candidates → confirmed.
 */

import * as React from "react";
import { Check, CheckCircle2, Loader2, Search, Sparkles, Users } from "lucide-react";
import { matchCandidatesMock, type MatchedCandidate } from "@/lib/enterprise/mocks/matching";
import { GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { AdminModal, Chip, primaryBtnClass, primaryStyle, secondaryBtnClass, type Tone } from "@/app/admin/_shell/aurora-ui";
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

/* ─── solid primitives ─── */

function StepRail({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <React.Fragment key={s}>
            <li className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  "grid place-items-center h-5 w-5 rounded-full text-[10px] font-bold tabular-nums",
                  active || done ? "text-white" : "bg-bg-subtle text-text-tertiary ring-1 ring-stroke-subtle",
                )}
                style={active || done ? GLASS_GRADIENT : undefined}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : n}
              </span>
              <span className={cn("font-body text-[12px]", active ? "font-semibold text-foreground" : "text-text-tertiary")}>{s}</span>
            </li>
            {i < steps.length - 1 ? <span aria-hidden className="h-px flex-1 bg-stroke-subtle min-w-[10px]" /> : null}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function Section({
  step,
  title,
  hint,
  trailing,
  children,
}: {
  step?: string;
  title: string;
  hint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            {step ? <span className="mr-1.5 text-text-disabled">{step}</span> : null}
            {title}
          </p>
          {hint ? <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{hint}</p> : null}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "inline-flex items-center h-7 px-2.5 rounded-full font-body text-[12px] font-medium transition-colors",
        active ? "text-white" : "bg-surface border border-stroke-subtle text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
      )}
    >
      {label}
    </button>
  );
}

function Segmented({ options, value, onChange, mono }: { options: readonly string[]; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div className="inline-flex rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-0.5">
      {options.map((o) => {
        const sel = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={sel}
            style={sel ? GLASS_GRADIENT : undefined}
            className={cn(
              "h-7 px-3 rounded-md font-body text-[12px] font-semibold transition-colors",
              mono && "font-mono",
              sel ? "text-white" : "text-text-secondary hover:text-foreground",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
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

function MatchScore({ pct }: { pct: number }) {
  const tone: Tone = pct >= 80 ? "success" : pct >= 60 ? "info" : "neutral";
  return (
    <Chip tone={tone} dot={false}>
      {pct}% match
    </Chip>
  );
}

function StatePanel({ icon: Icon, tone, title, description }: { icon: typeof Sparkles; tone: "ai" | "success"; title: string; description: string }) {
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

/* ─── main ─── */

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
    const { candidates: list } = matchCandidatesMock({ requiredSkills: selectedSkills, level, region, limit: 6 });
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
  const filteredSkills = SKILL_CHOICES.filter((s) => s.toLowerCase().includes(skillQuery.trim().toLowerCase()));
  const phaseStep = confirmed ? 3 : phase === "criteria" ? 1 : 2;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="lg"
      icon={Sparkles}
      tone="ai"
      title="Suggest team"
      description={`${projectName} · AI-assisted matching`}
      footer={
        confirmed ? (
          <button type="button" onClick={onClose} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
            Done
          </button>
        ) : phase === "criteria" ? (
          <>
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              Cancel
            </button>
            <button type="button" onClick={runMatch} disabled={selectedSkills.length === 0} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
              <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden />
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
              className={secondaryBtnClass}
            >
              Edit criteria
            </button>
            <button type="button" onClick={confirmTeam} disabled={selected.size === 0 || searching} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
              <Users className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              {selected.size > 0 ? `Add ${selected.size} to team` : "Add to team"}
            </button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <StepRail steps={["Criteria", "Candidates", "Confirmed"]} current={phaseStep} />

        {confirmed ? (
          <StatePanel
            icon={CheckCircle2}
            tone="success"
            title={`${selected.size} contributor${selected.size === 1 ? "" : "s"} added to ${projectName}`}
            description="Notifications sent · audit recorded · SLAs start when each contributor accepts."
          />
        ) : phase === "criteria" ? (
          <CriteriaPanel
            selectedSkills={selectedSkills}
            onToggleSkill={(s) => setSelectedSkills((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}
            skillQuery={skillQuery}
            onSkillQueryChange={setSkillQuery}
            filteredSkills={filteredSkills}
            level={level}
            onLevelChange={setLevel}
            region={region}
            onRegionChange={setRegion}
          />
        ) : (
          <ResultsPanel searching={searching} candidates={candidates} selected={selected} onToggle={toggleCandidate} criteriaSummary={criteriaSummary} />
        )}
      </div>
    </AdminModal>
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
      <Section
        step="01"
        title="Required skills"
        hint="Pick the skill set this work needs."
        trailing={<span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">{selectedSkills.length} selected</span>}
      >
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-3 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
            <input
              type="search"
              value={skillQuery}
              onChange={(e) => onSkillQueryChange(e.target.value)}
              placeholder="Filter skills…"
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
            {filteredSkills.length === 0 ? (
              <p className="font-body text-[12px] text-text-tertiary italic py-1">No skills match.</p>
            ) : (
              filteredSkills.map((s) => <ToggleChip key={s} label={s} active={selectedSkills.includes(s)} onClick={() => onToggleSkill(s)} />)
            )}
          </div>
        </div>
      </Section>

      <Section step="02" title="Constraints" hint="Minimum level and preferred region.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">Minimum level</p>
            <Segmented options={LEVELS} value={level} onChange={onLevelChange} mono />
          </div>
          <div>
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">Preferred region</p>
            <Segmented options={REGIONS} value={region} onChange={onRegionChange} />
          </div>
        </div>
      </Section>

      <div>
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="font-body text-[11.5px] font-semibold text-text-link hover:underline underline-offset-2 transition-colors duration-fast"
        >
          {showHelp ? "Hide matching rubric" : "How matching works"}
        </button>
        {showHelp ? (
          <div className="mt-2 rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-3">
            <p className="font-body text-[12px] text-text-secondary leading-relaxed">
              Composite score: skills 50% · availability 20% · quality 20% · reliability 10%. Human approval required — assistive mode only.
            </p>
          </div>
        ) : null}
      </div>
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
      <div className="rounded-lg border border-stroke-subtle py-10 text-center">
        <Loader2 className="h-5 w-5 mx-auto text-[var(--c-violet-500)] animate-spin mb-2" strokeWidth={2} aria-hidden />
        <p className="font-body text-[13px] font-semibold text-foreground">Ranking candidates…</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">{criteriaSummary}</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return <StatePanel icon={Users} tone="ai" title="No matches" description="Try fewer skills or a lower level, then search again." />;
  }

  return (
    <Section
      step="02"
      title="Ranked candidates"
      hint={criteriaSummary}
      trailing={<span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">{selected.size} selected</span>}
    >
      <ul className="space-y-2 max-h-[42vh] overflow-y-auto pr-0.5">
        {candidates.map((c) => (
          <CandidateRow key={c.id} candidate={c} isSelected={selected.has(c.id)} onToggle={() => onToggle(c.id)} />
        ))}
      </ul>
    </Section>
  );
}

function CandidateRow({ candidate: c, isSelected, onToggle }: { candidate: MatchedCandidate; isSelected: boolean; onToggle: () => void }) {
  const pct = Math.round(c.matchScore * 100);
  const skillsMeta =
    c.topSkills.length === 0
      ? "No exact skill overlap"
      : c.topSkills.slice(0, 2).map((s) => `${s.skill} ${Math.round(s.proficiency * 100)}%`).join(" · ");

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isSelected}
        className={cn(
          "w-full text-left rounded-lg border p-3 transition-all duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
          isSelected
            ? "border-[var(--c-violet-400)] bg-[var(--color-ai-surface)] ring-1 ring-[var(--c-violet-400)]"
            : "border-stroke-subtle bg-surface hover:bg-bg-subtle/50 hover:border-stroke",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid place-items-center h-5 w-5 rounded-md border shrink-0",
              isSelected ? "border-transparent text-white" : "border-stroke-strong bg-surface",
            )}
            style={isSelected ? GLASS_GRADIENT : undefined}
          >
            {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
          </span>
          <Avatar name={c.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-body text-[13px] font-semibold text-foreground truncate">{c.name}</p>
              <MatchScore pct={pct} />
            </div>
            <p className="font-body text-[11.5px] text-text-tertiary truncate mt-0.5">
              {c.roleLabel} · {c.region.split("·")[0]?.trim() ?? c.region}
              {c.badges[0] ? ` · ${c.badges[0]}` : ""}
            </p>
            <p className="font-body text-[11.5px] text-text-secondary truncate mt-1">{skillsMeta}</p>
            <p className="font-body text-[11px] text-text-tertiary truncate mt-0.5">{c.signals.skills.detail}</p>
          </div>
        </div>
      </button>
    </li>
  );
}
