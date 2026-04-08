"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";
import { SelectDropdown } from "@/components/ui/select-dropdown";

interface Props { onComplete: () => void; onBack?: () => void }

export function Section1BusinessContext({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.businessContext;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("businessContext", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("businessContext", { ...data, ...patch });
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
    const err = validateField("businessContext", field, data);
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

  const handleComplete = () => {
    const errs = validateSection("businessContext", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <>
      <SectionHeader number={1} title="Business Context & Vision" />

      <div className="px-6 py-6 space-y-5">

        <Field label="Project Vision" error={errors.projectVision}
          hint="Min 50 chars. Becomes the SOW opening vision statement.">
          <textarea rows={3} value={data.projectVision}
            onChange={(e) => update({ projectVision: e.target.value })}
            onBlur={() => blurField("projectVision")}
            placeholder="Describe the project vision and high-level objective…"
            className={inputCls + " resize-none"} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business Criticality" error={errors.businessCriticality}>
            <SelectDropdown
              value={data.businessCriticality ?? ""}
              onChange={(val) => { touched.current.add("businessCriticality"); update({ businessCriticality: val as typeof data.businessCriticality }); }}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={160}
              error={!!errors.businessCriticality}
              options={[
                { value: "mission_critical", label: "Mission-critical" },
                { value: "business_important", label: "Business-important" },
                { value: "standard", label: "Standard" },
                { value: "low", label: "Low" },
              ]}
            />
          </Field>
        </div>

        <Field label="Definition of Project Success" error={errors.definitionOfSuccess}>
          <textarea rows={3} value={data.definitionOfSuccess}
            onChange={(e) => update({ definitionOfSuccess: e.target.value })}
            onBlur={() => blurField("definitionOfSuccess")}
            placeholder="Zero critical defects for 30 consecutive days…"
            className={inputCls + " resize-none"} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Current State (As-Is)" error={errors.currentState}
            info="Describe the existing system, or 'Not applicable — greenfield'.">
            <textarea rows={3} value={data.currentState}
              onChange={(e) => update({ currentState: e.target.value })}
              onBlur={() => blurField("currentState")}
              placeholder="Running Oracle Financials (15 years, heavily customized)…"
              className={inputCls + " resize-none"} />
          </Field>

          <Field label="Desired Future State (To-Be)" error={errors.desiredFutureState}>
            <textarea rows={3} value={data.desiredFutureState}
              onChange={(e) => update({ desiredFutureState: e.target.value })}
              onBlur={() => blurField("desiredFutureState")}
              placeholder="Automated, cloud-native platform with real-time dashboards…"
              className={inputCls + " resize-none"} />
          </Field>
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
