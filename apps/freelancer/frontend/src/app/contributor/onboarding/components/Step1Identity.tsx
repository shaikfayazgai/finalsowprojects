"use client";

import {
  ArrowRight, CheckCircle, AlertCircle, Check, GraduationCap, Briefcase, Users, User, Smartphone,
} from "lucide-react";
import { Button, Label } from "@/components/ui";
import { CountryCombobox } from "@/app/auth/register/components/CountryCombobox";
import { CountryDialPicker } from "@/app/auth/register/components/CountryDialPicker";
import { COUNTRIES_DATA } from "@/app/auth/register/data";
import type { ContributorType } from "@/app/auth/register/types";

interface Props {
  firstName: string;    setFirstName: (v: string) => void;
  lastName: string;     setLastName: (v: string) => void;
  phoneCountry: string; setPhoneCountry: (v: string) => void;
  phone: string;        setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  contribType: ContributorType; setContribType: (v: ContributorType) => void;
  country: string;      setCountry: (v: string) => void;
  image?: string;
  error: string;
  onContinue: () => void;
  ssoProvider?: "google" | "microsoft" | null;
  /** When set, track was chosen at register / invite — hide the type picker. */
  lockedContribType?: ContributorType;
}

const CONTRIBUTOR_TYPES: {
  value: ContributorType;
  label: string;
  sub: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { value: "student",          label: "Student",          sub: "University / college",      Icon: GraduationCap },
  { value: "women_workforce",  label: "Women Workforce",  sub: "Returnship / professional", Icon: Briefcase },
  { value: "general_workforce",label: "General Workforce",sub: "Professional contributor",  Icon: Users },
];

const CONTRIBUTOR_TYPE_LABELS: Record<Exclude<ContributorType, "">, string> = {
  student: "Student",
  women_workforce: "Women workforce",
  general_workforce: "Freelancer / general workforce",
};

export function Step1Identity({
  firstName, setFirstName, lastName, setLastName,
  phoneCountry, setPhoneCountry, phone, setPhone,
  email, setEmail: _setEmail,
  contribType, setContribType,
  country, setCountry,
  image,
  error, onContinue, ssoProvider = null,
  lockedContribType,
}: Props) {
  const selectedPhoneCountry = COUNTRIES_DATA.find((c) => c.name === phoneCountry);
  const phoneMaxLen = selectedPhoneCountry?.phoneMaxLength ?? 12;

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="mb-6">
        <span className="inline-block text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full mb-3">
          Step 1 of 4
        </span>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">Basic Identity</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {lockedContribType
            ? "Confirm your name and country — your contributor track is already set from your invite."
            : "Confirm your name, select your contributor type, and set your country."}
        </p>
      </div>

      {/* SSO identity badge */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 mb-5">
        {image ? (
          <img src={image} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
            <User className="w-5 h-5 text-teal-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
        <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          <CheckCircle className="w-3 h-3" />
          {ssoProvider === "google" ? "Google SSO" : ssoProvider === "microsoft" ? "Microsoft SSO" : "Verified"}
        </span>
      </div>

      <div className="space-y-5">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              First Name <span className="text-red-400">*</span>
            </Label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full text-sm text-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-teal-400 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Last Name <span className="text-red-400">*</span>
            </Label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full text-sm text-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-teal-400 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-gray-400" />
            Mobile Number <span className="text-red-400">*</span>
          </Label>
          <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-white outline-none focus-within:border-teal-400 transition-colors">
            <CountryDialPicker
              value={phoneCountry}
              onChange={(name) => {
                const c = COUNTRIES_DATA.find((x) => x.name === name)!;
                setPhoneCountry(c.name);
                setPhone(c.code + " ");
              }}
            />
            <input
              type="tel"
              placeholder={`Number (${phoneMaxLen} digits)`}
              value={phone.replace(/^\+\d+\s?/, "")}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, phoneMaxLen);
                const cc = selectedPhoneCountry?.code ?? "";
                setPhone(`${cc} ${digits}`);
              }}
              maxLength={phoneMaxLen}
              autoComplete="tel-national"
              className="flex-1 h-11 px-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Contributor Type — hidden when track is locked from register / partner invite */}
        {lockedContribType ? (
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
              Your track
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {CONTRIBUTOR_TYPE_LABELS[lockedContribType]}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Locked from your registration link — you don&apos;t need to choose again.
            </p>
          </div>
        ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Contributor Type <span className="text-red-400">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-2.5">
            {CONTRIBUTOR_TYPES.map(({ value, label, sub, Icon }) => {
              const active = contribType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setContribType(value)}
                  className={`relative flex flex-col gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-teal-500 bg-teal-50/60"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  {active && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-teal-100" : "bg-gray-100"}`}>
                    <Icon className={`w-4 h-4 ${active ? "text-teal-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Country */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Country of Residence <span className="text-red-400">*</span>
          </Label>
          <CountryCombobox value={country} onChange={setCountry} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Action */}
        <div className="pt-2">
          <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue}>
            Continue to Profile <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
