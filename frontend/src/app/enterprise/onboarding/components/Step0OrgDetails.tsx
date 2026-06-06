"use client";

import { AlertCircle, ArrowRight, Globe, Phone, Building2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

const ORG_TYPES = [
  { value: "private",    label: "Private Company" },
  { value: "public",     label: "Public Company" },
  { value: "startup",    label: "Startup" },
  { value: "nonprofit",  label: "Non-Profit" },
  { value: "government", label: "Government / Public Sector" },
];

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education",
  "E-Commerce & Retail", "Manufacturing", "Real Estate", "Media & Entertainment",
  "Logistics & Supply Chain", "Legal & Compliance", "Other",
];

const COMPANY_SIZES = [
  { value: "1-10",    label: "1–10 employees" },
  { value: "11-50",   label: "11–50 employees" },
  { value: "51-200",  label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+",    label: "500+ employees" },
];

const COUNTRIES = [
  "India", "United States", "United Kingdom", "United Arab Emirates",
  "Singapore", "Germany", "Canada", "Australia", "Other",
];

interface Props {
  companyName: string;       setCompanyName: (v: string) => void;
  country: string;           setCountry: (v: string) => void;
  orgType: string;           setOrgType: (v: string) => void;
  industry: string;          setIndustry: (v: string) => void;
  companySize: string;       setCompanySize: (v: string) => void;
  adminTitle: string;        setAdminTitle: (v: string) => void;
  adminDept: string;         setAdminDept: (v: string) => void;
  website: string;           setWebsite: (v: string) => void;
  phone: string;             setPhone: (v: string) => void;
  error: string;
  onContinue: () => void;
  onBack: () => void;
}

const selectClass =
  "w-full h-10 rounded-xl border border-beige-200 bg-white px-3 text-sm text-brown-950 focus:outline-none focus:ring-2 focus:ring-brown-400/30 focus:border-brown-400 transition-all";

export function Step0OrgDetails({
  companyName, setCompanyName,
  country, setCountry,
  orgType, setOrgType,
  industry, setIndustry,
  companySize, setCompanySize,
  adminTitle, setAdminTitle,
  adminDept, setAdminDept,
  website, setWebsite,
  phone, setPhone,
  error, onContinue, onBack,
}: Props) {
  return (
    <div className="space-y-8">

      {/* Organisation Identity */}
      <section>
        <h3 className="text-sm font-semibold text-brown-900 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brown-500" />
          Organisation Identity
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Company Name <span className="text-red-400">*</span></Label>
            <Input
              placeholder="e.g. Acme Technologies Pvt. Ltd."
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Country of Incorporation <span className="text-red-400">*</span></Label>
            <select value={country} onChange={e => setCountry(e.target.value)} className={selectClass}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Organisation Type <span className="text-red-400">*</span></Label>
            <select value={orgType} onChange={e => setOrgType(e.target.value)} className={selectClass}>
              <option value="">Select type</option>
              {ORG_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Industry <span className="text-red-400">*</span></Label>
            <select value={industry} onChange={e => setIndustry(e.target.value)} className={selectClass}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Company Size <span className="text-red-400">*</span></Label>
            <select value={companySize} onChange={e => setCompanySize(e.target.value)} className={selectClass}>
              <option value="">Select size</option>
              {COMPANY_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige-400" />
              <Input
                placeholder="https://yourcompany.com"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Admin Profile */}
      <section>
        <h3 className="text-sm font-semibold text-brown-900 mb-4">Your Role</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Job Title <span className="text-red-400">*</span></Label>
            <Input
              placeholder="e.g. CTO, Engineering Manager"
              value={adminTitle}
              onChange={e => setAdminTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Department</Label>
            <Input
              placeholder="e.g. Engineering, Product"
              value={adminDept}
              onChange={e => setAdminDept(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige-400" />
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Error & Actions */}
      <div className="space-y-4 pt-2 border-t border-beige-100">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button type="button" variant="primary" size="md" onClick={onContinue}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>
  );
}
