"use client";

import { useState, useRef, useEffect } from "react";
import {
  AlertCircle, ArrowRight, ArrowLeft, X,
  Briefcase, GraduationCap, Clock, Sparkles, Globe,
  ChevronDown, ChevronLeft, ChevronRight, Search, Check,
} from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { SKILL_OPTIONS, TIMEZONES } from "@/app/auth/register/data";
import type { ContributorType } from "@/app/auth/register/types";

/* ─── Date Picker ─────────────────────────────────────────── */
function DatePicker({ value, onChange, maxDate }: { value: string; onChange: (v: string) => void; maxDate?: string }) {
  const today    = new Date();
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [open, setOpen]                     = useState(false);
  const [viewYear, setViewYear]             = useState(selected?.getFullYear() ?? today.getFullYear() - 20);
  const [viewMonth, setViewMonth]           = useState(selected?.getMonth() ?? today.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowYearPicker(false); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const maxD        = maxDate ? new Date(maxDate + "T00:00:00") : null;
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const MONTHS      = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const SHORT_MONTHS= ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS        = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const years       = Array.from({ length: 81 }, (_, i) => today.getFullYear() - i);

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const isSelected = (d: number) => selected?.getFullYear() === viewYear && selected?.getMonth() === viewMonth && selected?.getDate() === d;
  const isToday    = (d: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
  const isDisabled = (d: number) => maxD ? new Date(viewYear, viewMonth, d) > maxD : false;

  const select = (d: number) => {
    if (isDisabled(d)) return;
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    setOpen(false); setShowYearPicker(false);
  };

  const display = selected
    ? `${String(selected.getDate()).padStart(2, "0")} ${SHORT_MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setShowYearPicker(false); }}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-sm transition-all focus:outline-none ${
          open ? "border-teal-500 ring-2 ring-teal-500/15" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className={display ? "text-gray-900" : "text-gray-400"}>{display || "Select date"}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span role="button" onClick={e => { e.stopPropagation(); onChange(""); }} className="text-gray-300 hover:text-red-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-brown-600">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setShowYearPicker(v => !v)}
              className="text-sm font-semibold text-white hover:text-white/80 flex items-center gap-1 transition-colors">
              {MONTHS[viewMonth]} {viewYear}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showYearPicker ? "rotate-180" : ""}`} />
            </button>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {showYearPicker ? (
            <div className="grid grid-cols-4 gap-1 p-3 max-h-48 overflow-y-auto bg-gray-50">
              {years.map(y => (
                <button key={y} type="button" onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${y === viewYear ? "bg-brown-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}>
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                {DAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-semibold text-gray-400 uppercase">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 p-2 gap-0.5">
                {cells.map((day, i) => (
                  <div key={i}>
                    {day ? (
                      <button type="button" onClick={() => select(day)} disabled={isDisabled(day)}
                        className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-all font-medium
                          ${isSelected(day) ? "bg-brown-600 text-white shadow-sm" :
                            isToday(day)    ? "bg-teal-100 text-teal-800 font-bold" :
                            isDisabled(day) ? "text-gray-300 cursor-not-allowed" :
                                             "text-gray-700 hover:bg-gray-100"}`}>
                        {day}
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <button type="button" onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
                  className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors">Today</button>
                {value && (
                  <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                    className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">Clear</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Searchable Combobox ──────────────────────────────────── */
function SearchCombobox({
  value, onChange, options, placeholder, searchPlaceholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; group?: string }[];
  placeholder: string;
  searchPlaceholder: string;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const filtered = search.trim() ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) : options;
  const hasGroups = options.some(o => o.group);
  const groups = hasGroups
    ? Array.from(new Set(options.map(o => o.group ?? ""))).map(g => ({ group: g, items: filtered.filter(o => (o.group ?? "") === g) })).filter(g => g.items.length > 0)
    : null;
  const selectedItem = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-sm transition-all focus:outline-none ${
          open ? "border-teal-500 ring-2 ring-teal-500/15" : "border-gray-200 hover:border-gray-300"
        }`}>
        <span className={selectedItem ? "text-gray-900 truncate" : "text-gray-400"}>{selectedItem?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input ref={inputRef} type="text" placeholder={searchPlaceholder} value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400" />
            {search && <button type="button" onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-400 text-center">No results found</p>}
            {groups ? groups.map(({ group, items }) => (
              <div key={group}>
                {group && <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">{group}</p>}
                {items.map(item => (
                  <button key={item.value} type="button"
                    onClick={() => { onChange(item.value); setOpen(false); setSearch(""); }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${value === item.value ? "bg-teal-50 text-teal-900 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                    <span>{item.label}</span>
                    {value === item.value && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )) : filtered.map(item => (
              <button key={item.value} type="button"
                onClick={() => { onChange(item.value); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${value === item.value ? "bg-teal-50 text-teal-900 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                <span>{item.label}</span>
                {value === item.value && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Static data ──────────────────────────────────────────── */
const TIMEZONE_OPTIONS = TIMEZONES.map(t => ({ label: t, value: t }));

const DEPT_OPTIONS = [
  { group: "Technology",           value: "engineering",      label: "Engineering & Development" },
  { group: "Technology",           value: "devops",           label: "DevOps & Infrastructure" },
  { group: "Technology",           value: "data",             label: "Data & Analytics" },
  { group: "Technology",           value: "cybersecurity",    label: "Cybersecurity" },
  { group: "Technology",           value: "qa",               label: "Quality Assurance & Testing" },
  { group: "Creative & Design",    value: "design",           label: "Design & UX/UI" },
  { group: "Creative & Design",    value: "content",          label: "Content & Copywriting" },
  { group: "Creative & Design",    value: "media",            label: "Media & Video Production" },
  { group: "Business",             value: "product",          label: "Product Management" },
  { group: "Business",             value: "marketing",        label: "Marketing & Growth" },
  { group: "Business",             value: "sales",            label: "Sales & Business Development" },
  { group: "Business",             value: "finance",          label: "Finance & Accounting" },
  { group: "Business",             value: "operations",       label: "Operations & Strategy" },
  { group: "People & Support",     value: "hr",               label: "Human Resources" },
  { group: "People & Support",     value: "customer-support", label: "Customer Support" },
  { group: "People & Support",     value: "legal",            label: "Legal & Compliance" },
  { group: "Research & Education", value: "research",         label: "Research & Development" },
  { group: "Research & Education", value: "education",        label: "Education & Training" },
  { group: "Other",                value: "other",            label: "Other" },
];

const CAREER_OPTIONS = [
  { value: "re-entering",   label: "Re-entering the workforce" },
  { value: "mid-career",    label: "Mid-career professional" },
  { value: "senior",        label: "Senior professional" },
  { value: "career-change", label: "Career transition / change" },
];

const EXPERIENCE_OPTIONS = [
  { value: "exp0to1",   label: "0-1 years"  },
  { value: "exp1to3",   label: "1-3 years"  },
  { value: "exp3to5",   label: "3-5 years"  },
  { value: "exp5to10",  label: "5-10 years" },
  { value: "exp10plus", label: "10+ years"  },
];

type ExperienceRateTable = {
  exp0to1:   string;
  exp1to3:   string;
  exp3to5:   string;
  exp5to10:  string;
  exp10plus: string;
};

/* ─── Skill pill ───────────────────────────────────────────── */
function SkillPill({ label, onRemove, color = "teal" }: { label: string; onRemove: () => void; color?: "teal" | "gray" | "green" }) {
  const cls = {
    teal:  "bg-teal-50 border-teal-200 text-teal-800",
    gray:  "bg-gray-100 border-gray-200 text-gray-700",
    green: "bg-green-50 border-green-200 text-green-800",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${cls}`}>
      {label}
      <button type="button" onClick={onRemove} className="text-current opacity-50 hover:opacity-100 transition-opacity ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ─── Skill autocomplete ───────────────────────────────────── */
function SkillAutocomplete({
  label, badge, skills, onAdd, onRemove,
  inputValue, onInputChange, suggestions,
  placeholder, color = "teal", allowCustom = false,
}: {
  label: string; badge?: string;
  skills: string[]; onAdd: (s: string) => void; onRemove: (s: string) => void;
  inputValue: string; onInputChange: (v: string) => void; suggestions: string[];
  placeholder: string; color?: "teal" | "gray" | "green"; allowCustom?: boolean;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal]   = useState("");
  const customRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (showCustom) setTimeout(() => customRef.current?.focus(), 50); }, [showCustom]);

  const addCustom = () => {
    const t = customVal.trim();
    if (t && !skills.includes(t)) { onAdd(t); setCustomVal(""); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {badge && <span className="text-xs text-gray-400">{badge}</span>}
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => <SkillPill key={s} label={s} onRemove={() => onRemove(s)} color={color} />)}
        </div>
      )}
      <div className="relative">
        <Input placeholder={placeholder} value={inputValue} onChange={e => onInputChange(e.target.value)} />
        {inputValue && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.slice(0, 6).map(s => (
              <button key={s} type="button" onClick={() => onAdd(s)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">{s}</button>
            ))}
          </div>
        )}
      </div>
      {allowCustom && (
        showCustom ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
            <input ref={customRef} type="text" value={customVal} onChange={e => setCustomVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } if (e.key === "Escape") { setShowCustom(false); setCustomVal(""); } }}
              placeholder="Type a custom skill, press Enter"
              className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400" />
            <button type="button" onClick={addCustom} disabled={!customVal.trim()}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-30 transition-colors">Add</button>
            <button type="button" onClick={() => { setShowCustom(false); setCustomVal(""); }} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowCustom(true)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
            <X className="w-3 h-3 rotate-45" /> Add custom skill
          </button>
        )
      )}
    </div>
  );
}

/* ─── Skill freeform ───────────────────────────────────────── */
function SkillFreeform({ label, badge, skills, onAdd, onRemove, inputValue, onInputChange, placeholder }: {
  label: string; badge?: string;
  skills: string[]; onAdd: (s: string) => void; onRemove: (s: string) => void;
  inputValue: string; onInputChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {badge && <span className="text-xs text-gray-400">{badge}</span>}
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => <SkillPill key={s} label={s} onRemove={() => onRemove(s)} color="gray" />)}
        </div>
      )}
      <Input placeholder={placeholder} value={inputValue} onChange={e => onInputChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const t = inputValue.trim(); if (t && !skills.includes(t)) onAdd(t); } }} />
      <p className="text-xs text-gray-400">Press Enter to add</p>
    </div>
  );
}

/* ─── Section label ────────────────────────────────────────── */
function SectionLabel({ icon: Icon, text, optional }: { icon: React.FC<{ className?: string }>; text: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{text}</span>
      {optional && <span className="text-xs text-gray-400 font-normal normal-case tracking-normal ml-auto">Optional</span>}
    </div>
  );
}

/* ─── Props ────────────────────────────────────────────────── */
interface Props {
  contribType: ContributorType;
  dob: string;                   setDob: (v: string) => void;
  timezone: string;              setTimezone: (v: string) => void;
  departmentCategory: string;    setDepartmentCategory: (v: string) => void;
  departmentOther: string;       setDepartmentOther: (v: string) => void;
  availability: string;          setAvailability: (v: string) => void;
  degree: string;                setDegree: (v: string) => void;
  branch: string;                setBranch: (v: string) => void;
  linkedin: string;              setLinkedin: (v: string) => void;
  primarySkills: string[];
  skillInput: string;            setSkillInput: (v: string) => void;
  addPrimarySkill: (s: string) => void; removePrimarySkill: (s: string) => void;
  secondarySkills: string[];
  secondarySkillInput: string;   setSecondarySkillInput: (v: string) => void;
  addSecondarySkill: (s: string) => void; removeSecondarySkill: (s: string) => void;
  otherSkills: string[];
  otherSkillInput: string;       setOtherSkillInput: (v: string) => void;
  addOtherSkill: (s: string) => void; removeOtherSkill: (s: string) => void;
  workStart: string;             setWorkStart: (v: string) => void;
  workEnd: string;               setWorkEnd: (v: string) => void;
  jobTitle: string;              setJobTitle: (v: string) => void;
  careerStage: string;           setCareerStage: (v: string) => void;
  yearsExperience: string;       setYearsExperience: (v: string) => void;
  studentCurrency?: string;
  studentHourlyRate?: string;
  womenRateCurrency?: string;
  womenRateTable?: ExperienceRateTable;
  generalRateCurrency?: string;
  generalRateTable?: ExperienceRateTable;
  error: string;
  onContinue: () => void;
  onBack: () => void;
}

export function Step2Profile({
  contribType,
  dob, setDob, timezone, setTimezone,
  departmentCategory, setDepartmentCategory,
  departmentOther, setDepartmentOther,
  availability, setAvailability,
  degree, setDegree, branch, setBranch,
  linkedin, setLinkedin,
  primarySkills, skillInput, setSkillInput, addPrimarySkill, removePrimarySkill,
  secondarySkills, secondarySkillInput, setSecondarySkillInput, addSecondarySkill, removeSecondarySkill,
  otherSkills, otherSkillInput, setOtherSkillInput, addOtherSkill, removeOtherSkill,
  workStart, setWorkStart, workEnd, setWorkEnd,
  jobTitle, setJobTitle,
  careerStage, setCareerStage,
  yearsExperience, setYearsExperience,
  studentCurrency = "INR",
  studentHourlyRate = "1000",
  womenRateCurrency = "INR",
  womenRateTable = { exp0to1: "1000", exp1to3: "1500", exp3to5: "2000", exp5to10: "2500", exp10plus: "3000" },
  generalRateCurrency = "INR",
  generalRateTable = { exp0to1: "1000", exp1to3: "1500", exp3to5: "2000", exp5to10: "2500", exp10plus: "3000" },
  error, onContinue, onBack,
}: Props) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const needsExperienceRate =
    contribType === "women_workforce" || contribType === "general_workforce";
  const currentRateCurrency =
    contribType === "women_workforce" ? womenRateCurrency : generalRateCurrency;
  const currentRateTable =
    contribType === "women_workforce" ? womenRateTable : generalRateTable;
  const currentHourlyRate = yearsExperience
    ? currentRateTable[yearsExperience as keyof ExperienceRateTable] ?? ""
    : "";

  const primarySuggestions   = SKILL_OPTIONS.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !primarySkills.includes(s));
  const secondarySuggestions = SKILL_OPTIONS.filter(s => s.toLowerCase().includes(secondarySkillInput.toLowerCase()) && !primarySkills.includes(s) && !secondarySkills.includes(s));

  const handleContinue = () => {
    const errs: Record<string, string> = {};
    if (!dob)                { errs.dob = "Date of birth is required"; }
    if (!timezone)           { errs.timezone = "Time zone is required"; }
    if (!availability)       { errs.availability = "Weekly availability is required"; }
    else if (Number(availability) < 1 || Number(availability) > 60) { errs.availability = "Must be between 1–60 hours"; }
    if (!departmentCategory) { errs.dept = "Department category is required"; }
    if (departmentCategory === "other" && !departmentOther.trim()) { errs.deptOther = "Please specify your department"; }
    if (primarySkills.length === 0) { errs.skills = "Add at least one primary skill"; }
    if (needsExperienceRate && !yearsExperience) { errs.yearsExperience = "Years of experience is required"; }
    setFieldErrors(errs);
    if (Object.keys(errs).length === 0) onContinue();
  };

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full mb-3">
          Step 2 of 4
        </span>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">Profile & Skills</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Tell us about your skills and availability so we can match you to the right tasks.
        </p>
      </div>

      <div className="space-y-7">
        {/* Basics */}
        <div>
          <SectionLabel icon={Globe} text="Profile Basics" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-400">*</span></Label>
              <DatePicker value={dob} onChange={setDob} maxDate={new Date().toISOString().split("T")[0]} />
              {fieldErrors.dob
                ? <p className="text-xs text-red-500">{fieldErrors.dob}</p>
                : <p className="text-xs text-gray-400">Must be 18 or older</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Time Zone <span className="text-red-400">*</span></Label>
              <SearchCombobox value={timezone} onChange={setTimezone} options={TIMEZONE_OPTIONS} placeholder="Select timezone" searchPlaceholder="Search timezones…" />
              {fieldErrors.timezone && <p className="text-xs text-red-500">{fieldErrors.timezone}</p>}
            </div>
          </div>
        </div>

        {/* Work */}
        <div>
          <SectionLabel icon={Clock} text="Work Preferences" />
          <div className="space-y-3">
            {needsExperienceRate && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Job Title</Label>
                  <Input
                    placeholder="e.g. Frontend Developer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Years of Experience <span className="text-red-400">*</span></Label>
                  <SearchCombobox
                    value={yearsExperience}
                    onChange={setYearsExperience}
                    options={EXPERIENCE_OPTIONS}
                    placeholder="Select experience range"
                    searchPlaceholder="Search range…"
                  />
                  {fieldErrors.yearsExperience && <p className="text-xs text-red-500">{fieldErrors.yearsExperience}</p>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Weekly Availability <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Input type="number" min="1" max="60" placeholder="e.g. 20" value={availability} onChange={e => setAvailability(e.target.value)} className="pr-14" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">hrs/wk</span>
                </div>
                {fieldErrors.availability && <p className="text-xs text-red-500">{fieldErrors.availability}</p>}
              </div>
              {needsExperienceRate && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Configured Currency & Hourly Rate</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={currentRateCurrency} readOnly className="bg-gray-50 text-gray-700" />
                    <div className="relative">
                      <Input value={currentHourlyRate} readOnly className="bg-gray-50 text-gray-700 pr-12" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">/hr</span>
                    </div>
                  </div>
                  {!yearsExperience && (
                    <p className="text-xs text-gray-400">Select years of experience to view hourly rate.</p>
                  )}
                </div>
              )}
              {contribType === "student" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Student Currency</Label>
                    <Input value={studentCurrency} readOnly className="bg-gray-50 text-gray-700" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Student Hourly Rate</Label>
                    <div className="relative">
                      <Input value={studentHourlyRate} readOnly className="bg-gray-50 text-gray-700 pr-12" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">/hr</span>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Department <span className="text-red-400">*</span></Label>
                <SearchCombobox value={departmentCategory} onChange={setDepartmentCategory} options={DEPT_OPTIONS} placeholder="Select department" searchPlaceholder="Search departments…" />
                {fieldErrors.dept && <p className="text-xs text-red-500">{fieldErrors.dept}</p>}
              </div>
            </div>
            {departmentCategory === "other" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Department Name <span className="text-red-400">*</span></Label>
                <Input placeholder="Enter your department name" value={departmentOther} onChange={e => setDepartmentOther(e.target.value)} maxLength={80} />
                {fieldErrors.deptOther && <p className="text-xs text-red-500">{fieldErrors.deptOther}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Education */}
        <div>
          <SectionLabel icon={GraduationCap} text="Education" optional />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Degree / Qualification</Label>
              <Input placeholder="e.g. B.Tech, MBA" value={degree} onChange={e => setDegree(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Field of Study</Label>
              <Input placeholder="e.g. Computer Science" value={branch} onChange={e => setBranch(e.target.value)} maxLength={80} />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <SectionLabel icon={Sparkles} text="Skills" />
          <div className="space-y-4">
            <SkillAutocomplete
              label="Primary Skills *" badge={`${primarySkills.length}/20 · required`}
              skills={primarySkills} onAdd={addPrimarySkill} onRemove={removePrimarySkill}
              inputValue={skillInput} onInputChange={setSkillInput}
              suggestions={primarySuggestions}
              placeholder="Search or type a skill…" color="teal" allowCustom
            />
            {fieldErrors.skills && <p className="text-xs text-red-500 -mt-1">{fieldErrors.skills}</p>}
            <SkillAutocomplete
              label="Secondary Skills" badge={`${secondarySkills.length}/20 · optional`}
              skills={secondarySkills} onAdd={addSecondarySkill} onRemove={removeSecondarySkill}
              inputValue={secondarySkillInput} onInputChange={setSecondarySkillInput}
              suggestions={secondarySuggestions}
              placeholder="Supporting skills…" color="green"
            />
            <SkillFreeform
              label="Other / Niche Skills" badge="optional"
              skills={otherSkills} onAdd={addOtherSkill} onRemove={removeOtherSkill}
              inputValue={otherSkillInput} onInputChange={setOtherSkillInput}
              placeholder="Any custom or niche skill…"
            />
          </div>
        </div>

        {/* LinkedIn */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            LinkedIn URL <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input type="url" placeholder="https://linkedin.com/in/your-profile" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
        </div>

        {/* Women workforce extras */}
        {contribType === "women_workforce" && (
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 space-y-3">
            <SectionLabel icon={Briefcase} text="Schedule Preferences" optional />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Preferred Start</Label>
                <Input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Preferred End</Label>
                <Input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Career Stage</Label>
              <SearchCombobox value={careerStage} onChange={setCareerStage} options={CAREER_OPTIONS} placeholder="Select career stage" searchPlaceholder="Search…" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Button type="button" variant="primary" size="lg" className="flex-1" onClick={handleContinue}>
            Continue to Verification <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
