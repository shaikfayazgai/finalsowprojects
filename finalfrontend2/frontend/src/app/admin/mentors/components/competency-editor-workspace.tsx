"use client";

/**
 * Mentor competency editor — define role × skill × level for review matching.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, GraduationCap, Plus, SearchX, Trash2 } from "lucide-react";
import { saveMentorCompetency } from "@/lib/admin/mocks/mentors-service";
import { useAdminMentor, useMentorCompetency } from "@/lib/hooks/use-admin-mentors";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockCompetencyRow } from "@/mocks/admin/mentors";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryStyle } from "../../_shell/aurora-ui";

const ROLES = [
  { value: "engineer", label: "Engineer" },
  { value: "designer", label: "Designer" },
  { value: "data", label: "Data" },
  { value: "marketing", label: "Marketing" },
  { value: "documentation", label: "Documentation" },
] as const;

const LEVELS = ["L1", "L2", "L3", "L4"] as const;

const FIELD =
  "w-full h-10 px-3 rounded-lg border border-stroke-subtle bg-surface font-body text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";

const SELECT = cn(FIELD, "appearance-none pr-10 cursor-pointer");

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-medium text-foreground",
  "hover:bg-bg-subtle transition-colors",
);

const ADD_ROW_BTN = cn(BTN_SECONDARY, "h-10 px-4");

function AddRowButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn(ADD_ROW_BTN, className)}>
      <Plus className="h-4 w-4 text-text-tertiary" strokeWidth={2.2} aria-hidden />
      Add row
    </button>
  );
}
function emptyRow(): MockCompetencyRow {
  return { role: "engineer", skillId: "", skillName: "", levels: { L1: false, L2: false, L3: false, L4: false } };
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
  const lastRowRef = React.useRef<HTMLLIElement>(null);
  const shouldScrollToNewRow = React.useRef(false);

  React.useEffect(() => {
    setRows(seed);
  }, [seed]);

  React.useEffect(() => {
    if (!shouldScrollToNewRow.current) return;
    shouldScrollToNewRow.current = false;
    lastRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [rows.length]);

  const dirty = !rowsEqual(rows, seed);

  const stats = React.useMemo(() => {
    const valid = rows.filter((r) => r.skillId);
    const roles = new Set(valid.map((r) => r.role));
    const skillIds = new Set(valid.map((r) => r.skillId));
    const withLevels = valid.filter((r) => countLevels(r) > 0);
    return { total: rows.length, complete: withLevels.length, roles: roles.size, skills: skillIds.size };
  }, [rows]);

  if (!mentor) {
    return (
      <div className="space-y-5 pb-4 animate-fade-in">
        <BackLink mentorId="" mentorName="Mentors" />
        <div className={DASH_CARD}>
          <TenantEmptyState
            icon={SearchX}
            title="Mentor not found"
            description="This mentor may have been removed or the link is incorrect."
            action={
              <Link href="/admin/mentors" className={cn(BTN_SECONDARY, "h-10 px-4")}>
                Back to mentors
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  function addRow() {
    shouldScrollToNewRow.current = true;
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
      r.map((row, i) => (i === idx ? { ...row, levels: { ...row.levels, [lvl]: !row.levels[lvl] } } : row)),
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
    if (!validate()) return;
    setSaving(true);
    saveMentorCompetency(params.mentorId, rows);
    router.push(`/admin/mentors/${params.mentorId}?tab=competency&competency=saved`);
  }

  const firstName = mentor.name.split(" ")[0];

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <BackLink mentorId={mentor.id} mentorName={mentor.name} />

      <header className="min-w-0">
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Competency matrix
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary max-w-2xl">
          Define which role × skill × level combinations {firstName} can review. Matching uses this matrix to route
          assignments.
        </p>
      </header>

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <h2 className="font-body text-[13px] font-semibold text-foreground">Matrix summary</h2>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 sm:px-5 py-5">
          <Metric label="Total rows" value={String(stats.total)} />
          <Metric
            label="Ready to match"
            value={String(stats.complete)}
            highlight={stats.complete > 0}
          />
          <Metric label="Roles covered" value={String(stats.roles)} />
          <Metric label="Skills" value={String(stats.skills)} />
        </dl>
      </section>

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <h2 className="font-body text-[13px] font-semibold text-foreground">Competency rows</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
            {rows.length === 0
              ? "Add at least one row to enable review matching"
              : `${rows.length} row${rows.length === 1 ? "" : "s"} · ${stats.complete} complete`}
          </p>
        </div>

        {rows.length === 0 ? (
          <TenantEmptyState
            icon={GraduationCap}
            title="No competency rows yet"
            description="Each row defines a contributor role, skill, and proficiency levels this mentor can review."
            action={
              <button
                type="button"
                onClick={addRow}
                className={cn(
                  "inline-flex items-center gap-2 h-10 px-5 rounded-lg font-body text-[13px] font-semibold text-on-brand hover:opacity-90",
                )}
                style={primaryStyle}
              >
                <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                Add row
              </button>
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {rows.map((row, i) => (
                <li
                  key={i}
                  ref={i === rows.length - 1 ? lastRowRef : undefined}
                  className="px-4 sm:px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-body text-[12px] font-medium text-text-tertiary">
                      Row {i + 1}
                      {row.skillName ? (
                        <span className="ml-2 text-text-secondary font-semibold">· {row.skillName}</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      aria-label={`Remove row ${i + 1}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-body text-[12px] font-medium text-text-tertiary hover:text-error-text hover:bg-error-subtle/50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Role">
                      <SelectInput
                        value={row.role}
                        onChange={(e) => updateRow(i, { role: e.target.value })}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>

                    <Field label="Skill">
                      <SelectInput
                        value={row.skillId}
                        onChange={(e) => {
                          const s = skills.find((x) => x.id === e.target.value);
                          updateRow(i, { skillId: e.target.value, skillName: s?.name ?? "" });
                        }}
                      >
                        <option value="">Select skill…</option>
                        {skills.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </SelectInput>
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
                                "inline-flex items-center justify-center h-9 min-w-[2.75rem] px-2.5 rounded-lg border font-mono text-[12px] font-semibold transition-colors",
                                active
                                  ? "border-brand bg-brand-subtle text-brand-emphasis"
                                  : "border-stroke-subtle bg-surface text-text-secondary hover:bg-bg-subtle",
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

            <div className="px-4 sm:px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/40">
              <AddRowButton onClick={addRow} />
              <p className="mt-2 font-body text-[12px] text-text-tertiary">
                Add another role × skill combination for this mentor.
              </p>
            </div>
          </>
        )}
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-error-border bg-error-subtle px-4 py-2.5 font-body text-[13px] text-error-text"
        >
          {error}
        </p>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Link
          href={`/admin/mentors/${mentor.id}?tab=competency`}
          className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          {dirty ? <span className="font-body text-[12px] text-text-tertiary">Unsaved changes</span> : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={cn(
              "inline-flex items-center justify-center h-10 px-5 rounded-lg font-body text-[13px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50",
            )}
            style={primaryStyle}
          >
            {saving ? "Saving…" : "Save competency"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function BackLink({ mentorId, mentorName }: { mentorId: string; mentorName: string }) {
  const href = mentorId ? `/admin/mentors/${mentorId}?tab=competency` : "/admin/mentors";
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      {mentorName}
    </Link>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-body text-[18px] font-semibold tabular-nums leading-tight",
          highlight ? "text-success-text" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block font-body text-[12px] font-medium text-text-tertiary mb-1.5">{label}</span>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={SELECT}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
