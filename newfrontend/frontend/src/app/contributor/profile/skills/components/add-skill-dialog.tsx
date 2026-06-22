"use client";

import * as React from "react";
import { Modal } from "@/components/meridian/overlays";
import {
  ModalCancelButton,
  ModalPrimaryButton,
  modalFieldLabelClass,
  modalInputClass,
} from "@/components/meridian/overlays/modal-actions";
import type { MockSkill } from "@/mocks/contributor";
import { SKILL_CATEGORIES, SKILL_LEVELS } from "../lib/skills-ui-utils";

export interface AddSkillFormState {
  name: string;
  level: MockSkill["level"];
  category: MockSkill["category"];
}

export const EMPTY_ADD_SKILL_FORM: AddSkillFormState = {
  name: "",
  level: "L2",
  category: "engineering",
};

interface AddSkillDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: AddSkillFormState) => void;
}

export function AddSkillDialog({ open, onClose, onSubmit }: AddSkillDialogProps) {
  const [form, setForm] = React.useState<AddSkillFormState>(EMPTY_ADD_SKILL_FORM);
  const nameRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY_ADD_SKILL_FORM);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add skill"
      description="Self-declare a skill and proficiency level. Link evidence from the skill detail page."
      size="md"
      footer={
        <>
          <ModalCancelButton onClick={onClose} />
          <ModalPrimaryButton onClick={handleSubmit} disabled={!form.name.trim()}>
            Add skill
          </ModalPrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="skill-name" className={modalFieldLabelClass}>
            Skill name
          </label>
          <input
            ref={nameRef}
            id="skill-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. React, Figma, Technical writing"
            className={modalInputClass}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="skill-level" className={modalFieldLabelClass}>
            Level
          </label>
          <select
            id="skill-level"
            value={form.level}
            onChange={(e) =>
              setForm((p) => ({ ...p, level: e.target.value as MockSkill["level"] }))
            }
            className={modalInputClass}
          >
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="skill-category" className={modalFieldLabelClass}>
            Category
          </label>
          <select
            id="skill-category"
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({ ...p, category: e.target.value as MockSkill["category"] }))
            }
            className={modalInputClass}
          >
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

export function buildSkillFromForm(form: AddSkillFormState): MockSkill {
  const name = form.name.trim();
  return {
    id: `skill-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`,
    name,
    level: form.level,
    category: form.category,
    tasksCompletedWithThisSkill: 0,
    evidenceCount: 0,
  };
}
