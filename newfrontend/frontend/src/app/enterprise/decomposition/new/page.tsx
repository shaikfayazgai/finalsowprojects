"use client";

/**
 * Manual decomposition builder — the enterprise PMO manually defines the
 * milestones + tasks for a SOW (no AI yet). Reads ?sowId=. When AI decomposition
 * is integrated later, it will pre-fill this same structure for editing.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Layers, ListChecks, Sparkles, Paperclip, X } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useCreatePlan } from "@/lib/hooks/use-decomposition-v2";
import { useSow } from "@/lib/hooks/use-sow-v2";
import type { PlanStructureInput, TaskAttachment } from "@/lib/decomposition/types";
import { toast } from "@/lib/stores/toast-store";

const SELECT_CLS =
  "flex h-9 w-full rounded-md border border-stroke-subtle bg-surface px-2.5 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";

let _uid = 0;
const nextId = () => `row_${++_uid}`;

interface MilestoneRow { id: string; name: string }
interface TaskRow {
  id: string; title: string; milestone: string; skills: string; hours: string;
  description: string; acceptanceCriteria: string; attachments: TaskAttachment[]; uploading?: boolean;
}

export default function ManualDecompositionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const sowId = params.get("sowId") ?? "";
  const { data: sow } = useSow(sowId);
  const createPlan = useCreatePlan();

  const [milestones, setMilestones] = React.useState<MilestoneRow[]>([{ id: nextId(), name: "" }]);
  const [tasks, setTasks] = React.useState<TaskRow[]>([
    { id: nextId(), title: "", milestone: "", skills: "", hours: "", description: "", acceptanceCriteria: "", attachments: [] },
  ]);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const namedMilestones = milestones.map((m) => m.name.trim()).filter(Boolean);

  const addMilestone = () => setMilestones((p) => [...p, { id: nextId(), name: "" }]);
  const removeMilestone = (id: string) => setMilestones((p) => (p.length > 1 ? p.filter((m) => m.id !== id) : p));
  const setMilestone = (id: string, name: string) =>
    setMilestones((p) => p.map((m) => (m.id === id ? { ...m, name } : m)));

  const addTask = () => setTasks((p) => [...p, { id: nextId(), title: "", milestone: "", skills: "", hours: "", description: "", acceptanceCriteria: "", attachments: [] }]);
  const removeTask = (id: string) => setTasks((p) => (p.length > 1 ? p.filter((t) => t.id !== id) : p));
  const setTask = (id: string, patch: Partial<TaskRow>) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  // Upload support files for a task to blob storage (reuses the SOW uploader).
  const uploadFiles = async (taskId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setTask(taskId, { uploading: true });
    const uploaded: TaskAttachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/sow/upload-file", { method: "POST", body: fd });
        const raw = (await res.json().catch(() => ({}))) as {
          data?: { fileName?: string; fileUrl?: string; fileSize?: number };
          fileName?: string; fileUrl?: string; fileSize?: number; error?: string; message?: string;
        };
        // The uploader returns an envelope { success, data: { fileUrl, … } } — read
        // from data, but tolerate a flat shape too.
        const d = raw.data ?? raw;
        if (res.ok && d.fileUrl) {
          uploaded.push({ name: d.fileName || file.name, url: d.fileUrl, sizeBytes: d.fileSize ?? file.size });
        } else {
          setError(`Couldn't upload ${file.name}${raw.error || raw.message ? ` — ${raw.error || raw.message}` : ""}.`);
        }
      } catch {
        setError(`Couldn't upload ${file.name}.`);
      }
    }
    setTasks((p) => p.map((t) => (t.id === taskId ? { ...t, uploading: false, attachments: [...t.attachments, ...uploaded] } : t)));
  };

  const removeAttachment = (taskId: string, url: string) =>
    setTasks((p) => p.map((t) => (t.id === taskId ? { ...t, attachments: t.attachments.filter((a) => a.url !== url) } : t)));

  // Prefill the required-skills hint from the SOW once it loads.
  const sowSkills = React.useMemo(() => {
    const raw = (sow?.activeVersionDetail?.payload as Record<string, unknown> | undefined)?.requiredSkills;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  }, [sow]);

  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);

  const submit = async () => {
    setError(null);
    const ms = milestones.filter((m) => m.name.trim());
    const ts = tasks.filter((t) => t.title.trim());
    if (!sowId) {
      setError("Missing SOW reference. Open this from the decomposition queue.");
      return;
    }
    if (ms.length === 0) {
      setError("Add at least one milestone.");
      return;
    }
    if (ts.length === 0) {
      setError("Add at least one task.");
      return;
    }
    const structure: PlanStructureInput = {
      milestones: ms.map((m, i) => ({ key: m.name.trim(), name: m.name.trim(), order: i + 1 })),
      tasks: ts.map((t, i) => ({
        title: t.title.trim(),
        milestoneKey: t.milestone.trim() || undefined,
        description: t.description.trim() || undefined,
        acceptanceCriteria: t.acceptanceCriteria.trim() || undefined,
        requiredSkills: t.skills.split(",").map((s) => s.trim()).filter(Boolean),
        estimatedHours: t.hours ? Number(t.hours) : undefined,
        attachments: t.attachments,
        order: i + 1,
      })),
      dependencies: [],
    };
    setSubmitting(true);
    try {
      const plan = await createPlan.mutateAsync({
        sowId,
        summary: `${structure.milestones.length} milestones · ${structure.tasks.length} tasks (draft)`,
        structure,
      });
      toast.success("Decomposition created", "Review the plan, then submit for approval.");
      router.push(`/enterprise/decomposition/${plan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the decomposition.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <Link
          href="/enterprise/decomposition"
          className="grid h-9 w-9 place-items-center rounded-lg border border-stroke-subtle text-text-secondary hover:bg-surface-hover"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Manual decomposition</h1>
          <p className="text-sm text-text-secondary truncate">
            {sow?.title ? <>Break <span className="font-medium text-foreground">{sow.title}</span> into milestones &amp; tasks</> : "Break the SOW into milestones & tasks"}
          </p>
        </div>
      </header>

      <div className="flex items-start gap-2 rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3.5 py-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
          Manual mode — you define the plan. AI decomposition will pre-fill this for you once it&apos;s integrated.
          {sowSkills.length ? <> SOW skills: <span className="text-foreground">{sowSkills.join(", ")}</span>.</> : null}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 text-sm text-error-text">{error}</p>
      ) : null}

      {/* Milestones */}
      <section className="rounded-2xl border border-stroke-subtle bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
          <h2 className="font-body text-[14px] font-semibold text-foreground">Milestones</h2>
        </div>
        {milestones.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-bg-subtle font-mono text-[12px] text-text-tertiary">M{i + 1}</span>
            <Input value={m.name} onChange={(e) => setMilestone(m.id, e.target.value)} placeholder="e.g. Discovery & setup" />
            <button
              type="button"
              onClick={() => removeMilestone(m.id)}
              disabled={milestones.length === 1}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-tertiary hover:text-error-text hover:bg-error-subtle/50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Remove milestone"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addMilestone} className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} /> Add milestone
        </button>
      </section>

      {/* Tasks */}
      <section className="rounded-2xl border border-stroke-subtle bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[14px] font-semibold text-foreground">Tasks</h2>
          </div>
          {totalHours > 0 ? <span className="font-body text-[12px] text-text-tertiary">{totalHours}h total</span> : null}
        </div>
        {tasks.map((t, i) => (
          <div key={t.id} className="rounded-lg border border-stroke-subtle bg-bg-subtle/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface font-mono text-[11px] text-text-tertiary">T{i + 1}</span>
              <Input value={t.title} onChange={(e) => setTask(t.id, { title: e.target.value })} placeholder="Task title — e.g. Core implementation" />
              <button
                type="button"
                onClick={() => removeTask(t.id)}
                disabled={tasks.length === 1}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-tertiary hover:text-error-text hover:bg-error-subtle/50 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Remove task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-10">
              <div>
                <Label className="text-[11px]">Milestone</Label>
                <select className={SELECT_CLS} value={t.milestone} onChange={(e) => setTask(t.id, { milestone: e.target.value })}>
                  <option value="">— none —</option>
                  {namedMilestones.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[11px]">Skills (comma-sep)</Label>
                <Input className="h-9 text-[13px]" value={t.skills} onChange={(e) => setTask(t.id, { skills: e.target.value })} placeholder="React, Node" />
              </div>
              <div>
                <Label className="text-[11px]">Effort (hrs)</Label>
                <Input className="h-9 text-[13px]" type="number" min="0" value={t.hours} onChange={(e) => setTask(t.id, { hours: e.target.value })} placeholder="0" />
              </div>
            </div>

            {/* Description / brief */}
            <div className="pl-10">
              <Label className="text-[11px]">Description / brief</Label>
              <textarea
                className="mt-0.5 min-h-[64px] w-full rounded-md border border-stroke-subtle bg-surface px-2.5 py-2 text-[13px] text-foreground placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
                value={t.description}
                onChange={(e) => setTask(t.id, { description: e.target.value })}
                placeholder="What the contributor needs to do — context and requirements…"
              />
            </div>

            {/* Acceptance criteria — the "done" conditions shown to contributor + mentor + reviewer */}
            <div className="pl-10">
              <Label className="text-[11px]">Acceptance criteria</Label>
              <textarea
                className="mt-0.5 min-h-[56px] w-full rounded-md border border-stroke-subtle bg-surface px-2.5 py-2 text-[13px] text-foreground placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
                value={t.acceptanceCriteria}
                onChange={(e) => setTask(t.id, { acceptanceCriteria: e.target.value })}
                placeholder="How it's judged done — one per line. e.g. Responsive on mobile · Passes lint · Matches the Figma"
              />
            </div>

            {/* Support files */}
            <div className="pl-10 space-y-1.5">
              <Label className="text-[11px]">Support files</Label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-stroke-subtle bg-bg-subtle/40 px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-surface-hover">
                  <Paperclip className="h-3.5 w-3.5" />
                  {t.uploading ? "Uploading…" : "Attach files"}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={t.uploading}
                    onChange={(e) => { void uploadFiles(t.id, e.target.files); e.target.value = ""; }}
                  />
                </label>
                {t.attachments.map((a) => (
                  <span key={a.url} className="inline-flex items-center gap-1 rounded-md border border-stroke-subtle bg-surface px-2 py-1 text-[11.5px] text-text-secondary">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-text-link hover:underline max-w-[180px] truncate">{a.name}</a>
                    <button type="button" onClick={() => removeAttachment(t.id, a.url)} className="text-text-tertiary hover:text-error-text" aria-label={`Remove ${a.name}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addTask} className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} /> Add task
        </button>
      </section>

      <div className="flex items-center justify-end gap-2">
        <Link href="/enterprise/decomposition" className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground px-4 py-2">
          Cancel
        </Link>
        <Button onClick={submit} disabled={submitting} className="gap-2">
          {submitting ? "Creating…" : "Create decomposition"}
        </Button>
      </div>
    </div>
  );
}
