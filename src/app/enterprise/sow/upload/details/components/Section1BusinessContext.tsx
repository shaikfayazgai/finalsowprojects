"use client";

import * as React from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";

interface Props { onComplete: () => void; onBack?: () => void }

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>{error}</p>;
}

export function Section1BusinessContext({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.businessContext;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("businessContext", patch);
    if (touched.current.size > 0) {
      const merged = { ...data, ...patch };
      const allErrs = validateSection("businessContext", merged);
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
    const err = validateField("businessContext", field, data);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleComplete = () => {
    const errs = validateSection("businessContext", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-gray-900">1. Business Context & Vision</h2>
        <span className="text-[10px] text-gray-400">FSD §7.6.4 Section 1</span>
      </div>

      <Field label="Project Vision *" hint="Min 50 chars. Becomes the SOW opening vision statement.">
        <textarea rows={3} value={data.projectVision}
          onChange={(e) => update({ projectVision: e.target.value })}
          onBlur={() => blurField("projectVision")}
          placeholder="Describe the project vision and elevator pitch..."
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 resize-none transition-colors" />
        <FieldError error={errors.projectVision} />
      </Field>

      <Field label="Business Criticality *">
        <select value={data.businessCriticality}
          onChange={(e) => update({ businessCriticality: e.target.value as typeof data.businessCriticality })}
          onBlur={() => blurField("businessCriticality")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="mission_critical">Mission-critical</option>
          <option value="business_important">Business-important</option>
          <option value="standard">Standard</option>
          <option value="low">Low</option>
        </select>
        <FieldError error={errors.businessCriticality} />
      </Field>

      <Field label="Current State (As-Is) *" hint="Describe the current system or 'Not applicable — greenfield'.">
        <textarea rows={2} value={data.currentState}
          onChange={(e) => update({ currentState: e.target.value })}
          onBlur={() => blurField("currentState")}
          placeholder="Running Oracle Financials (15 years)..."
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 resize-none transition-colors" />
        <FieldError error={errors.currentState} />
      </Field>

      <Field label="Desired Future State (To-Be) *">
        <textarea rows={2} value={data.desiredFutureState}
          onChange={(e) => update({ desiredFutureState: e.target.value })}
          onBlur={() => blurField("desiredFutureState")}
          placeholder="Automated, cloud-native ERP with real-time dashboards..."
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 resize-none transition-colors" />
        <FieldError error={errors.desiredFutureState} />
      </Field>

      <Field label="Definition of Project Success *">
        <textarea rows={2} value={data.definitionOfSuccess}
          onChange={(e) => update({ definitionOfSuccess: e.target.value })}
          onBlur={() => blurField("definitionOfSuccess")}
          placeholder="All financial operations running on the new platform with zero critical defects..."
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 resize-none transition-colors" />
        <FieldError error={errors.definitionOfSuccess} />
      </Field>

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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">{label}</label>
      {hint && <p className="text-[10px] text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
