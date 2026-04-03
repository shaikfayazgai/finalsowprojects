"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";

interface Props { onComplete: () => void; onBack?: () => void }

const REGULATIONS = ["GDPR", "SOC 2", "ISO 27001", "PCI-DSS", "HIPAA", "SEBI", "RBI", "DPDP Act"];

export function Section6GovernanceCompliance({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.governance;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("governance", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("governance", { ...data, ...patch });
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
    const err = validateField("governance", field, data);
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

  const updateCheckbox = (patch: Partial<typeof data>, field: string) => {
    touched.current.add(field);
    update(patch);
  };

  const handleComplete = () => {
    const errs = validateSection("governance", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <>
      <SectionHeader number={6} title="Governance & Compliance" />

      <div className="px-6 py-6 space-y-5">

        {/* Non-discrimination — mandatory hard block */}
        <div className="rounded-2xl border border-brown-200 bg-brown-50/40 px-5 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={data.nonDiscriminationConfirmed}
              onChange={(e) => updateCheckbox({ nonDiscriminationConfirmed: e.target.checked }, "nonDiscriminationConfirmed")}
              className="w-4 h-4 rounded border-brown-300 mt-0.5 accent-brown-500" />
            <div>
              <span className="block text-[12px] font-semibold text-brown-800 mb-1">
                Non-Discrimination Confirmation <span className="text-red-400">*</span>
              </span>
              <p className="text-[11px] text-brown-700 leading-relaxed">
                This project will not discriminate against contributors based on gender, race, religion, disability, or any other protected characteristic.
              </p>
            </div>
          </label>
          {errors.nonDiscriminationConfirmed && (
            <p className="text-[11px] text-red-500 font-medium mt-2 pl-7">{errors.nonDiscriminationConfirmed}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Data Sensitivity Level" error={errors.dataSensitivityLevel}
            hint="No default — explicit selection required.">
            <select value={data.dataSensitivityLevel}
              onChange={(e) => update({ dataSensitivityLevel: e.target.value as typeof data.dataSensitivityLevel })}
              onBlur={() => blurField("dataSensitivityLevel")}
              className={inputCls}>
              <option value="">Select sensitivity level…</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </Field>

          <Field label="Personal Data Involved" error={errors.personalDataInvolved}>
            <select value={data.personalDataInvolved}
              onChange={(e) => update({ personalDataInvolved: e.target.value as typeof data.personalDataInvolved })}
              onBlur={() => blurField("personalDataInvolved")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>

        <Field label="Data Residency Requirement">
          <select value={data.dataResidency}
            onChange={(e) => update({ dataResidency: e.target.value })}
            className={inputCls}>
            <option value="">Select…</option>
            <option value="india_only">India only</option>
            <option value="eu_only">EU only</option>
            <option value="us_only">US only</option>
            <option value="no_restriction">No restriction</option>
            <option value="custom">Custom</option>
          </select>
        </Field>

        {/* Regulatory frameworks */}
        <Field label="Regulatory Frameworks">
          <div className="flex flex-wrap gap-2 pt-0.5">
            {REGULATIONS.map((reg) => (
              <label key={reg}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brown-300 hover:bg-brown-50/30 cursor-pointer transition-colors">
                <input type="checkbox" checked={data.regulatoryFrameworks.includes(reg)}
                  onChange={(e) => update({
                    regulatoryFrameworks: e.target.checked
                      ? [...data.regulatoryFrameworks, reg]
                      : data.regulatoryFrameworks.filter((r) => r !== reg),
                  })}
                  className="w-3.5 h-3.5 rounded border-gray-300 accent-brown-500" />
                <span className="text-[12px] text-gray-700">{reg}</span>
              </label>
            ))}
          </div>
        </Field>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
