"use client";

import * as React from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, type SectionErrors } from "@/lib/validations/sow-upload-details";

interface Props { onComplete: () => void; onBack?: () => void }

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>{error}</p>;
}

export function Section6GovernanceCompliance({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.governance;
  const update = (patch: Partial<typeof data>) => store.updateCommercialSection("governance", patch);
  const [errors, setErrors] = React.useState<SectionErrors>({});

  const regulations = ["GDPR", "SOC 2", "ISO 27001", "PCI-DSS", "HIPAA", "SEBI", "RBI", "DPDP Act"];

  const handleComplete = () => {
    const errs = validateSection("governance", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-gray-900">6. Governance & Compliance</h2>
        <span className="text-[10px] text-gray-400">FSD §7.6.4 Section 6</span>
      </div>

      {/* Non-discrimination — mandatory hard block */}
      <div className="rounded-2xl border border-brown-200 bg-brown-50/50 px-5 py-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={data.nonDiscriminationConfirmed}
            onChange={(e) => update({ nonDiscriminationConfirmed: e.target.checked })}
            className="w-4 h-4 rounded border-brown-300 mt-0.5" />
          <div>
            <span className="text-[12px] font-semibold text-brown-800">Non-Discrimination Confirmation *</span>
            <p className="text-[11px] text-brown-700 mt-1 leading-relaxed">
              This project will not discriminate against contributors based on gender, race, religion, disability, or any other protected characteristic.
            </p>
          </div>
        </label>
        <FieldError error={errors.nonDiscriminationConfirmed} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Data Sensitivity Level *</label>
        <p className="text-[10px] text-gray-400 mb-1.5">No default — explicit selection required.</p>
        <select value={data.dataSensitivityLevel} onChange={(e) => update({ dataSensitivityLevel: e.target.value as typeof data.dataSensitivityLevel })}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select sensitivity level...</option>
          <option value="public">Public</option>
          <option value="internal">Internal</option>
          <option value="confidential">Confidential</option>
          <option value="restricted">Restricted</option>
        </select>
        <FieldError error={errors.dataSensitivityLevel} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Personal Data Involved *</label>
        <select value={data.personalDataInvolved} onChange={(e) => update({ personalDataInvolved: e.target.value as typeof data.personalDataInvolved })}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        <FieldError error={errors.personalDataInvolved} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Data Residency Requirement</label>
        <select value={data.dataResidency} onChange={(e) => update({ dataResidency: e.target.value })}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="india_only">India only</option>
          <option value="eu_only">EU only</option>
          <option value="us_only">US only</option>
          <option value="no_restriction">No restriction</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-2 block">Regulatory Frameworks</label>
        <div className="flex flex-wrap gap-2">
          {regulations.map((reg) => (
            <label key={reg} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-brown-300 cursor-pointer transition-colors">
              <input type="checkbox" checked={data.regulatoryFrameworks.includes(reg)}
                onChange={(e) => update({
                  regulatoryFrameworks: e.target.checked
                    ? [...data.regulatoryFrameworks, reg]
                    : data.regulatoryFrameworks.filter((r) => r !== reg),
                })}
                className="w-3 h-3 rounded border-gray-300" />
              <span className="text-[11px] text-gray-700">{reg}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : <span />}
        <button onClick={handleComplete}
          className="flex items-center gap-2 text-[12px] font-semibold text-white bg-linear-to-r from-forest-400 to-forest-600 px-5 py-2.5 rounded-xl transition-all">
          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete & Next
        </button>
      </div>
    </div>
  );
}
