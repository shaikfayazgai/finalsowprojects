"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";

interface Props { onComplete: () => void; onBack?: () => void }

export function Section3TechIntegrations({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.techIntegrations;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const [aiLoading, setAiLoading] = React.useState(false);
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("techIntegrations", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("techIntegrations", { ...data, ...patch });
      setErrors((prev) => {
        const next = { ...prev };
        for (const f of touched.current) {
          if (allErrs[f]) next[f] = allErrs[f]; else delete next[f];
        }
        return next;
      });
    }
  };

  const blurField = (field: string) => {
    touched.current.add(field);
    const err = validateField("techIntegrations", field, data);
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

  const handleAutoFill = () => {
    setAiLoading(true);
    setTimeout(() => {
      update({
        technologyStack:
          "React 19 (frontend) · Node.js 20 LTS (API layer) · PostgreSQL 16 (primary database) · Redis 7 (caching/sessions) · AWS ECS + RDS (hosting) · CloudFront CDN · GitHub Actions (CI/CD)",
        scalabilityRequirements:
          "Target 500 concurrent users with < 300ms p95 API response time. Auto-scaling via ECS (min 2 / max 10 replicas). Read replicas for reporting workloads. CDN caching for static assets (TTL 24h). Load testing baseline required before UAT sign-off.",
        userManagementScope:
          "SSO via Azure AD with role-based access control (RBAC). Three roles: Admin, Manager, Viewer. User provisioning via SCIM 2.0. MFA enforced for Admin role. Session timeout: 8 hours idle.",
        ssoRequired: true,
      });
      setAiLoading(false);
    }, 1400);
  };

  const handleComplete = () => {
    const errs = validateSection("techIntegrations", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <>
      <SectionHeader
        number={3}
        title="Technical Architecture & Integrations"
        onAIFill={handleAutoFill}
        aiLoading={aiLoading}
      />

      <div className="px-6 py-6 space-y-5">

        <Field label="Technology Stack" error={errors.technologyStack}>
          <textarea rows={3} value={data.technologyStack}
            onChange={(e) => update({ technologyStack: e.target.value })}
            onBlur={() => blurField("technologyStack")}
            placeholder="React 19 + Node.js + PostgreSQL, deployed on AWS (ap-south-1)…"
            className={inputCls + " resize-none"} />
        </Field>

        <Field label="Scalability & Performance Requirements">
          <textarea rows={2} value={data.scalabilityRequirements}
            onChange={(e) => update({ scalabilityRequirements: e.target.value })}
            placeholder="Support 500 concurrent users with < 500ms p95 response time…"
            className={inputCls + " resize-none"} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="User Management Scope">
            <input type="text" value={data.userManagementScope}
              onChange={(e) => update({ userManagementScope: e.target.value })}
              placeholder="SSO via Azure AD with RBAC…"
              className={inputCls} />
          </Field>

          <Field label="SSO Required">
            <label className="flex items-center gap-3 h-[42px] px-3.5 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-brown-200 transition-colors">
              <input type="checkbox" checked={data.ssoRequired}
                onChange={(e) => update({ ssoRequired: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 accent-brown-500" />
              <span className="text-[13px] text-gray-700">SSO is required for this project</span>
            </label>
          </Field>
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
