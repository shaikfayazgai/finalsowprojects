"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, FieldGroup, inputCls } from "./_shared";

interface Props { onComplete: () => void; onBack?: () => void }

const DEV_SCOPE_ITEMS = ["Frontend", "Backend", "Database", "Integration development", "CI/CD"];

export function Section2DeliveryScope({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.deliveryScope;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("deliveryScope", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("deliveryScope", { ...data, ...patch });
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
    const err = validateField("deliveryScope", field, data);
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

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
    <>
      <SectionHeader number={2} title="Delivery Scope Boundary" />

      <div className="px-6 py-6 space-y-5">

        {/* Development scope checkboxes */}
        <Field label="Development Scope" error={errors.developmentScope}>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {DEV_SCOPE_ITEMS.map((item) => (
              <label key={item}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:border-brown-300 hover:bg-brown-50/30 cursor-pointer transition-colors">
                <input type="checkbox" checked={data.developmentScope.includes(item)}
                  onChange={(e) => updateCheckbox(
                    e.target.checked
                      ? [...data.developmentScope, item]
                      : data.developmentScope.filter((s) => s !== item),
                  )}
                  className="w-3.5 h-3.5 rounded border-gray-300 accent-brown-500" />
                <span className="text-[12px] text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="UI/UX Design Scope" error={errors.uiuxDesignScope}>
            <select value={data.uiuxDesignScope}
              onChange={(e) => update({ uiuxDesignScope: e.target.value as typeof data.uiuxDesignScope })}
              onBlur={() => blurField("uiuxDesignScope")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="not_in_scope">Not in scope</option>
              <option value="in_scope">In scope</option>
              <option value="client_provides">Client provides designs</option>
            </select>
          </Field>

          <Field label="Deployment Scope" error={errors.deploymentScope}>
            <select value={data.deploymentScope}
              onChange={(e) => update({ deploymentScope: e.target.value as typeof data.deploymentScope })}
              onBlur={() => blurField("deploymentScope")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="not_in_scope">Not in scope (working build handover)</option>
              <option value="cloud">Deploy to cloud</option>
              <option value="on_premise">Deploy on-premise</option>
              <option value="both">Both</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Go-Live & Hypercare" error={errors.goLiveScope}>
            <select value={data.goLiveScope}
              onChange={(e) => update({ goLiveScope: e.target.value as typeof data.goLiveScope })}
              onBlur={() => blurField("goLiveScope")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="not_in_scope">Not in scope</option>
              <option value="go_live">Go-live included</option>
              <option value="go_live_hypercare">Go-live + Hypercare</option>
            </select>
          </Field>

          <Field label="Data Migration Scope" error={errors.dataMigrationScope}>
            <select value={data.dataMigrationScope}
              onChange={(e) => update({ dataMigrationScope: e.target.value as typeof data.dataMigrationScope })}
              onBlur={() => blurField("dataMigrationScope")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="not_in_scope">Not in scope</option>
              <option value="in_scope">In scope</option>
            </select>
          </Field>
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
