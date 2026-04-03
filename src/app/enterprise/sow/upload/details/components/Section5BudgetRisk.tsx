"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, inputCls } from "./_shared";

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
            <select value={data.currency}
              onChange={(e) => update({ currency: e.target.value })}
              className={inputCls}>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Pricing Model" error={errors.pricingModel}>
            <select value={data.pricingModel}
              onChange={(e) => update({ pricingModel: e.target.value as typeof data.pricingModel })}
              onBlur={() => blurField("pricingModel")}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="fixed_price">Fixed Price</option>
              <option value="time_and_materials">Time &amp; Materials</option>
              <option value="outcome_based">Outcome-Based</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>

          <Field label="Contingency Budget">
            <select value={data.contingencyPercent}
              onChange={(e) => update({ contingencyPercent: e.target.value })}
              className={inputCls}>
              <option value="">Select…</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
            </select>
          </Field>
        </div>

        {/* Platform payment schedule — informational */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-3.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Platform Payment Schedule
          </p>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            30% on SOW onboarding (M1) &nbsp;·&nbsp; 35% on development completion (M2) &nbsp;·&nbsp; 35% on UAT sign-off (M3)
          </p>
        </div>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} />
    </>
  );
}
