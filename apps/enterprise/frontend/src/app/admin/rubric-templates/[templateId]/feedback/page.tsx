"use client";

/**
 * Platform Admin · Rubric feedback library — spec doc 04 §5.F.2.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAdminRubric, useRubricFeedback } from "@/lib/hooks/use-admin-rubrics";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { saveRubricFeedback } from "@/lib/admin/mocks/rubrics-service";
import type { MockFeedbackSnippet } from "@/mocks/admin/rubrics";

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
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link href="/admin/rubric-templates" className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Rubric templates
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Template not found.</p>
      </div>
    );
  }

  const templateId = template.id;
  const criteriaOptions = template.criteria;

  function updateItem(idx: number, patch: Partial<MockFeedbackSnippet>) {
    setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItems((list) => list.filter((_, i) => i !== idx));
  }
  function addItem() {
    setItems((list) => [
      ...list,
      {
        id: `fb-${Date.now()}`,
        criterionLabel: criteriaOptions[0]?.label ?? "General",
        scoreRange: "3",
        text: "",
      },
    ]);
  }
  function handleSave() {
    saveRubricFeedback(templateId, items);
    setToast("Feedback library saved.");
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-lg border border-success-border bg-success-subtle px-4 py-2 font-body text-[12.5px] text-success-text">{toast}</div>
      )}

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-body text-[12px] text-text-tertiary">
        <Link href="/admin/rubric-templates" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Rubric templates</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <Link href={`/admin/rubric-templates/${template.id}`} className="px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast">{template.name}</Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Feedback library</span>
      </nav>

      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">Feedback library · {template.name}</h1>
        <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">Starter comments mentors can paste into reviews.</p>
      </header>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
        <ul className="divide-y divide-stroke-subtle">
          {items.length === 0 && (
            <li className="px-4 py-8 text-center font-body text-[13px] text-text-tertiary">No feedback snippets yet.</li>
          )}
          {items.map((item, i) => (
            <li key={item.id} className="px-4 py-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block font-body text-[11px] font-semibold text-foreground mb-1">Criterion</span>
                  <select
                    value={item.criterionLabel}
                    onChange={(e) => updateItem(i, { criterionLabel: e.target.value })}
                    className={inputCls}
                    disabled={!canEdit}
                  >
                    {template.criteria.map((c) => (
                      <option key={c.id} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block font-body text-[11px] font-semibold text-foreground mb-1">Score range</span>
                  <input
                    value={item.scoreRange}
                    onChange={(e) => updateItem(i, { scoreRange: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 1–2 or 4–5"
                    disabled={!canEdit}
                    readOnly={!canEdit}
                  />
                </label>
              </div>
              <label className="block">
                <span className="block font-body text-[11px] font-semibold text-foreground mb-1">Feedback text</span>
                <textarea
                  value={item.text}
                  onChange={(e) => updateItem(i, { text: e.target.value })}
                  rows={2}
                  className={cnInput}
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />
              </label>
              {canEdit && (
                <button type="button" onClick={() => removeItem(i)} className="inline-flex items-center gap-1 font-body text-[11.5px] text-text-tertiary hover:text-error-text">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className="px-4 py-3 border-t border-stroke-subtle">
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:text-brand transition-colors">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Add snippet
            </button>
          </div>
        )}
      </section>

      <footer className="flex items-center justify-between pt-2">
        <Link href={`/admin/rubric-templates/${template.id}`} className="font-body text-[13px] text-text-secondary hover:text-foreground transition-colors">Back to template</Link>
        {canEdit && (
          <button type="button" onClick={handleSave} className="inline-flex items-center h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">
            Save library
          </button>
        )}
      </footer>
    </div>
  );
}

const inputCls = "block w-full h-9 px-3 rounded-md border border-stroke bg-surface font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-60";
const cnInput = `${inputCls} h-auto resize-y`;
