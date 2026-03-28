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

export function Section2DeliveryScope({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.deliveryScope;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const checkboxes = ["Frontend", "Backend", "Database", "Integration development", "CI/CD"];

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("deliveryScope", patch);
    if (touched.current.size > 0) {
      const merged = { ...data, ...patch };
      const allErrs = validateSection("deliveryScope", merged);
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
    const err = validateField("deliveryScope", field, data);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  // For checkboxes: mark touched + re-validate on change
  const updateCheckbox = (newScope: string[]) => {
    touched.current.add("developmentScope");
    update({ developmentScope: newScope });
  };

  const handleComplete = () => {
    const errs = validateSection("deliveryScope", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-gray-900">2. Delivery Scope Boundary</h2>
        <span className="text-[10px] text-gray-400">FSD §7.6.4 Section 2</span>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-2 block">Development Scope *</label>
        <div className="flex flex-wrap gap-2">
          {checkboxes.map((item) => (
            <label key={item} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-brown-300 cursor-pointer transition-colors">
              <input type="checkbox" checked={data.developmentScope.includes(item)}
                onChange={(e) => updateCheckbox(
                  e.target.checked
                    ? [...data.developmentScope, item]
                    : data.developmentScope.filter((s) => s !== item)
                )}
                className="w-3.5 h-3.5 rounded border-gray-300" />
              <span className="text-[12px] text-gray-700">{item}</span>
            </label>
          ))}
        </div>
        <FieldError error={errors.developmentScope} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">UI/UX Design Scope *</label>
        <select value={data.uiuxDesignScope}
          onChange={(e) => update({ uiuxDesignScope: e.target.value as typeof data.uiuxDesignScope })}
          onBlur={() => blurField("uiuxDesignScope")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="not_in_scope">Not in scope</option>
          <option value="in_scope">In scope</option>
          <option value="client_provides">Client provides designs</option>
        </select>
        <FieldError error={errors.uiuxDesignScope} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Deployment Scope *</label>
        <select value={data.deploymentScope}
          onChange={(e) => update({ deploymentScope: e.target.value as typeof data.deploymentScope })}
          onBlur={() => blurField("deploymentScope")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="not_in_scope">Not in scope (working build handover)</option>
          <option value="cloud">Deploy to cloud</option>
          <option value="on_premise">Deploy on-premise</option>
          <option value="both">Both</option>
        </select>
        <FieldError error={errors.deploymentScope} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Go-Live & Hypercare *</label>
        <select value={data.goLiveScope}
          onChange={(e) => update({ goLiveScope: e.target.value as typeof data.goLiveScope })}
          onBlur={() => blurField("goLiveScope")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="not_in_scope">Not in scope</option>
          <option value="go_live">Go-live included</option>
          <option value="go_live_hypercare">Go-live + Hypercare</option>
        </select>
        <FieldError error={errors.goLiveScope} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Data Migration Scope *</label>
        <select value={data.dataMigrationScope}
          onChange={(e) => update({ dataMigrationScope: e.target.value as typeof data.dataMigrationScope })}
          onBlur={() => blurField("dataMigrationScope")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="not_in_scope">Not in scope</option>
          <option value="in_scope">In scope</option>
        </select>
        <FieldError error={errors.dataMigrationScope} />
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
