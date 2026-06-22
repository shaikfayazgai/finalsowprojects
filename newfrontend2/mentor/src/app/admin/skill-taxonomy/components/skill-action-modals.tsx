"use client";

/**
 * Skill detail modals — Aurora Glass (meridian Modal shell + glass surface).
 */

import * as React from "react";
import { ArrowDownToLine, CheckCircle2, Edit3 } from "lucide-react";
import { Modal } from "@/components/meridian";
import {
  approveAdminSkill,
  deprecateAdminSkill,
  updateAdminSkill,
} from "@/lib/admin/mocks/skills-service";
import type { MockSkill } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";
import {
  AuroraInput,
  AuroraSelect,
  Field,
  GLASS_MODAL_CLASS,
  GLASS_MODAL_OVERLAY,
  dangerBtnClass,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

type ModalKind = "edit" | "deprecate" | "approve" | null;

const CATEGORIES: MockSkill["category"][] = ["Frontend", "Backend", "Data", "Design", "Marketing", "Documentation", "DevOps", "AI/ML", "Other"];

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
    updateAdminSkill(skill.id, { name: trimmed, category, aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean) });
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
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title="Edit skill"
        description="Update display name, category, and aliases."
        footer={
          <>
            <button type="button" onClick={onClose} className={ghostBtnClass}>Cancel</button>
            <button type="button" onClick={saveEdit} disabled={name.trim().length < 2} className={primaryBtnClass} style={primaryStyle}>
              <Edit3 className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Save changes
            </button>
          </>
        }
      >
        <ContextStrip label="Skill ID" value={skill.id} mono />
        <div className="mt-4 space-y-4">
          <Field label="Display name" required>
            <AuroraInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Category" required>
            <AuroraSelect value={category} onChange={(e) => setCategory(e.target.value as MockSkill["category"])}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </AuroraSelect>
          </Field>
          <Field label="Aliases" hint="Comma-separated alternate names">
            <AuroraInput value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="e.g. ReactJS, React.js" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={open === "deprecate"}
        onClose={onClose}
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title="Deprecate skill"
        description="Skill stays on existing profiles but cannot be assigned to new work."
        footer={
          <>
            <button type="button" onClick={onClose} className={ghostBtnClass}>Cancel</button>
            <button type="button" onClick={confirmDeprecate} className={dangerBtnClass}>
              <ArrowDownToLine className="h-4 w-4" strokeWidth={2.4} aria-hidden />
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
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title="Approve pending skill"
        description="Skill becomes active in the taxonomy and available for competency assignment."
        footer={
          <>
            <button type="button" onClick={onClose} className={ghostBtnClass}>Cancel</button>
            <button type="button" onClick={confirmApprove} className={primaryBtnClass} style={primaryStyle}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Approve skill
            </button>
          </>
        }
      >
        <ContextStrip label="Skill" value={skill.name} />
        {skill.createdBy && <p className="mt-3 font-body text-[12px] text-text-secondary leading-relaxed">{skill.createdBy}</p>}
      </Modal>
    </>
  );
}

export function SkillActionButtons({ skill, onOpen }: { skill: MockSkill; onOpen: (k: NonNullable<ModalKind>) => void }) {
  return (
    <>
      {skill.status === "pending" && (
        <button type="button" onClick={() => onOpen("approve")} className={primaryBtnClass} style={primaryStyle}>
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          Approve
        </button>
      )}
      <button type="button" onClick={() => onOpen("edit")} className={ghostBtnClass}>
        <Edit3 className="h-4 w-4" strokeWidth={2} aria-hidden />
        Edit
      </button>
      {skill.status !== "deprecated" && (
        <button type="button" onClick={() => onOpen("deprecate")} className={ghostBtnClass}>
          <ArrowDownToLine className="h-4 w-4" strokeWidth={2} aria-hidden />
          Deprecate
        </button>
      )}
    </>
  );
}

function ContextStrip({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/55 backdrop-blur px-3.5 py-2.5">
      <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</p>
      <p className={cn("mt-0.5 font-body text-[13px] font-semibold text-foreground leading-snug", mono && "font-mono text-[12px]")}>{value}</p>
    </div>
  );
}
