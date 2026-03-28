"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";

interface Props { onComplete: () => void; onBack?: () => void }

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>{error}</p>;
}

export function Section4TimelineTeam({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.timelineTeam;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("timelineTeam", patch);
    if (touched.current.size > 0) {
      const merged = { ...data, ...patch };
      const allErrs = validateSection("timelineTeam", merged);
      setErrors((prev) => {
        const next = { ...prev };
        for (const field of touched.current) {
          if (allErrs[field]) next[field] = allErrs[field];
          else delete next[field];
        }
        return next;
      });
    }
  };

  const blurField = (field: string) => {
    touched.current.add(field);
    const err = validateField("timelineTeam", field, data);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  // Checkbox: mark touched + re-validate immediately on change
  const updateCheckbox = (patch: Partial<typeof data>, field: string) => {
    touched.current.add(field);
    update(patch);
  };

  const handleComplete = () => {
    const errs = validateSection("timelineTeam", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-gray-900">4. Timeline, Team & Testing</h2>
        <span className="text-[10px] text-gray-400">FSD §7.6.4 Section 4</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Start Date *</label>
          <input type="date" value={data.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            onBlur={() => blurField("startDate")}
            className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
          <FieldError error={errors.startDate} />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Target End Date *</label>
          <input type="date" value={data.targetEndDate}
            onChange={(e) => update({ targetEndDate: e.target.value })}
            onBlur={() => blurField("targetEndDate")}
            className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
          <FieldError error={errors.targetEndDate} />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Estimated Team Size</label>
        <select value={data.estimatedTeamSize}
          onChange={(e) => update({ estimatedTeamSize: e.target.value })}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="1-3">1–3</option>
          <option value="4-8">4–8</option>
          <option value="9-15">9–15</option>
          <option value="16-25">16–25</option>
          <option value="25+">25+</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Work Model</label>
        <select value={data.workModel}
          onChange={(e) => update({ workModel: e.target.value })}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="remote">Fully remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>

      {/* UAT Sign-off Authority */}
      <div className="rounded-2xl border border-gold-200 bg-gold-50/50 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-gold-600" />
          <span className="text-[12px] font-semibold text-gold-800">UAT Sign-off Authority</span>
        </div>
        <p className="text-[11px] text-gold-700 mb-3">
          This person&apos;s formal sign-off in the platform triggers the M3 payment milestone. Please confirm this is correct.
        </p>
        <input type="text" value={data.uatSignOffAuthority}
          onChange={(e) => update({ uatSignOffAuthority: e.target.value })}
          onBlur={() => blurField("uatSignOffAuthority")}
          placeholder="Full name + job title"
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gold-200 bg-white outline-none focus:border-gold-400 transition-colors mb-2" />
        <FieldError error={errors.uatSignOffAuthority} />
        <label className="flex items-center gap-2 cursor-pointer mt-3">
          <input type="checkbox" checked={data.uatSignOffConfirmed}
            onChange={(e) => updateCheckbox({ uatSignOffConfirmed: e.target.checked }, "uatSignOffConfirmed")}
            className="w-3.5 h-3.5 rounded border-gold-300" />
          <span className="text-[11px] font-medium text-gold-800">I confirm this is the correct UAT sign-off authority</span>
        </label>
        <FieldError error={errors.uatSignOffConfirmed} />
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
