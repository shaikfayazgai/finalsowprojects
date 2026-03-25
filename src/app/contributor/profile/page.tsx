"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Briefcase,
  Globe,
  Clock,
  GraduationCap,
  Sparkles,
  Link2,
  Calendar,
  ChevronDown,
  Check,
  GraduationCap as GradCap,
  Building2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Separator,
  Badge,
  ScrollArea,
} from "@/components/ui";
import { SkillsTagInput } from "@/components/ui/skills-tag-input";
import { CountrySelect } from "@/components/ui/select-dropdown";
import { toast } from "@/lib/stores/toast-store";

/* ══════════════════════════════════════════
   Step definitions — 2 steps
   ══════════════════════════════════════════ */
const STEPS = [
  { label: "Identity", icon: User },
  { label: "Profile", icon: Briefcase },
] as const;

/* ══════════════════════════════════════════
   Step transition animation
   ══════════════════════════════════════════ */
const stepTransition = {
  initial: { opacity: 0, x: 40, scale: 0.98 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    x: -40,
    scale: 0.98,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ══════════════════════════════════════════
   Contributor type card options
   ══════════════════════════════════════════ */
const CONTRIBUTOR_TYPE_OPTIONS = [
  { value: "Student", label: "Student", subtitle: "University / college", icon: GradCap },
  { value: "Women Workforce", label: "Women Workforce", subtitle: "Returnship / professional", icon: Building2 },
  { value: "General Workforce", label: "General Workforce", subtitle: "Professional contributor", icon: Users },
] as const;

/* ══════════════════════════════════════════
   Constants
   ══════════════════════════════════════════ */
const DEPARTMENT_CATEGORIES = [
  "Engineering",
  "Design",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
  "Legal",
  "Other",
];


const TIMEZONES = [
  { value: "Pacific/Midway", label: "UTC -11:00 (Midway)" },
  { value: "Pacific/Honolulu", label: "UTC -10:00 (Hawaii)" },
  { value: "America/Anchorage", label: "UTC -09:00 (Alaska)" },
  { value: "America/Los_Angeles", label: "UTC -08:00 (Pacific Time)" },
  { value: "America/Denver", label: "UTC -07:00 (Mountain Time)" },
  { value: "America/Chicago", label: "UTC -06:00 (Central Time)" },
  { value: "America/New_York", label: "UTC -05:00 (Eastern Time)" },
  { value: "America/Caracas", label: "UTC -04:30 (Venezuela)" },
  { value: "America/Halifax", label: "UTC -04:00 (Atlantic Time)" },
  { value: "America/St_Johns", label: "UTC -03:30 (Newfoundland)" },
  { value: "America/Sao_Paulo", label: "UTC -03:00 (Brasilia)" },
  { value: "Atlantic/South_Georgia", label: "UTC -02:00 (South Georgia)" },
  { value: "Atlantic/Azores", label: "UTC -01:00 (Azores)" },
  { value: "UTC", label: "UTC +00:00 (UTC)" },
  { value: "Europe/London", label: "UTC +00:00 (London)" },
  { value: "Europe/Berlin", label: "UTC +01:00 (Central European)" },
  { value: "Europe/Paris", label: "UTC +01:00 (Paris)" },
  { value: "Africa/Cairo", label: "UTC +02:00 (Cairo)" },
  { value: "Europe/Istanbul", label: "UTC +03:00 (Istanbul)" },
  { value: "Asia/Dubai", label: "UTC +04:00 (Dubai)" },
  { value: "Asia/Kolkata", label: "UTC +05:30 (India Standard Time)" },
  { value: "Asia/Kathmandu", label: "UTC +05:45 (Nepal)" },
  { value: "Asia/Dhaka", label: "UTC +06:00 (Bangladesh)" },
  { value: "Asia/Bangkok", label: "UTC +07:00 (Bangkok)" },
  { value: "Asia/Shanghai", label: "UTC +08:00 (China Standard)" },
  { value: "Asia/Singapore", label: "UTC +08:00 (Singapore)" },
  { value: "Asia/Tokyo", label: "UTC +09:00 (Japan)" },
  { value: "Asia/Seoul", label: "UTC +09:00 (Korea)" },
  { value: "Australia/Sydney", label: "UTC +10:00 (Sydney)" },
  { value: "Pacific/Noumea", label: "UTC +11:00 (New Caledonia)" },
  { value: "Pacific/Auckland", label: "UTC +12:00 (New Zealand)" },
];

/* ══════════════════════════════════════════
   Custom date picker
   ══════════════════════════════════════════ */
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DateInput({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const [mounted, setMounted] = React.useState(false);

  // Fix hydration mismatch - only use client-side date after mount
  const [viewYear, setViewYear] = React.useState(2000);
  const [viewMonth, setViewMonth] = React.useState(0);
  
  // Use useMemo for derived values to avoid hydration issues
  const today = React.useMemo(() => new Date(), []);
  const parsed = React.useMemo(() => value ? new Date(value + "T00:00:00") : null, [value]);
  
  React.useEffect(() => {
    setMounted(true);
    const parsedDate = value ? new Date(value + "T00:00:00") : null;
    const now = new Date();
    setViewYear(parsedDate?.getFullYear() ?? now.getFullYear());
    setViewMonth(parsedDate?.getMonth() ?? now.getMonth());
  }, [value]);

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4 + window.scrollY, left: rect.left + window.scrollX });
    }
  }, [open]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatDisplay = (v: string) => {
    if (!v) return "";
    const d = new Date(v + "T00:00:00");
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const days: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (day: number) =>
    parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  /* Year selection */
  const [showYearSelect, setShowYearSelect] = React.useState(false);
  const yearListRef = React.useRef<HTMLDivElement>(null);
  const yearItemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  
  // Generate years from 100 years ago to current year (useMemo to prevent hydration mismatch)
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const years = React.useMemo(() => 
    Array.from({ length: 101 }, (_, i) => currentYear - 100 + i).reverse(), 
    [currentYear]
  );
  
  // Scroll to selected year when opening year selector
  React.useEffect(() => {
    if (showYearSelect) {
      const selectedIndex = years.indexOf(viewYear);
      if (selectedIndex !== -1 && yearItemRefs.current[selectedIndex]) {
        setTimeout(() => {
          yearItemRefs.current[selectedIndex]?.scrollIntoView({ block: "center", behavior: "instant" });
        }, 10);
      }
    }
  }, [showYearSelect, viewYear, years]);

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center rounded-xl border bg-white px-4 py-2 pr-10 font-body text-sm transition-all duration-200 cursor-pointer text-left",
          error && "border-red-400"
        )}
        style={{
          color: value ? "var(--ink)" : "var(--ink-faint)",
          borderColor: error ? undefined : open ? "rgba(166,119,99,0.35)" : "var(--border-soft)",
          boxShadow: open ? "0 0 0 2px rgba(166,119,99,0.08)" : "none",
        }}
      >
        {formatDisplay(value) || placeholder || "dd-mm-yyyy"}
      </button>
      <Calendar
        className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: 15, height: 15, color: "var(--ink-faint)" }}
      />

      {open && mounted &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            className="fixed rounded-xl bg-white"
            suppressHydrationWarning
            style={{
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
              width: 280,
              padding: 16,
              border: "1px solid var(--border-soft)",
              boxShadow: "0 8px 24px rgba(77,55,46,0.10), 0 2px 6px rgba(77,55,46,0.06)",
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={prevMonth}
                className="flex items-center justify-center rounded-md transition-colors"
                style={{ width: 28, height: 28, color: "var(--ink-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(166,119,99,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
              </button>
              <button
                type="button"
                onClick={() => setShowYearSelect((s) => !s)}
                className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors"
                style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(166,119,99,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {MONTH_NAMES[viewMonth]} {viewYear}
                <ChevronDown 
                  className="w-3 h-3 transition-transform" 
                  style={{ transform: showYearSelect ? "rotate(180deg)" : "rotate(0deg)" }} 
                />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="flex items-center justify-center rounded-md transition-colors"
                style={{ width: 28, height: 28, color: "var(--ink-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(166,119,99,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Year Selector */}
            {showYearSelect ? (
              <div
                ref={yearListRef}
                className="rounded-lg overflow-hidden"
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid var(--border-soft)",
                  marginBottom: 12,
                }}
              >
                {years.map((year, index) => (
                  <button
                    key={year}
                    ref={(el) => { yearItemRefs.current[index] = el; }}
                    type="button"
                    onClick={() => {
                      setViewYear(year);
                      setShowYearSelect(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left transition-colors",
                      year === viewYear
                        ? "bg-brown-50/60 font-semibold"
                        : "hover:bg-beige-50/80"
                    )}
                    style={{ color: year === viewYear ? "#A67763" : "var(--ink)" }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-0" style={{ marginBottom: 4 }}>
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="flex items-center justify-center" style={{ height: 28, fontSize: 10, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: "0.03em" }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0">
                  {days.map((day, i) => (
                    <div key={i} className="flex items-center justify-center" style={{ height: 32 }}>
                      {day && (
                        <button
                          type="button"
                          onClick={() => selectDay(day)}
                          className="flex items-center justify-center rounded-md transition-all duration-150"
                          style={{
                            width: 30, height: 30, fontSize: 12, fontWeight: isSelected(day) ? 600 : 400,
                            background: isSelected(day) ? "linear-gradient(135deg, #A67763, #886151)" : "transparent",
                            color: isSelected(day) ? "#FFFFFF" : isToday(day) ? "#A67763" : "var(--ink)",
                            border: isToday(day) && !isSelected(day) ? "1px solid rgba(166,119,99,0.30)" : "1px solid transparent",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { if (!isSelected(day)) e.currentTarget.style.background = "rgba(166,119,99,0.06)"; }}
                          onMouseLeave={(e) => { if (!isSelected(day)) e.currentTarget.style.background = "transparent"; }}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Form data
   ══════════════════════════════════════════ */
interface ProfileFormData {
  /* Step 1: Identity */
  firstName: string;
  lastName: string;
  email: string;
  contributorType: string;
  country: string;
  /* Step 2: Profile */
  dateOfBirth: string;
  timeZone: string;
  weeklyAvailability: string;
  departmentCategory: string;
  degree: string;
  fieldOfStudy: string;
  primarySkills: string[];
  secondarySkills: string[];
  nicheSkills: string[];
  linkedInUrl: string;
}

const initialFormData: ProfileFormData = {
  firstName: "",
  lastName: "",
  email: "",
  contributorType: "",
  country: "",
  dateOfBirth: "",
  timeZone: "",
  weeklyAvailability: "",
  departmentCategory: "",
  degree: "",
  fieldOfStudy: "",
  primarySkills: [],
  secondarySkills: [],
  nicheSkills: [],
  linkedInUrl: "",
};

type FormErrors = Partial<Record<keyof ProfileFormData, string>>;

/* ══════════════════════════════════════════
   Section header helper
   ══════════════════════════════════════════ */
function SectionHeader({
  icon: Icon,
  title,
  optional,
}: {
  icon: React.ElementType;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Icon style={{ width: 15, height: 15, color: "var(--ink-muted)" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {title}
      </span>
      {optional && (
        <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-faint)" }}>(optional)</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */
export default function ContributorProfilePage() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<ProfileFormData>(initialFormData);
  const [errors, setErrors] = React.useState<FormErrors>({});

  const updateField = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  /* ── Validation ── */
  const validateStep = (step: number): boolean => {
    const errs: FormErrors = {};
    if (step === 0) {
      if (!formData.firstName.trim()) errs.firstName = "First name is required";
      if (!formData.lastName.trim()) errs.lastName = "Last name is required";
      if (!formData.email.trim()) {
        errs.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = "Enter a valid email address";
      }
      if (!formData.contributorType) errs.contributorType = "Select a contributor type";
      if (!formData.country) errs.country = "Select your country";
    }
    if (step === 1) {
      if (!formData.dateOfBirth) {
        errs.dateOfBirth = "Date of birth is required";
      } else {
        // Check if user is at least 18 years old
        const birthDate = new Date(formData.dateOfBirth + "T00:00:00");
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        
        // Adjust age if birthday hasn't occurred this year
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        
        if (actualAge < 18) {
          errs.dateOfBirth = "You must be 18 years or older";
        }
      }
      if (!formData.timeZone) errs.timeZone = "Time zone is required";
      if (formData.primarySkills.length === 0) errs.primarySkills = "Add at least one primary skill";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        toast.success("Profile saved successfully!");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[580px] mx-auto">

      {/* ═══════════════════════════════════
          STEP TIMELINE (horizontal text labels)
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ maxWidth: 480, margin: "0 auto" }}>
          {STEPS.map((step, idx, arr) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <React.Fragment key={idx}>
                <button
                  onClick={() => { if (idx < currentStep) setCurrentStep(idx); }}
                  className="transition-all duration-200"
                  style={{
                    cursor: idx < currentStep ? "pointer" : "default",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--ink)" : isDone ? "#A67763" : "var(--ink-faint)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {step.label}
                </button>
                {idx < arr.length - 1 && (
                  <div style={{ flex: 1, height: 1, margin: "0 12px", background: isDone ? "rgba(166,119,99,0.30)" : "rgba(166,119,99,0.10)" }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          STEP CONTENT CARD
          ═══════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} variants={stepTransition} initial="initial" animate="animate" exit="exit">
          <div
            className="rounded-2xl bg-white"
            style={{
              padding: "32px 32px 28px",
              border: "1px solid var(--border-soft)",
              boxShadow: "0 4px 24px rgba(77,55,46,0.06), 0 1px 4px rgba(77,55,46,0.04)",
            }}
          >
            {/* ─── Step 1: Basic Identity ─── */}
            {currentStep === 0 && (
              <div className="space-y-5">
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#A67763", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                    STEP 1 OF {STEPS.length}
                  </p>
                  <h2 className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                    Basic Identity
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                    Tell us who you are to get started
                  </p>
                </div>

                {/* First Name + Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      First Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      error={errors.firstName}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Last Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      error={errors.lastName}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    Email Address <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    error={errors.email}
                  />
                </div>

                {/* Contributor Type — Card selection */}
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    Contributor Type <span className="text-red-400">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {CONTRIBUTOR_TYPE_OPTIONS.map((opt) => {
                      const selected = formData.contributorType === opt.value;
                      const OptIcon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("contributorType", opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 transition-all duration-200 cursor-pointer text-center",
                            selected
                              ? "border-brown-400 bg-brown-50/50"
                              : "border-transparent bg-beige-50/60 hover:border-beige-300"
                          )}
                          style={{
                            border: selected ? "2px solid #A67763" : "2px solid var(--border-soft)",
                          }}
                        >
                          <OptIcon
                            style={{
                              width: 22,
                              height: 22,
                              color: selected ? "#A67763" : "var(--ink-muted)",
                            }}
                          />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
                            {opt.label}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--ink-faint)", lineHeight: 1.2 }}>
                            {opt.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.contributorType && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.contributorType}</p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    Country of Residence <span className="text-red-400">*</span>
                  </Label>
                  <CountrySelect
                    value={formData.country}
                    onChange={(v) => updateField("country", v)}
                    error={!!errors.country}
                    useNameAsValue
                  />
                  {errors.country && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">{errors.country}</p>
                  )}
                </div>

                {/* Continue button — full width */}
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
                  style={{
                    height: 48,
                    fontSize: 15,
                    background: "linear-gradient(135deg, #A67763, #886151)",
                    boxShadow: "0 2px 8px rgba(166,119,99,0.25)",
                    marginTop: 8,
                  }}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>

                {/* Sign in link */}
                <p className="text-center" style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 4 }}>
                  Already have an account?{" "}
                  <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#A67763" }}>
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {/* ─── Step 2: Profile & Skills ─── */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#A67763", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                    STEP 2 OF {STEPS.length}
                  </p>
                  <h2 className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                    Profile & Skills
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                    Add your profile details so we can intelligently match you to the right tasks
                  </p>
                </div>

                {/* Profile Basics */}
                <SectionHeader icon={Globe} title="Profile Basics" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Date of Birth <span className="text-red-400">*</span>
                    </Label>
                    <DateInput
                      value={formData.dateOfBirth}
                      onChange={(v) => updateField("dateOfBirth", v)}
                      placeholder="dd-mm-yyyy"
                      error={!!errors.dateOfBirth}
                    />
                    {!errors.dateOfBirth && (
                      <p className="text-[11px] font-medium mt-1" style={{ color: "var(--ink-faint)" }}>
                        Must be 18 years or older
                      </p>
                    )}
                    {errors.dateOfBirth && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.dateOfBirth}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Time Zone <span className="text-red-400">*</span>
                    </Label>
                    <Select value={formData.timeZone} onValueChange={(v) => updateField("timeZone", v)}>
                      <SelectTrigger className={cn(errors.timeZone && "border-red-400 focus:ring-red-400")}>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.timeZone && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.timeZone}</p>}
                  </div>
                </div>

                <Separator className="my-1 opacity-40" />

                {/* Work Preferences */}
                <SectionHeader icon={Clock} title="Work Preferences" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Weekly Availability <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={80}
                        placeholder="Hours per week"
                        value={formData.weeklyAvailability}
                        onChange={(e) => updateField("weeklyAvailability", e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-beige-500 pointer-events-none">
                        hrs/wk
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Department Category <span className="text-red-400">*</span>
                    </Label>
                    <Select value={formData.departmentCategory} onValueChange={(v) => updateField("departmentCategory", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_CATEGORIES.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-1 opacity-40" />

                {/* Education (Optional) */}
                <SectionHeader icon={GraduationCap} title="Education" optional />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Degree / Qualification</Label>
                    <Input placeholder="Highest degree or qualification" value={formData.degree} onChange={(e) => updateField("degree", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Field of Study / Branch</Label>
                    <Input placeholder="Field of study or major" value={formData.fieldOfStudy} onChange={(e) => updateField("fieldOfStudy", e.target.value)} />
                  </div>
                </div>

                <Separator className="my-1 opacity-40" />

                {/* Skills */}
                <SectionHeader icon={Sparkles} title="Skills" />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Primary Skills <span className="text-beige-500">({formData.primarySkills.length}/20)</span> — <span className="text-red-400 text-[11px]">required</span>
                    </Label>
                    <SkillsTagInput value={formData.primarySkills} onChange={(v) => updateField("primarySkills", v)} max={20} placeholder="Search and add your primary skills" error={errors.primarySkills} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Secondary Skills <span className="text-beige-500">({formData.secondarySkills.length}/20)</span> — <span className="text-beige-400 text-[11px]">optional</span>
                    </Label>
                    <SkillsTagInput value={formData.secondarySkills} onChange={(v) => updateField("secondarySkills", v)} max={20} placeholder="Search and add supporting skills" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      Other / Niche Skills <span className="text-beige-400 text-[11px]">(optional — not in list above)</span>
                    </Label>
                    <SkillsTagInput value={formData.nicheSkills} onChange={(v) => updateField("nicheSkills", v)} placeholder="Add a niche or custom skill" />
                    <p className="text-[11px] text-beige-500">Press Enter to add a custom skill</p>
                  </div>
                </div>

                <Separator className="my-1 opacity-40" />

                {/* Online Presence */}
                <SectionHeader icon={Link2} title="Online Presence" optional />
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>LinkedIn Profile URL</Label>
                  <Input type="url" placeholder="https://www.linkedin.com/in/your-profile" value={formData.linkedInUrl} onChange={(e) => updateField("linkedInUrl", e.target.value)} />
                </div>

                {/* Nav buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-200 hover:bg-beige-100"
                    style={{ height: 48, fontSize: 14, color: "var(--ink-muted)", paddingInline: 20, border: "1px solid var(--border-soft)" }}
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
                    style={{ height: 48, fontSize: 15, background: "linear-gradient(135deg, #A67763, #886151)", boxShadow: "0 2px 8px rgba(166,119,99,0.25)" }}
                  >
                    Complete <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
