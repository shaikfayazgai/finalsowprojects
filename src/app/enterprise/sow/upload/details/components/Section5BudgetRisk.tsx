"use client";

import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";

interface Props { onComplete: () => void; onBack?: () => void }

export function Section5BudgetRisk({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.budgetRisk;
  const update = (patch: Partial<typeof data>) => store.updateCommercialSection("budgetRisk", patch);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-gray-900">5. Budget & Risk</h2>
        <span className="text-[10px] text-gray-400">FSD §7.6.4 Section 5</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Budget Minimum *</label>
          <input type="number" value={data.budgetMinimum || ""} onChange={(e) => update({ budgetMinimum: Number(e.target.value) })}
            placeholder="e.g. 280000"
            className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Budget Maximum *</label>
          <input type="number" value={data.budgetMaximum || ""} onChange={(e) => update({ budgetMaximum: Number(e.target.value) })}
            placeholder="e.g. 350000"
            className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Currency *</label>
          <select value={data.currency} onChange={(e) => update({ currency: e.target.value })}
            className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="AED">AED (د.إ)</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Pricing Model *</label>
          <select value={data.pricingModel} onChange={(e) => update({ pricingModel: e.target.value as typeof data.pricingModel })}
            className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
            <option value="">Select...</option>
            <option value="fixed_price">Fixed Price</option>
            <option value="time_and_materials">Time & Materials</option>
            <option value="outcome_based">Outcome-Based</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Payment schedule info */}
      <div className="rounded-xl bg-gray-50 px-4 py-3">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Platform Payment Schedule</span>
        <p className="text-[12px] text-gray-600 mt-1">30% on SOW onboarding (M1) · 35% on development (M2) · 35% on UAT sign-off (M3)</p>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Contingency Budget</label>
        <select value={data.contingencyPercent} onChange={(e) => update({ contingencyPercent: e.target.value })}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="5">5%</option>
          <option value="10">10%</option>
          <option value="15">15%</option>
          <option value="20">20%</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : <span />}
        <button onClick={onComplete}
          className="flex items-center gap-2 text-[12px] font-semibold text-white bg-gradient-to-r from-forest-400 to-forest-600 px-5 py-2.5 rounded-xl transition-all">
          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete & Next
        </button>
      </div>
    </div>
  );
}
