"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { Info } from "lucide-react";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";
import { SelectDropdown } from "@/components/ui/select-dropdown";

interface Props { onComplete: () => void; onBack?: () => void }

const REGULATIONS = ["GDPR", "SOC 2", "ISO 27001", "PCI-DSS", "HIPAA", "SEBI", "RBI", "DPDP Act"];

export function Section6GovernanceCompliance({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.governance;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const [showSensitivityNotes, setShowSensitivityNotes] = React.useState(false);
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
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Data Sensitivity Level
              </label>
              <button
                type="button"
                onClick={() => setShowSensitivityNotes((v) => !v)}
                className={`transition-colors ${showSensitivityNotes ? "text-brown-500" : "text-gray-400 hover:text-brown-500"}`}
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            {showSensitivityNotes && (
              <p className="text-[11px] text-brown-600 leading-relaxed">
                Classify the data this project will handle. <span className="font-semibold">Public</span> — freely shareable. <span className="font-semibold">Internal</span> — company-only. <span className="font-semibold">Confidential</span> — restricted, contains PII or trade secrets. <span className="font-semibold">Restricted</span> — highest protection, financial/legal/regulated data.
              </p>
            )}
            <SelectDropdown
              value={data.dataSensitivityLevel ?? ""}
              onChange={(val) => { update({ dataSensitivityLevel: val as typeof data.dataSensitivityLevel }); blurField("dataSensitivityLevel"); }}
              placeholder="Select sensitivity level…"
              searchable={false}
              dropdownHeight={160}
              error={!!errors.dataSensitivityLevel}
              options={[
                { value: "public", label: "Public" },
                { value: "internal", label: "Internal" },
                { value: "confidential", label: "Confidential" },
                { value: "restricted", label: "Restricted" },
              ]}
            />
            {errors.dataSensitivityLevel && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.dataSensitivityLevel}</p>
            )}
          </div>

          <Field label="Personal Data Involved" error={errors.personalDataInvolved}>
            <SelectDropdown
              value={data.personalDataInvolved ?? ""}
              onChange={(val) => { update({ personalDataInvolved: val as typeof data.personalDataInvolved }); blurField("personalDataInvolved"); }}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={80}
              error={!!errors.personalDataInvolved}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </Field>
        </div>

        <Field label="Data Residency Requirement">
          <SelectDropdown
            value={data.dataResidency ?? ""}
            onChange={(val) => update({ dataResidency: val })}
            placeholder="Select…"
            searchable={false}
            dropdownHeight={200}
            options={[
              { value: "india_only", label: "India only" },
              { value: "eu_only", label: "EU only" },
              { value: "us_only", label: "US only" },
              { value: "no_restriction", label: "No restriction" },
              { value: "custom", label: "Custom" },
            ]}
          />
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
