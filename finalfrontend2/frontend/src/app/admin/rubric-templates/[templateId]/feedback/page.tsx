"use client";

/**
 * Platform Admin · Rubric feedback library — Aurora Glass.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useAdminRubric, useRubricFeedback } from "@/lib/hooks/use-admin-rubrics";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { saveRubricFeedback } from "@/lib/admin/mocks/rubrics-service";
import type { MockFeedbackSnippet } from "@/mocks/admin/rubrics";
import {
  AuroraInput,
  AuroraSelect,
  AuroraTextarea,
  Crumbs,
  Field,
  GlassCard,
  PageHeader,
  TONE,
  primaryBtnClass,
  primaryStyle,
} from "../../../_shell/aurora-ui";

export default function AdminRubricFeedbackPage() {
  const params = useParams<{ templateId: string }>();
  const template = useAdminRubric(params.templateId);
  const seed = useRubricFeedback(params.templateId);
  const canEdit = useAdminSectionCanEdit("rubricTemplates");
  const [items, setItems] = React.useState<MockFeedbackSnippet[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(seed);
  }, [seed]);

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!template) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Crumbs items={[{ label: "Rubric templates", href: "/admin/rubric-templates" }, { label: "Not found" }]} />
        <p className="font-body text-[13px] text-text-secondary">Template not found.</p>
      </div>
    );
  }

  const templateId = template.id;

  function updateItem(idx: number, patch: Partial<MockFeedbackSnippet>) {
    setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItems((list) => list.filter((_, i) => i !== idx));
  }
  function addItem() {
    setItems((list) => [...list, { id: `fb-${Date.now()}`, criterionLabel: template!.criteria[0]?.label ?? "General", scoreRange: "3", text: "" }]);
  }
  function handleSave() {
    saveRubricFeedback(templateId, items);
    setToast("Feedback library saved.");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold" style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}>
          {toast}
        </div>
      )}

      <Crumbs items={[{ label: "Rubric templates", href: "/admin/rubric-templates" }, { label: template.name, href: `/admin/rubric-templates/${template.id}` }, { label: "Feedback" }]} />

      <PageHeader
        eyebrow="Platform · Template"
        title="Feedback library"
        subtitle={`Starter comments mentors can paste into ${template.name} reviews — keyed to criteria and score ranges.`}
        actions={
          canEdit ? (
            <button type="button" onClick={handleSave} className={primaryBtnClass} style={primaryStyle}>
              Save library
            </button>
          ) : undefined
        }
      />

      <GlassCard className="overflow-hidden">
        <ul className="px-3 sm:px-4 py-3 space-y-2.5">
          {items.length === 0 && (
            <li className="px-2 py-10 text-center font-body text-[12.5px] text-text-tertiary">No feedback snippets yet.</li>
          )}
          {items.map((item, i) => (
            <li key={item.id} className="rounded-xl border border-white/60 bg-white/45 px-4 py-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Criterion">
                  <AuroraSelect value={item.criterionLabel} onChange={(e) => updateItem(i, { criterionLabel: e.target.value })} disabled={!canEdit}>
                    {template.criteria.map((c) => (
                      <option key={c.id} value={c.label}>{c.label}</option>
                    ))}
                  </AuroraSelect>
                </Field>
                <Field label="Score range">
                  <AuroraInput value={item.scoreRange} onChange={(e) => updateItem(i, { scoreRange: e.target.value })} placeholder="e.g. 1–2 or 4–5" disabled={!canEdit} readOnly={!canEdit} />
                </Field>
              </div>
              <Field label="Feedback text">
                <AuroraTextarea value={item.text} onChange={(e) => updateItem(i, { text: e.target.value })} rows={2} className="min-h-[64px]" disabled={!canEdit} readOnly={!canEdit} />
              </Field>
              {canEdit && (
                <button type="button" onClick={() => removeItem(i)} className="inline-flex items-center gap-1 font-body text-[11.5px] font-medium text-text-tertiary hover:text-[var(--color-error-text)] transition-colors">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-white/55">
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold" style={{ color: TONE.ai.text }}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Add snippet
            </button>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-end">
        <Link href={`/admin/rubric-templates/${template.id}`} className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors">
          Back to template
        </Link>
      </div>
    </div>
  );
}
