"use client";

/**
 * Mentor competency editor — aligned with mentor detail + tenant form patterns.
 *
 *   · Summary DashboardSection
 *   · One panel: scannable editable rows (not wide data grid)
 *   · Meridian Select for role + skill; level toggle chips
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Select } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { saveMentorCompetency } from "@/lib/admin/mocks/mentors-service";
import { useAdminMentor, useMentorCompetency } from "@/lib/hooks/use-admin-mentors";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockCompetencyRow } from "@/mocks/admin/mentors";
import { cn } from "@/lib/utils/cn";

const ROLES = [
  { value: "engineer", label: "Engineer" },
  { value: "designer", label: "Designer" },
  { value: "data", label: "Data" },
  { value: "marketing", label: "Marketing" },
  { value: "documentation", label: "Documentation" },
] as const;

const LEVELS = ["L1", "L2", "L3", "L4"] as const;

function emptyRow(): MockCompetencyRow {
  return {
    role: "engineer",
    skillId: "",
    skillName: "",
    levels: { L1: false, L2: false, L3: false, L4: false },
  };
}

function rowsEqual(a: MockCompetencyRow[], b: MockCompetencyRow[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function countLevels(row: MockCompetencyRow): number {
  return LEVELS.filter((l) => row.levels[l]).length;
}

export function CompetencyEditorWorkspace() {
  const params = useParams<{ mentorId: string }>();
  const router = useRouter();
  const mentor = useAdminMentor(params.mentorId);
  const seed = useMentorCompetency(params.mentorId);
  const skills = useAdminSkillsList().filter((s) => s.status === "active");

  const [rows, setRows] = React.useState<MockCompetencyRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setRows(seed);
  }, [seed]);

  const dirty = !rowsEqual(rows, seed);

  const stats = React.useMemo(() => {
    const valid = rows.filter((r) => r.skillId);
    const roles = new Set(valid.map((r) => r.role));
    const skillIds = new Set(valid.map((r) => r.skillId));
    const withLevels = valid.filter((r) => countLevels(r) > 0);
    return {
      total: rows.length,
      complete: withLevels.length,
      roles: roles.size,
      skills: skillIds.size,
    };
  }, [rows]);

  if (!mentor) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Mentors
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Mentor not found.</p>
      </div>
    );
  }

  function addRow() {
    setRows((r) => [...r, emptyRow()]);
    setError(null);
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
    setError(null);
  }

  function updateRow(idx: number, patch: Partial<MockCompetencyRow>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    setError(null);
  }

  function toggleLevel(idx: number, lvl: (typeof LEVELS)[number]) {
    setRows((r) =>
      r.map((row, i) =>
        i === idx ? { ...row, levels: { ...row.levels, [lvl]: !row.levels[lvl] } } : row,
      ),
    );
    setError(null);
  }

  function validate(): boolean {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      if (!row.skillId) {
        setError(`Row ${i + 1}: select a skill.`);
        return false;
      }
      if (countLevels(row) === 0) {
        setError(`Row ${i + 1}: select at least one level.`);
        return false;
      }
    }
    const keys = rows.map((r) => `${r.role}:${r.skillId}`);
    if (new Set(keys).size !== keys.length) {
      setError("Duplicate role × skill combinations are not allowed.");
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!mentor) return;
    if (!validate()) return;
    setSaving(true);
    saveMentorCompetency(mentor.id, rows);
    router.push(`/admin/mentors/${mentor.id}?tab=competency&competency=saved`);
  }

  const firstName = mentor.name.split(" ")[0];

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Mentors</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <Link
          href={`/admin/mentors/${mentor.id}`}
          className="px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast truncate"
        >
          {mentor.name}
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Competency</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Mentor
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Competency matrix
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Define which role × skill × level combinations {firstName} can review.
            Matching uses this matrix to route assignments.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
            "bg-surface border border-stroke",
            "font-body text-[13px] font-semibold text-foreground",
            "hover:bg-bg-subtle transition-colors duration-fast",
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Add row
        </button>
      </header>

      <DashboardSection title="Matrix summary" description={`${mentor.name} · review eligibility`}>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Total rows" value={String(stats.total)} />
          <SummaryStat
            label="Ready to match"
            value={String(stats.complete)}
            highlight={stats.complete > 0}
          />
          <SummaryStat label="Roles covered" value={String(stats.roles)} />
          <SummaryStat label="Skills" value={String(stats.skills)} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Competency rows
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            {rows.length === 0
              ? "Add at least one row to enable review matching"
              : `${rows.length} row${rows.length === 1 ? "" : "s"} · ${stats.complete} complete`}
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-body text-[13.5px] font-semibold text-foreground">
              No competency rows yet
            </p>
            <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
              Each row defines a contributor role, skill, and proficiency levels this mentor can
              review.
            </p>
            <button
              type="button"
              onClick={addRow}
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Add first row
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-stroke-subtle">
            {rows.map((row, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                    Row {i + 1}
                    {row.skillName && (
                      <span className="ml-2 normal-case tracking-normal text-text-secondary font-medium">
                        · {row.skillName}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label={`Remove row ${i + 1}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-body text-[11.5px] font-medium text-text-tertiary hover:text-error-text hover:bg-error-subtle/40 transition-colors duration-fast"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Role">
                    <Select
                      variant="outline"
                      size="sm"
                      value={row.role}
                      onChange={(e) => updateRow(i, { role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Skill">
                    <Select
                      variant="outline"
                      size="sm"
                      value={row.skillId}
                      invalid={!row.skillId}
                      onChange={(e) => {
                        const s = skills.find((x) => x.id === e.target.value);
                        updateRow(i, {
                          skillId: e.target.value,
                          skillName: s?.name ?? "",
                        });
                      }}
                    >
                      <option value="">Select skill…</option>
                      {skills.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Levels">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {LEVELS.map((lvl) => {
                        const active = row.levels[lvl];
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => toggleLevel(i, lvl)}
                            aria-pressed={active}
                            className={cn(
                              "inline-flex items-center h-8 min-w-[2.5rem] px-2.5 rounded-md border font-mono text-[12px] font-semibold transition-colors duration-fast",
                              active
                                ? "bg-foreground text-surface border-foreground"
                                : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle",
                            )}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length > 0 && (
          <footer className="px-5 py-3 border-t border-stroke-subtle">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-link"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Add another row
            </button>
          </footer>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-error-border bg-error-subtle px-4 py-2.5 font-body text-[12.5px] text-error-text"
        >
          {error}
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Link
          href={`/admin/mentors/${mentor.id}?tab=competency`}
          className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="font-body text-[11.5px] text-text-tertiary">Unsaved changes</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={cn(
              "inline-flex items-center h-9 px-4 rounded-md shadow-xs",
              "bg-brand text-on-brand font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {saving ? "Saving…" : "Save competency"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      {children}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
