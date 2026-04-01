"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";

interface Props { onComplete: () => void; onBack?: () => void }

export function Section7CommercialLegal({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.commercialLegal;
  const auth = store.approvalAuthorities;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const merged = () => ({ ...data, ...auth });

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("commercialLegal", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("commercialLegal", { ...merged(), ...patch });
      setErrors((prev) => {
        const next = { ...prev };
        for (const f of touched.current) {
          if (allErrs[f]) next[f] = allErrs[f]; else delete next[f];
        }
        return next;
      });
    }
  };

  const updateAuth = (patch: Partial<typeof auth>) => {
    store.setApprovalAuthorities(patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("commercialLegal", { ...merged(), ...patch });
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
    const err = validateField("commercialLegal", field, merged());
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

  const handleComplete = () => {
    const errs = validateSection("commercialLegal", merged());
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <>
      <SectionHeader number={7} title="Commercial & Legal" fsdRef="FSD §7.6.4 Section 7" />

      <div className="px-6 py-6 space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="IP Ownership" error={errors.ipOwnership}>
            <select value={data.ipOwnership}
              onChange={(e) => update({ ipOwnership: e.target.value as typeof data.ipOwnership })}
              onBlur={() => blurField("ipOwnership")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="client_owns_all">Client owns all IP (transfer on M3)</option>
              <option value="glimmora_retains_framework">GlimmoraTeam retains framework — client owns app</option>
              <option value="joint">Joint (per NDA)</option>
              <option value="custom">Custom</option>
            </select>
          </Field>

          <Field label="Source Code Repository" error={errors.sourceCodeOwnership}>
            <select value={data.sourceCodeOwnership}
              onChange={(e) => update({ sourceCodeOwnership: e.target.value as typeof data.sourceCodeOwnership })}
              onBlur={() => blurField("sourceCodeOwnership")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="client_hosts">Client owns and hosts throughout</option>
              <option value="glimmora_hosts_transfer">GlimmoraTeam hosts, transfers on M3</option>
              <option value="client_provides_day_one">Client provides repository from day one</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Warranty Period" error={errors.warrantyPeriod}>
            <select value={data.warrantyPeriod}
              onChange={(e) => update({ warrantyPeriod: e.target.value as typeof data.warrantyPeriod })}
              onBlur={() => blurField("warrantyPeriod")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="30_days">30 days</option>
              <option value="60_days">60 days</option>
              <option value="90_days">90 days</option>
              <option value="6_months">6 months</option>
              <option value="none">No warranty</option>
            </select>
          </Field>

          <Field label="Third-Party Licensing Costs" error={errors.thirdPartyCosts}>
            <select value={data.thirdPartyCosts}
              onChange={(e) => update({ thirdPartyCosts: e.target.value as typeof data.thirdPartyCosts })}
              onBlur={() => blurField("thirdPartyCosts")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="client_pays">Client pays all third-party costs directly</option>
              <option value="glimmora_absorbs">GlimmoraTeam absorbs within quote</option>
              <option value="split">Split</option>
            </select>
          </Field>
        </div>

        <Field label="Change Request Process" error={errors.changeRequestProcess}>
          <select value={data.changeRequestProcess}
            onChange={(e) => update({ changeRequestProcess: e.target.value as typeof data.changeRequestProcess })}
            onBlur={() => blurField("changeRequestProcess")}
            className={inputCls}>
            <option value="">Select…</option>
            <option value="formal_cr">Formal CR — all changes priced before work begins</option>
            <option value="threshold_cr">Threshold-based — minor changes within contingency</option>
            <option value="time_and_materials">T&amp;M above baseline</option>
          </select>
        </Field>

        {/* Approval Authorities subsection */}
        <div className="pt-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Approval Authorities
          </p>

          <div className="rounded-2xl border border-gold-200 bg-gold-50/40 px-5 py-3.5 mb-4 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gold-700 leading-relaxed">
              <span className="font-semibold">Business Owner must differ from the SOW submitter.</span> The platform enforces this — selecting yourself will block submission.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="Business Owner Approver (Stage 1)" error={errors.businessOwnerApprover}>
              <input type="text" value={auth.businessOwnerApprover}
                onChange={(e) => updateAuth({ businessOwnerApprover: e.target.value })}
                onBlur={() => blurField("businessOwnerApprover")}
                placeholder="Full name of Business Owner"
                className={inputCls} />
            </Field>

            <Field label="Final Approver (Stage 5)" error={errors.finalApprover}>
              <input type="text" value={auth.finalApprover}
                onChange={(e) => updateAuth({ finalApprover: e.target.value })}
                onBlur={() => blurField("finalApprover")}
                placeholder="Full name of Final Approver"
                className={inputCls} />
            </Field>

            <Field label="Legal / Compliance Reviewer">
              <input type="text" value={auth.legalReviewer || ""}
                onChange={(e) => updateAuth({ legalReviewer: e.target.value })}
                placeholder="Optional — can be designated later"
                className={inputCls} />
            </Field>
          </div>
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} completeLabel="Mark Complete" />
    </>
  );
}
