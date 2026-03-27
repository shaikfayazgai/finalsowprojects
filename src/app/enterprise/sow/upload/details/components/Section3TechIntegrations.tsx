"use client";

import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";

interface Props { onComplete: () => void; onBack?: () => void }

export function Section3TechIntegrations({ onComplete, onBack }: Props) {
  const store = useSOWUploadStore();
  const data = store.commercialDetails.techIntegrations;
  const update = (patch: Partial<typeof data>) => store.updateCommercialSection("techIntegrations", patch);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-gray-900">3. Technical Architecture & Integrations</h2>
        <span className="text-[10px] text-gray-400">FSD §7.6.4 Section 3</span>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Technology Stack *</label>
        <textarea rows={3} value={data.technologyStack} onChange={(e) => update({ technologyStack: e.target.value })}
          placeholder="React 19 + Node.js + PostgreSQL. Deployed on AWS (ap-south-1)."
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 resize-none transition-colors" />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">Scalability & Performance Requirements</label>
        <textarea rows={2} value={data.scalabilityRequirements} onChange={(e) => update({ scalabilityRequirements: e.target.value })}
          placeholder="Support 500 concurrent users with < 500ms p95 response time."
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 resize-none transition-colors" />
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-600 mb-1.5 block">User Management Scope</label>
        <input type="text" value={data.userManagementScope} onChange={(e) => update({ userManagementScope: e.target.value })}
          placeholder="SSO via Azure AD with RBAC"
          className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={data.ssoRequired} onChange={(e) => update({ ssoRequired: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-gray-300" />
        <span className="text-[12px] text-gray-700">SSO Required</span>
      </label>

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
