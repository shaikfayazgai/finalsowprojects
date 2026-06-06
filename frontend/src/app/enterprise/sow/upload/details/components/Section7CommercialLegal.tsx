"use client";

import * as React from "react";
import { User, Scale, Handshake, ShieldCheck } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { validateSection, validateField, type SectionErrors } from "@/lib/validations/sow-upload-details";
import { SectionHeader, SectionFooter, Field, CustomSelect, inputCls } from "./_shared";

interface Props { onComplete: () => void; onBack?: () => void; loading?: boolean }

const IP_OPTIONS = [
  { value: "client_owns_all",            label: "Client Owns All IP",              description: "Full IP transfer to client upon milestone 3 delivery" },
  { value: "glimmora_retains_framework", label: "GlimmoraTeam Retains Framework",   description: "Client owns the application; GlimmoraTeam retains reusable framework" },
  { value: "joint",                      label: "Joint Ownership",                  description: "Shared IP rights as defined in the NDA" },
  { value: "custom",                     label: "Custom Arrangement",               description: "Defined separately in contract addendum" },
];

const SOURCE_CODE_OPTIONS = [
  { value: "glimmora_hosts_transfer",  label: "GlimmoraTeam Hosts → Transfers on M3", description: "Repository hosted by GlimmoraTeam, transferred at milestone 3" },
  { value: "client_provides_day_one", label: "Client Provides Repository",             description: "Client-owned repository from day one of engagement" },
  { value: "client_hosts",            label: "Client Hosts",                           description: "Client manages and hosts the repository throughout the engagement" },
];

const THIRD_PARTY_OPTIONS = [
  { value: "client_pays",      label: "Client Pays Directly", description: "All third-party licensing costs billed directly to client" },
  { value: "glimmora_absorbs", label: "Absorbed in Quote",    description: "GlimmoraTeam absorbs third-party costs within the quoted price" },
  { value: "split",            label: "Split Cost",           description: "Third-party costs shared equally between client and GlimmoraTeam" },
];

const CHANGE_REQUEST_OPTIONS = [
  { value: "formal_cr",          label: "Formal Change Request", description: "All changes scoped and priced before work begins" },
  { value: "threshold_cr",       label: "Threshold-Based",       description: "Minor changes within contingency budget; larger changes require CR" },
  { value: "time_and_materials", label: "Time & Materials",      description: "Work above baseline billed at agreed T&M rate" },
];

function SubSection({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
        <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-4 py-4 space-y-4 bg-white">
        {children}
      </div>
    </div>
  );
}

function UserInput({ value, onChange, onBlur, placeholder, error }: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={inputCls + " pl-9"}
        />
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}

export function Section7CommercialLegal({ onComplete, onBack, loading }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.commercialLegal;
  const auth = store.approvalAuthorities;
  const [errors, setErrors] = React.useState<SectionErrors>({});
  const touched = React.useRef<Set<string>>(new Set());

  const merged = () => ({ ...data, ...auth });

  const update = (patch: Partial<typeof data>) => {
    store.updateCommercialSection("commercialLegal", patch);
    if (touched.current.size > 0) {
      const allErrs = validateSection("commercialLegal", { ...merged(), ...patch });
      setErrors((prev) => {
        const next = { ...prev };
        for (const f of touched.current) {
          if (allErrs[f]) next[f] = allErrs[f]; else delete next[f];
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
        for (const f of touched.current) {
          if (allErrs[f]) next[f] = allErrs[f]; else delete next[f];
        }
        return next;
      });
    }
  };

  const blurField = (field: string) => {
    touched.current.add(field);
    const err = validateField("commercialLegal", field, merged());
    setErrors((prev) => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n; });
  };

  const handleComplete = () => {
    const errs = validateSection("commercialLegal", merged());
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onComplete();
  };

  return (
    <>
      <SectionHeader number={7} title="Commercial & Legal" />

      <div className="px-6 py-6 space-y-4">

        {/* Intellectual Property */}
        <SubSection icon={Scale} title="Intellectual Property">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="IP Ownership" error={errors.ipOwnership}>
              <CustomSelect
                value={data.ipOwnership}
                onChange={(v) => update({ ipOwnership: v as typeof data.ipOwnership })}
                onBlur={() => blurField("ipOwnership")}
                options={IP_OPTIONS}
                placeholder="Select IP arrangement…"
              />
            </Field>

            <Field label="Source Code Repository" error={errors.sourceCodeOwnership}>
              <CustomSelect
                value={data.sourceCodeOwnership}
                onChange={(v) => update({ sourceCodeOwnership: v as typeof data.sourceCodeOwnership })}
                onBlur={() => blurField("sourceCodeOwnership")}
                options={SOURCE_CODE_OPTIONS}
                placeholder="Select repository model…"
              />
            </Field>
          </div>
        </SubSection>

        {/* Commercial Terms */}
        <SubSection icon={Handshake} title="Commercial Terms">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Third-Party Licensing Costs" error={errors.thirdPartyCosts}>
              <CustomSelect
                value={data.thirdPartyCosts}
                onChange={(v) => update({ thirdPartyCosts: v as typeof data.thirdPartyCosts })}
                onBlur={() => blurField("thirdPartyCosts")}
                options={THIRD_PARTY_OPTIONS}
                placeholder="Select cost model…"
              />
            </Field>

            <Field label="Change Request Process" error={errors.changeRequestProcess}>
              <CustomSelect
                value={data.changeRequestProcess}
                onChange={(v) => update({ changeRequestProcess: v as typeof data.changeRequestProcess })}
                onBlur={() => blurField("changeRequestProcess")}
                options={CHANGE_REQUEST_OPTIONS}
                placeholder="Select change request model…"
              />
            </Field>
          </div>
        </SubSection>

        {/* Approval Authorities */}
        <SubSection icon={ShieldCheck} title="Approval Authorities">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SOW Submitter" error={errors.sowSubmitter}>
              <UserInput
                value={auth.sowSubmitter ?? ""}
                onChange={(v) => updateAuth({ sowSubmitter: v })}
                onBlur={() => blurField("sowSubmitter")}
                placeholder="Full name of SOW submitter"
              />
            </Field>

            <Field label="Business Owner Approver (Stage 1)" error={errors.businessOwnerApprover}>
              <UserInput
                value={auth.businessOwnerApprover}
                onChange={(v) => updateAuth({ businessOwnerApprover: v })}
                onBlur={() => blurField("businessOwnerApprover")}
                placeholder="Full name of Business Owner"
              />
            </Field>

            <Field label="Legal & Compliance Reviewer" error={errors.legalComplianceReviewer}>
              <UserInput
                value={auth.legalComplianceReviewer ?? ""}
                onChange={(v) => updateAuth({ legalComplianceReviewer: v })}
                onBlur={() => blurField("legalComplianceReviewer")}
                placeholder="Full name of Legal & Compliance Reviewer"
              />
            </Field>

            <Field label="Final Approver" error={errors.finalApprover}>
              <UserInput
                value={auth.finalApprover}
                onChange={(v) => updateAuth({ finalApprover: v })}
                onBlur={() => blurField("finalApprover")}
                placeholder="Full name of Final Approver"
              />
            </Field>
          </div>
        </SubSection>

      </div>

      <SectionFooter onBack={onBack} onComplete={handleComplete} completeLabel="Generate Final SOW" variant="generate" loading={loading} />
    </>
  );
}
