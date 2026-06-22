"use client";

import * as React from "react";
import { Modal } from "@/components/meridian/overlays";
import {
  ModalCancelButton,
  ModalPrimaryButton,
  modalFieldLabelClass,
  modalInputClass,
  modalTextareaClass,
} from "@/components/meridian/overlays/modal-actions";
import { cn } from "@/lib/utils/cn";
import {
  normalizeProficiency,
  PROFICIENCY_LEVELS,
  SUGGESTED_SKILLS,
  type EvidenceRow,
  type EvidenceType,
} from "../lib/evidence-ui-utils";

export interface EvidenceFormState {
  title: string;
  type: EvidenceType;
  url: string;
  fileId: string;
  description: string;
  skillNames: string[];
  skillProfs: Record<string, string>;
}

export const EMPTY_EVIDENCE_FORM: EvidenceFormState = {
  title: "",
  type: "link",
  url: "",
  fileId: "",
  description: "",
  skillNames: [],
  skillProfs: {},
};

export function rowToForm(row: EvidenceRow): EvidenceFormState {
  return {
    title: row.title,
    type: row.type,
    url: row.url ?? "",
    fileId: row.fileId ?? "",
    description: row.description,
    skillNames: row.skills.map((s) => s.name),
    skillProfs: Object.fromEntries(row.skills.map((s) => [s.name, s.proficiency])),
  };
}

function validateForm(form: EvidenceFormState): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (form.type === "file" && !form.fileId.trim()) {
    return "File ID is required for document evidence.";
  }
  if (form.type !== "file" && !form.url.trim()) {
    return "URL is required for this evidence type.";
  }
  return null;
}

interface EvidenceFormDialogProps {
  open: boolean;
  editingId: string | null;
  initialForm: EvidenceFormState;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (form: EvidenceFormState) => void;
}

export function EvidenceFormDialog({
  open,
  editingId,
  initialForm,
  submitting,
  error,
  onClose,
  onSubmit,
}: EvidenceFormDialogProps) {
  const [form, setForm] = React.useState(initialForm);
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setForm(initialForm);
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [open, initialForm]);

  const pickableSkills = React.useMemo(() => {
    const extra = form.skillNames.filter((n) => !SUGGESTED_SKILLS.includes(n));
    return [...SUGGESTED_SKILLS, ...extra];
  }, [form.skillNames]);

  function toggleSkill(name: string) {
    setForm((prev) => {
      const has = prev.skillNames.includes(name);
      const skillNames = has ? prev.skillNames.filter((n) => n !== name) : [...prev.skillNames, name];
      const skillProfs = { ...prev.skillProfs };
      if (!has) skillProfs[name] = "intermediate";
      else delete skillProfs[name];
      return { ...prev, skillNames, skillProfs };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateForm(form);
    if (err) return;
    onSubmit(form);
  }

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title={editingId ? "Edit evidence" : "Add evidence"}
      description="Links, documents, and repos help reviewers validate your skill claims."
      size="lg"
      footer={
        <>
          <ModalCancelButton onClick={onClose} disabled={submitting} />
          <ModalPrimaryButton
            onClick={handleSubmit}
            loading={submitting}
          >
            {submitting
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Add evidence"}
          </ModalPrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text"
          >
            {error}
          </p>
        ) : null}

        <div>
          <label htmlFor="evidence-title" className={modalFieldLabelClass}>
            Title
          </label>
          <input
            ref={titleRef}
            id="evidence-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Portfolio site, certificate name…"
            className={modalInputClass}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="evidence-type" className={modalFieldLabelClass}>
            Type
          </label>
          <select
            id="evidence-type"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as EvidenceType }))}
            className={modalInputClass}
          >
            <option value="link">Link</option>
            <option value="file">Document</option>
            <option value="github">GitHub</option>
          </select>
        </div>

        {form.type !== "file" ? (
          <div>
            <label htmlFor="evidence-url" className={modalFieldLabelClass}>
              URL
            </label>
            <input
              id="evidence-url"
              type="url"
              inputMode="url"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://…"
              className={modalInputClass}
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="evidence-file-id" className={modalFieldLabelClass}>
                File ID
              </label>
              <input
                id="evidence-file-id"
                type="text"
                value={form.fileId}
                onChange={(e) => setForm((p) => ({ ...p, fileId: e.target.value }))}
                placeholder="ID from your upload flow"
                className={cn(modalInputClass, "font-mono text-[12px]")}
              />
            </div>
            <div>
              <label htmlFor="evidence-file-url" className={modalFieldLabelClass}>
                Download URL
                <span className="normal-case font-medium tracking-normal text-text-tertiary">
                  {" "}
                  (optional)
                </span>
              </label>
              <input
                id="evidence-file-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://…"
                className={modalInputClass}
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="evidence-description" className={modalFieldLabelClass}>
            Description
          </label>
          <textarea
            id="evidence-description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="What reviewers should know about this item…"
            className={modalTextareaClass}
          />
        </div>

        <div>
          <p className={modalFieldLabelClass}>Associated skills</p>
          <div className="flex flex-wrap gap-1.5 p-3 rounded-md border border-stroke bg-bg-subtle/40 max-h-32 overflow-y-auto">
            {pickableSkills.map((skill) => {
              const selected = form.skillNames.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    "font-body text-[11.5px] font-medium px-2.5 py-1 rounded-md transition-colors duration-fast",
                    selected
                      ? "bg-brand-subtle text-brand-subtle-text ring-1 ring-brand/20"
                      : "bg-surface text-text-secondary ring-1 ring-stroke hover:bg-surface-hover",
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {form.skillNames.length > 0 ? (
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {form.skillNames.map((name) => (
              <div key={name} className="flex items-center justify-between gap-2">
                <span className="font-body text-[13px] font-medium text-foreground">{name}</span>
                <select
                  value={form.skillProfs[name] ?? "intermediate"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      skillProfs: { ...p.skillProfs, [name]: e.target.value },
                    }))
                  }
                  className="h-9 px-2.5 rounded-md border border-stroke bg-surface font-body text-[12.5px] text-foreground"
                >
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : null}

        <p className="font-body text-[11px] text-text-tertiary leading-snug">
          Evidence is only visible to authorized reviewers — not other contributors or the public.
        </p>
      </form>
    </Modal>
  );
}

export function buildEvidencePayload(form: EvidenceFormState) {
  return {
    title: form.title.trim(),
    type: form.type,
    url: form.url.trim(),
    file_id: form.type === "file" ? form.fileId.trim() : "",
    description: form.description.trim(),
    skills: form.skillNames.map((name) => ({
      name,
      proficiency: normalizeProficiency(form.skillProfs[name] ?? "intermediate"),
    })),
  };
}

export function validateEvidenceForm(form: EvidenceFormState): string | null {
  return validateForm(form);
}
