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

export function Section7CommercialLegal({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.commercialLegal;
  const auth = store.approvalAuthorities;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  // Section 7 validates merged commercialLegal + approvalAuthorities
  const merged = () => ({ ...data, ...auth });

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("commercialLegal", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("commercialLegal", { ...merged(), ...patch });
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

  const updateAuth = (patch: Partial<typeof auth>) => {
    store.setApprovalAuthorities(patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("commercialLegal", { ...merged(), ...patch });
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
    const err = validateField("commercialLegal", field, merged());
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleComplete = () => {
    const errs = validateSection("commercialLegal", merged());
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-gray-900">7. Commercial & Legal + Approval Authorities</h2>
        <span className="text-[10px] text-gray-400">FSD §7.6.4 Section 7</span>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">IP Ownership *</label>
        <select value={data.ipOwnership}
          onChange={(e) => update({ ipOwnership: e.target.value as typeof data.ipOwnership })}
          onBlur={() => blurField("ipOwnership")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="client_owns_all">Client owns all IP (transfer on M3 payment)</option>
          <option value="glimmora_retains_framework">GlimmoraTeam retains framework — client owns application</option>
          <option value="joint">Joint (per NDA)</option>
          <option value="custom">Custom</option>
        </select>
        <FieldError error={errors.ipOwnership} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Source Code Repository Ownership *</label>
        <select value={data.sourceCodeOwnership}
          onChange={(e) => update({ sourceCodeOwnership: e.target.value as typeof data.sourceCodeOwnership })}
          onBlur={() => blurField("sourceCodeOwnership")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="client_hosts">Client owns and hosts throughout</option>
          <option value="glimmora_hosts_transfer">GlimmoraTeam hosts, transfers on M3</option>
          <option value="client_provides_day_one">Client provides repository from day one</option>
        </select>
        <FieldError error={errors.sourceCodeOwnership} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Warranty Period *</label>
        <select value={data.warrantyPeriod}
          onChange={(e) => update({ warrantyPeriod: e.target.value as typeof data.warrantyPeriod })}
          onBlur={() => blurField("warrantyPeriod")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="30_days">30 days</option>
          <option value="60_days">60 days</option>
          <option value="90_days">90 days</option>
          <option value="6_months">6 months</option>
          <option value="none">No warranty</option>
        </select>
        <FieldError error={errors.warrantyPeriod} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Change Request Process *</label>
        <select value={data.changeRequestProcess}
          onChange={(e) => update({ changeRequestProcess: e.target.value as typeof data.changeRequestProcess })}
          onBlur={() => blurField("changeRequestProcess")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="formal_cr">Formal CR — all changes priced before work begins</option>
          <option value="threshold_cr">Threshold-based — minor changes within contingency</option>
          <option value="time_and_materials">T&M above baseline</option>
        </select>
        <FieldError error={errors.changeRequestProcess} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Third-Party Licensing Costs *</label>
        <select value={data.thirdPartyCosts}
          onChange={(e) => update({ thirdPartyCosts: e.target.value as typeof data.thirdPartyCosts })}
          onBlur={() => blurField("thirdPartyCosts")}
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
          <option value="">Select...</option>
          <option value="client_pays">Client pays all third-party costs directly</option>
          <option value="glimmora_absorbs">GlimmoraTeam absorbs within quote</option>
          <option value="split">Split</option>
        </select>
        <FieldError error={errors.thirdPartyCosts} />
      </div>

      {/* Approval Authorities */}
      <div className="pt-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Approval Authorities</h3>

        <div className="rounded-2xl border border-gold-200 bg-gold-50/50 px-5 py-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-gold-600" />
            <span className="text-[11px] font-semibold text-gold-800">Business Owner must differ from SOW submitter</span>
          </div>
          <p className="text-[10px] text-gold-700">The platform enforces this rule. If you select yourself, submission will be blocked.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Business Owner Approver (Stage 1) *</label>
            <input type="text" value={auth.businessOwnerApprover}
              onChange={(e) => updateAuth({ businessOwnerApprover: e.target.value })}
              onBlur={() => blurField("businessOwnerApprover")}
              placeholder="Full name of Business Owner"
              className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
            <FieldError error={errors.businessOwnerApprover} />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Final Approver (Stage 5) *</label>
            <input type="text" value={auth.finalApprover}
              onChange={(e) => updateAuth({ finalApprover: e.target.value })}
              onBlur={() => blurField("finalApprover")}
              placeholder="Full name of Final Approver"
              className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
            <FieldError error={errors.finalApprover} />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Legal / Compliance Reviewer (optional)</label>
            <input type="text" value={auth.legalReviewer || ""}
              onChange={(e) => updateAuth({ legalReviewer: e.target.value })}
              placeholder="Can be designated later"
              className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
          </div>
        </div>
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
          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
        </button>
      </div>
    </div>
  );
}
