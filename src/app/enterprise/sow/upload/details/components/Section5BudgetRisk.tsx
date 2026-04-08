"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";
import { SelectDropdown } from "@/components/ui/select-dropdown";

interface Props { onComplete: () => void; onBack?: () => void }

export function Section5BudgetRisk({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.budgetRisk;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("budgetRisk", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("budgetRisk", { ...data, ...patch });
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
    const err = validateField("budgetRisk", field, data);
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

  const handleComplete = () => {
    const errs = validateSection("budgetRisk", data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <>
      <SectionHeader number={5} title="Budget & Risk" />

      <div className="px-6 py-6 space-y-5">

        {/* Budget range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Budget Minimum" error={errors.budgetMinimum}>
            <input type="text" inputMode="numeric" value={data.budgetMinimum || ""}
              onChange={(e) => update({ budgetMinimum: Number(e.target.value.replace(/[^0-9]/g, "")) })}
              onBlur={() => blurField("budgetMinimum")}
              placeholder="280000"
              className={inputCls} />
          </Field>
          <Field label="Budget Maximum" error={errors.budgetMaximum}>
            <input type="text" inputMode="numeric" value={data.budgetMaximum || ""}
              onChange={(e) => update({ budgetMaximum: Number(e.target.value.replace(/[^0-9]/g, "")) })}
              onBlur={() => blurField("budgetMaximum")}
              placeholder="350000"
              className={inputCls} />
          </Field>
          <Field label="Currency">
            <SelectDropdown
              value={data.currency ?? "USD"}
              onChange={(val) => update({ currency: val })}
              searchable={false}
              dropdownHeight={200}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "INR", label: "INR (₹)" },
                { value: "GBP", label: "GBP (£)" },
                { value: "EUR", label: "EUR (€)" },
                { value: "AED", label: "AED (د.إ)" },
              ]}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Pricing Model" error={errors.pricingModel}>
            <SelectDropdown
              value={data.pricingModel ?? ""}
              onChange={(val) => { touched.current.add("pricingModel"); update({ pricingModel: val as typeof data.pricingModel }); }}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={160}
              error={!!errors.pricingModel}
              options={[
                { value: "fixed_price", label: "Fixed Price" },
                { value: "time_and_materials", label: "Time & Materials" },
                { value: "outcome_based", label: "Outcome-Based" },
                { value: "hybrid", label: "Hybrid" },
              ]}
            />
          </Field>

          <Field label="Contingency Budget">
            <SelectDropdown
              value={data.contingencyPercent ?? ""}
              onChange={(val) => update({ contingencyPercent: val })}
              placeholder="Select…"
              searchable={false}
              dropdownHeight={160}
              options={[
                { value: "5", label: "5%" },
                { value: "10", label: "10%" },
                { value: "15", label: "15%" },
                { value: "20", label: "20%" },
              ]}
            />
          </Field>
        </div>

        {/* Platform payment schedule — informational */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-3.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Platform Payment Schedule
          </p>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            35% on SOW onboarding (M1) &nbsp;·&nbsp; 35% on development completion (M2) &nbsp;·&nbsp; 30% on UAT sign-off (M3)
          </p>
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
