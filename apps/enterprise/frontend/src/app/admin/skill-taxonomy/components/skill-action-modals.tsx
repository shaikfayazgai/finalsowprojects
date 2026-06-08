"use client";

/**
 * Skill detail modals — Meridian Modal shell (matches tenant + mentor modals).
 */

import * as React from "react";
import { ArrowDownToLine, CheckCircle2, Edit3 } from "lucide-react";
import { Modal, Select } from "@/components/meridian";
import {
  approveAdminSkill,
  deprecateAdminSkill,
  updateAdminSkill,
} from "@/lib/admin/mocks/skills-service";
import type { MockSkill } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";

type ModalKind = "edit" | "deprecate" | "approve" | null;

const CATEGORIES: MockSkill["category"][] = [
  "Frontend",
  "Backend",
  "Data",
  "Design",
  "Marketing",
  "Documentation",
  "DevOps",
  "AI/ML",
  "Other",
];

export function SkillActionModals({
  skill,
  open,
  onClose,
  onSuccess,
}: {
  skill: MockSkill;
  open: ModalKind;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [name, setName] = React.useState(skill.name);
  const [category, setCategory] = React.useState(skill.category);
  const [aliases, setAliases] = React.useState(skill.aliases.join(", "));

  React.useEffect(() => {
    if (open === "edit") {
      setName(skill.name);
      setCategory(skill.category);
      setAliases(skill.aliases.join(", "));
    }
  }, [open, skill]);

  function saveEdit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    updateAdminSkill(skill.id, {
      name: trimmed,
      category,
      aliases: aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    });
    onSuccess(`Updated ${trimmed}.`);
    onClose();
  }

  function confirmDeprecate() {
    deprecateAdminSkill(skill.id);
    onSuccess(`${skill.name} deprecated.`);
    onClose();
  }

  function confirmApprove() {
    approveAdminSkill(skill.id);
    onSuccess(`${skill.name} approved and active.`);
    onClose();
  }

  return (
    <>
      <Modal
        open={open === "edit"}
        onClose={onClose}
        title="Edit skill"
        description="Update display name, category, and aliases."
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={name.trim().length < 2}
              className={primaryBtnCls}
            >
              <Edit3 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Save changes
            </button>
          </>
        }
      >
        <ContextStrip label="Skill ID" value={skill.id} mono />
        <div className="mt-4 space-y-4">
          <Field label="Display name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Category" required>
            <Select
              variant="outline"
              size="sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as MockSkill["category"])}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Aliases" hint="Comma-separated alternate names">
            <input
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              className={inputCls}
              placeholder="e.g. ReactJS, React.js"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={open === "deprecate"}
        onClose={onClose}
        title="Deprecate skill"
        description="Skill stays on existing profiles but cannot be assigned to new work."
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={confirmDeprecate} className={dangerBtnCls}>
              <ArrowDownToLine className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Deprecate
            </button>
          </>
        }
      >
        <ContextStrip label="Skill" value={skill.name} />
        <p className="mt-3 font-body text-[12px] text-text-tertiary leading-relaxed">
          Consider merging into a canonical skill instead if this is a duplicate entry.
        </p>
      </Modal>

      <Modal
        open={open === "approve"}
        onClose={onClose}
        title="Approve pending skill"
        description="Skill becomes active in the taxonomy and available for competency assignment."
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={confirmApprove} className={primaryBtnCls}>
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Approve skill
            </button>
          </>
        }
      >
        <ContextStrip label="Skill" value={skill.name} />
        {skill.createdBy && (
          <p className="mt-3 font-body text-[12px] text-text-secondary leading-relaxed">
            {skill.createdBy}
          </p>
        )}
      </Modal>
    </>
  );
}

export function SkillActionButtons({
  skill,
  onOpen,
}: {
  skill: MockSkill;
  onOpen: (k: NonNullable<ModalKind>) => void;
}) {
  return (
    <>
      {skill.status === "pending" && (
        <button type="button" onClick={() => onOpen("approve")} className={primaryBtnCls}>
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Approve
        </button>
      )}
      <button type="button" onClick={() => onOpen("edit")} className={actionBtnCls}>
        <Edit3 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Edit
      </button>
      {skill.status !== "deprecated" && (
        <button type="button" onClick={() => onOpen("deprecate")} className={actionBtnCls}>
          <ArrowDownToLine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Deprecate
        </button>
      )}
    </>
  );
}

function ContextStrip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-body text-[13px] font-medium text-foreground leading-snug",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && (
          <span className="text-error-text normal-case tracking-normal"> *</span>
        )}
      </span>
      {children}
      {hint && (
        <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">{hint}</p>
      )}
    </div>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors duration-fast",
);

const cancelBtnCls = cn(
  "inline-flex items-center h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const dangerBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-error-solid text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-error transition-colors duration-fast",
);
