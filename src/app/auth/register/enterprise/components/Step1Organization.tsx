"use client";

import {
  AlertCircle, ArrowRight,
  Rocket, Building2, Building, Globe,
  Heart, Landmark, GraduationCap, Users,
  MapPin, Link2, Shapes,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui";
import { CountryCombobox } from "../../components/CountryCombobox";
import type { OrgType } from "../hooks/useEnterpriseRegistration";

function SectionHeader({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-md bg-brown-100 flex items-center justify-center shrink-0">
        <Icon className="w-3 h-3 text-brown-500" />
      </div>
      <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">{title}</p>
      {badge && <span className="text-[10px] text-beige-400 font-medium">{badge}</span>}
    </div>
  );
}

const ORG_TYPES: {
  value: Exclude<OrgType, "">;
  label: string;
  sub: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { value: "startup", label: "Startup", sub: "Early-stage venture", Icon: Rocket },
  { value: "sme", label: "SME", sub: "Small-to-mid size", Icon: Building2 },
  { value: "large-enterprise", label: "Enterprise", sub: "1,000+ employees", Icon: Building },
  { value: "mnc", label: "MNC", sub: "Multinational corp.", Icon: Globe },
  { value: "ngo", label: "NGO / Non-profit", sub: "Charity / foundation", Icon: Heart },
  { value: "government", label: "Government", sub: "Public sector body", Icon: Landmark },
  { value: "educational", label: "Educational", sub: "University / institute", Icon: GraduationCap },
  { value: "agency", label: "Agency", sub: "Consulting / staffing", Icon: Users },
  { value: "other", label: "Other", sub: "Custom organisation type", Icon: Shapes },
];

const SIZE_OPTIONS = [
  { value: "1-10", label: "1 - 10", sub: "Solo / micro team" },
  { value: "11-50", label: "11 - 50", sub: "Small team" },
  { value: "51-200", label: "51 - 200", sub: "Growing team" },
  { value: "201-1000", label: "201 - 1,000", sub: "Mid-size company" },
  { value: "1001-5000", label: "1,001 - 5,000", sub: "Large company" },
  { value: "5001-10000", label: "5,001 - 10,000", sub: "Very large" },
  { value: "10000+", label: "10,000+", sub: "Global enterprise" },
];

interface Props {
  orgName: string; setOrgName: (v: string) => void;
  orgType: OrgType; setOrgType: (v: OrgType) => void;
  orgTypeOther: string; setOrgTypeOther: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  industryOther: string; setIndustryOther: (v: string) => void;
  companySize: string; setCompanySize: (v: string) => void;
  website: string; setWebsite: (v: string) => void;
  hqCountry: string; setHqCountry: (v: string) => void;
  hqCity: string; setHqCity: (v: string) => void;
  error: string;
  onContinue: () => void;
}

export function Step1Organization({
  orgName, setOrgName,
  orgType, setOrgType,
  orgTypeOther, setOrgTypeOther,
  industry, setIndustry,
  industryOther, setIndustryOther,
  companySize, setCompanySize,
  website, setWebsite,
  hqCountry, setHqCountry,
  hqCity, setHqCity,
  error,
  onContinue,
}: Props) {
  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 1 of 4</p>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Organisation Profile</p>
          <p className="text-xs text-beige-500 mt-0.5">Tell us about your company so we can tailor the platform to your needs</p>
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeader icon={Building} title="Company Identity" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organisation Name <span className="text-red-400">*</span></Label>
                <Input
                  id="orgName"
                  placeholder="Legal name of your organisation"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  maxLength={120}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Organisation Type <span className="text-red-400">*</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  {ORG_TYPES.map(({ value, label, sub, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOrgType(value)}
                      className={`flex flex-col items-center text-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        orgType === value
                          ? "border-brown-600 bg-brown-50 shadow-sm"
                          : "border-beige-200 hover:border-brown-300 bg-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${orgType === value ? "text-brown-600" : "text-beige-400"}`} />
                      <div>
                        <p className={`text-[11px] font-semibold leading-tight ${orgType === value ? "text-brown-900" : "text-brown-700"}`}>{label}</p>
                        <p className="text-[9px] text-beige-400 mt-0.5 leading-tight">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {orgType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="orgTypeOther">Other Organisation Type <span className="text-red-400">*</span></Label>
                  <Input
                    id="orgTypeOther"
                    placeholder="Specify your organisation type"
                    value={orgTypeOther}
                    onChange={e => setOrgTypeOther(e.target.value)}
                    maxLength={80}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Industry / Sector <span className="text-red-400">*</span></Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Technology</SelectLabel>
                      <SelectItem value="software-saas">Software &amp; SaaS</SelectItem>
                      <SelectItem value="it-services">IT Services &amp; Consulting</SelectItem>
                      <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                      <SelectItem value="ai-data">AI, Data Science &amp; Analytics</SelectItem>
                      <SelectItem value="hardware">Hardware &amp; Electronics</SelectItem>
                      <SelectItem value="telecom">Telecommunications</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Finance &amp; Business</SelectLabel>
                      <SelectItem value="banking">Banking &amp; Financial Services</SelectItem>
                      <SelectItem value="investment">Investment &amp; Asset Management</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="accounting">Accounting &amp; Audit</SelectItem>
                      <SelectItem value="consulting">Management Consulting</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Healthcare &amp; Life Sciences</SelectLabel>
                      <SelectItem value="healthcare">Hospitals &amp; Healthcare</SelectItem>
                      <SelectItem value="pharma">Pharmaceuticals &amp; Biotech</SelectItem>
                      <SelectItem value="medtech">Medical Devices &amp; HealthTech</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Creative &amp; Media</SelectLabel>
                      <SelectItem value="advertising">Advertising &amp; Marketing</SelectItem>
                      <SelectItem value="media">Media &amp; Entertainment</SelectItem>
                      <SelectItem value="publishing">Publishing &amp; Content</SelectItem>
                      <SelectItem value="design-creative">Design &amp; Creative Services</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Manufacturing &amp; Industry</SelectLabel>
                      <SelectItem value="automotive">Automotive &amp; Transportation</SelectItem>
                      <SelectItem value="aerospace">Aerospace &amp; Defence</SelectItem>
                      <SelectItem value="construction">Construction &amp; Real Estate</SelectItem>
                      <SelectItem value="energy">Energy &amp; Utilities</SelectItem>
                      <SelectItem value="fmcg">FMCG &amp; Consumer Goods</SelectItem>
                      <SelectItem value="logistics">Logistics &amp; Supply Chain</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Education &amp; Research</SelectLabel>
                      <SelectItem value="edtech">Education &amp; e-Learning</SelectItem>
                      <SelectItem value="research">Research &amp; Development</SelectItem>
                      <SelectItem value="nonprofit">Non-profit &amp; NGO</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Government &amp; Public</SelectLabel>
                      <SelectItem value="public-admin">Government &amp; Public Administration</SelectItem>
                      <SelectItem value="legal">Legal Services &amp; Compliance</SelectItem>
                      <SelectItem value="staffing">Staffing &amp; Recruitment</SelectItem>
                    </SelectGroup>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {industry === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="industryOther">Other Industry / Sector <span className="text-red-400">*</span></Label>
                  <Input
                    id="industryOther"
                    placeholder="Specify your industry or sector"
                    value={industryOther}
                    onChange={e => setIndustryOther(e.target.value)}
                    maxLength={80}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <SectionHeader icon={Users} title="Scale & Reach" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Size <span className="text-red-400">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {SIZE_OPTIONS.map(({ value, label, sub }, index) => {
                    const isLast = index === SIZE_OPTIONS.length - 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCompanySize(value)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          isLast ? "col-span-2" : ""
                        } ${
                          companySize === value
                            ? "border-brown-600 bg-brown-50 shadow-sm"
                            : "border-beige-200 hover:border-brown-300 bg-white"
                        }`}
                      >
                        <span className={`text-sm font-semibold ${companySize === value ? "text-brown-900" : "text-brown-700"}`}>{label}</span>
                        <span className="text-[10px] text-beige-400">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <div className="relative">
                  <Input
                    id="website"
                    type="url"
                    placeholder="www.company.com"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="pl-9"
                  />
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader icon={MapPin} title="Headquarters" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Country <span className="text-red-400">*</span></Label>
                <CountryCombobox value={hqCountry} onChange={setHqCountry} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hqCity">City / Region</Label>
                <Input
                  id="hqCity"
                  placeholder="City or region"
                  value={hqCity}
                  onChange={e => setHqCity(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
