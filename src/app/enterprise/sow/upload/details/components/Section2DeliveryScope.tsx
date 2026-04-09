"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, FieldGroup, inputCls } from "./_shared";
import { SelectDropdown } from "@/components/ui/select-dropdown";

interface Props { onComplete: () => void; onBack?: () => void }

const DEV_SCOPE_ITEMS = ["Frontend", "Backend","Integration development", "CI/CD"];

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
            <SelectDropdown
              value={data.uiuxDesignScope ?? ""}
              onChange={(val) => { touched.current.add("uiuxDesignScope"); update({ uiuxDesignScope: val as typeof data.uiuxDesignScope }); }}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={120}
              error={!!errors.uiuxDesignScope}
              options={[
                { value: "not_in_scope", label: "Not in scope" },
                { value: "in_scope", label: "In scope" },
                { value: "client_provides", label: "Client provides designs" },
              ]}
            />
          </Field>

          <Field label="Deployment Scope" error={errors.deploymentScope}>
            <SelectDropdown
              value={data.deploymentScope ?? ""}
              onChange={(val) => { touched.current.add("deploymentScope"); update({ deploymentScope: val as typeof data.deploymentScope }); }}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={160}
              error={!!errors.deploymentScope}
              options={[
                { value: "not_in_scope", label: "Not in scope (working build handover)" },
                { value: "cloud", label: "Deploy to cloud" },
                { value: "on_premise", label: "Deploy on-premise" },
                { value: "both", label: "Both" },
              ]}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Go-Live & Hypercare" error={errors.goLiveScope}>
            <SelectDropdown
              value={data.goLiveScope ?? ""}
              onChange={(val) => { touched.current.add("goLiveScope"); update({ goLiveScope: val as typeof data.goLiveScope }); }}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={120}
              error={!!errors.goLiveScope}
              options={[
                { value: "not_in_scope", label: "Not in scope" },
                { value: "go_live", label: "Go-live included" },
                { value: "go_live_hypercare", label: "Go-live + Hypercare" },
              ]}
            />
          </Field>

          <Field label="Data Migration Scope" error={errors.dataMigrationScope}>
            <SelectDropdown
              value={data.dataMigrationScope ?? ""}
              onChange={(val) => { touched.current.add("dataMigrationScope"); update({ dataMigrationScope: val as typeof data.dataMigrationScope }); }}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={80}
              error={!!errors.dataMigrationScope}
              options={[
                { value: "not_in_scope", label: "Not in scope" },
                { value: "in_scope", label: "In scope" },
              ]}
            />
          </Field>
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
