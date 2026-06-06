"use client";

import type { EmailTemplate, EmailTemplateId } from "@/lib/stores/email-template-store";
import { getTestPayload } from "@/app/admin/email-templates/constants";

export function EmailTemplateLivePreview({
  template,
  selectedId,
}: {
  template: EmailTemplate;
  selectedId: EmailTemplateId;
}) {
  const vars = getTestPayload(selectedId);
  const interpolate = (str: string) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

  return (
    <div
      className="rounded-lg border border-stroke-subtle overflow-hidden font-body text-[14px]"
      style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif" }}
    >
      <div className="px-6 py-5" style={{ backgroundColor: template.headerColor }}>
        <span className="text-white font-semibold text-[18px]">Glimmora</span>
      </div>
      <div className="p-6 bg-surface">
        <div
          className="text-[11px] font-bold uppercase tracking-[0.05em] mb-3"
          style={{ color: template.headerColor }}
        >
          Preview
        </div>
        <div
          className="text-[13px] leading-relaxed text-text-secondary [&_a]:text-brand-emphasis [&_a]:underline [&_strong]:text-foreground"
          dangerouslySetInnerHTML={{ __html: interpolate(template.bodyHtml) }}
        />
      </div>
      <div className="border-t border-stroke-subtle px-6 py-3 bg-bg-subtle/40">
        <p className="text-[11px] text-text-tertiary m-0">{template.footerText}</p>
      </div>
    </div>
  );
}
