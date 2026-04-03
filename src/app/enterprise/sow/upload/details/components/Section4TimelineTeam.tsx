"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";

interface Props { onComplete: () => void; onBack?: () => void }

export function Section4TimelineTeam({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.timelineTeam;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("timelineTeam", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("timelineTeam", { ...data, ...patch });
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
    const err = validateField("timelineTeam", field, data);
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

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
    <>
      <SectionHeader number={4} title="Timeline, Team & Testing" />

      <div className="px-6 py-6 space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start Date" error={errors.startDate}>
            <input type="date" value={data.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              onBlur={() => blurField("startDate")}
              className={inputCls} />
          </Field>
          <Field label="Target End Date" error={errors.targetEndDate}>
            <input type="date" value={data.targetEndDate}
              onChange={(e) => update({ targetEndDate: e.target.value })}
              onBlur={() => blurField("targetEndDate")}
              className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Estimated Team Size">
            <select value={data.estimatedTeamSize}
              onChange={(e) => update({ estimatedTeamSize: e.target.value })}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="1-3">1–3</option>
              <option value="4-8">4–8</option>
              <option value="9-15">9–15</option>
              <option value="16-25">16–25</option>
              <option value="25+">25+</option>
            </select>
          </Field>
          <Field label="Work Model">
            <select value={data.workModel}
              onChange={(e) => update({ workModel: e.target.value })}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="remote">Fully remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
              <option value="flexible">Flexible</option>
            </select>
          </Field>
        </div>

        <div className="rounded-2xl border border-gold-200 bg-gold-50/40 px-5 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0" />
            <span className="text-[12px] font-semibold text-gold-800">UAT Sign-off Authority</span>
          </div>
          <p className="text-[11px] text-gold-700 leading-relaxed">
            This person&apos;s formal sign-off triggers the <span className="font-semibold">M3 payment milestone</span>. Must be confirmed explicitly — never auto-accepted even when the section is pre-populated.
          </p>
          <Field label="Full Name & Job Title" error={errors.uatSignOffAuthority}>
            <input type="text" value={data.uatSignOffAuthority}
              onChange={(e) => update({ uatSignOffAuthority: e.target.value })}
              onBlur={() => blurField("uatSignOffAuthority")}
              placeholder="e.g. Sarah Chen — VP Engineering"
              className={inputCls} />
          </Field>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={data.uatSignOffConfirmed}
              onChange={(e) => updateCheckbox({ uatSignOffConfirmed: e.target.checked }, "uatSignOffConfirmed")}
              className="w-4 h-4 rounded border-gold-300 mt-0.5 accent-gold-500" />
            <span className="text-[12px] font-medium text-gold-800">
              I confirm this is the correct UAT sign-off authority for this project
            </span>
          </label>
          {errors.uatSignOffConfirmed && (
            <p className="text-[11px] text-red-500 font-medium">{errors.uatSignOffConfirmed}</p>
          )}
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
