"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Globe, MapPin, Clock,
  Lock, CheckCircle2, Plus, Trash2, Save, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockContributorProfile } from "@/mocks/data/contributor";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* ═══ Styled Input ═══ */

function Input({ label, icon: Icon, readOnly, ...props }: {
  label: string;
  icon?: React.ElementType;
  readOnly?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = React.useId();
  return (
    <div>
      <label htmlFor={inputId} className="text-[11px] font-medium text-gray-500 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden="true" />}
        <input
          id={inputId}
          {...props}
          readOnly={readOnly}
          aria-label={label}
          className={cn(
            "w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-teal-500 transition-colors",
            Icon && "pl-9",
            readOnly && "cursor-not-allowed opacity-60"
          )}
        />
        {readOnly && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" aria-hidden="true" />}
      </div>
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaId = React.useId();
  return (
    <div>
      <label htmlFor={textareaId} className="text-[11px] font-medium text-gray-500 mb-1.5 block">{label}</label>
      <textarea
        id={textareaId}
        {...props}
        aria-label={label}
        className="w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-teal-500 transition-colors resize-none"
      />
    </div>
  );
}

function Select({ label, icon: Icon, children, ...props }: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const selectId = React.useId();
  return (
    <div>
      <label htmlFor={selectId} className="text-[11px] font-medium text-gray-500 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" aria-hidden="true" />}
        <select
          id={selectId}
          {...props}
          aria-label={label}
          className={cn(
            "w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-teal-500 transition-colors appearance-none",
            Icon && "pl-9"
          )}
        >
          {children}
        </select>
      </div>
    </div>
  );
}

/* ═══ Constants ═══ */

const countries = [
  "India", "Pakistan", "Philippines", "Malaysia", "Singapore",
  "Nigeria", "South Africa", "Kenya", "Bangladesh", "Indonesia",
  "United States", "United Kingdom", "Canada", "Germany", "Australia",
];

const timezones = [
  "Asia/Kolkata", "Asia/Karachi", "Asia/Manila", "Asia/Kuala_Lumpur",
  "Asia/Singapore", "Africa/Lagos", "Africa/Johannesburg", "Asia/Dhaka",
  "Asia/Jakarta", "America/New_York", "America/Chicago", "Europe/London",
  "Europe/Berlin", "Australia/Sydney", "Pacific/Auckland",
];

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ur", label: "Urdu" },
  { value: "bn", label: "Bengali" },
  { value: "tl", label: "Filipino" },
  { value: "ms", label: "Malay" },
  { value: "sw", label: "Swahili" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
];

const proficiencyLevels = ["beginner", "intermediate", "advanced", "expert"];

const availableSkills = [
  "React", "TypeScript", "Node.js", "Python", "Go", "Java",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes",
  "AWS", "Azure", "GraphQL", "REST API", "Git", "CI/CD",
  "Flutter", "Swift", "Kotlin", "Figma", "TensorFlow",
];

/* ═══ PAGE ═══ */

export default function ProfileEditPage() {
  const profile = mockContributorProfile;

  /* ─── Form State ─── */
  const [displayName, setDisplayName] = React.useState(profile.displayName);
  const [bio, setBio] = React.useState(profile.bio || "");
  const [phone, setPhone] = React.useState(profile.phone || "");
  const [country, setCountry] = React.useState(profile.country || "India");
  const [city, setCity] = React.useState(profile.city || "Bangalore");
  const [timezone, setTimezone] = React.useState(profile.timezone);
  const [weeklyHours, setWeeklyHours] = React.useState(profile.weeklyHours);
  const [availability, setAvailability] = React.useState(profile.availability);
  const [language, setLanguage] = React.useState(profile.language);

  const [skills, setSkills] = React.useState(
    profile.skills.map((s) => ({ name: s.name, proficiency: s.proficiency }))
  );

  const [showSuccess, setShowSuccess] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  /* ─── Auto-save (FSD §4) ─── */
  const isDirty = React.useRef(false);
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<"idle" | "saving" | "saved" | "unsaved" | "error">("idle");

  const mountedRef = React.useRef(true);
  React.useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  // Mark form as dirty on any field change
  React.useEffect(() => {
    isDirty.current = true;
    setAutoSaveStatus("unsaved");
  }, [displayName, bio, phone, country, city, timezone, weeklyHours, availability, language, skills]);

  // Auto-save every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty.current) {
        isDirty.current = false;
        setAutoSaveStatus("saving");
        // Simulate save (in production: await fetch('/api/profile', ...))
        setTimeout(() => {
          if (!mountedRef.current) return;
          setAutoSaveStatus("saved");
          setTimeout(() => { if (mountedRef.current) setAutoSaveStatus("idle"); }, 2000);
        }, 500);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Validation ─── */
  function validateForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!displayName.trim()) errors.displayName = "Display name is required";
    else if (displayName.trim().length < 2) errors.displayName = "Display name must be at least 2 characters";
    if (phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) errors.phone = "Invalid phone number format";
    if (weeklyHours < 1 || weeklyHours > 168) errors.weeklyHours = "Weekly hours must be between 1 and 168";
    if (!timezone) errors.timezone = "Timezone is required";
    if (skills.length === 0) errors.skills = "At least one skill is required";
    return errors;
  }

  /* ─── Handlers ─── */

  const handleSave = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);
    isDirty.current = false;
    setAutoSaveStatus("saved");
    setShowSuccess(true);
    setTimeout(() => { if (mountedRef.current) { setShowSuccess(false); setSaving(false); } }, 3000);
    setTimeout(() => { if (mountedRef.current) setAutoSaveStatus("idle"); }, 2000);
  };

  const updateSkillProficiency = (index: number, proficiency: string) => {
    setSkills((prev) => prev.map((s, i) => i === index ? { ...s, proficiency } : s));
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    const existing = new Set(skills.map((s) => s.name));
    const next = availableSkills.find((s) => !existing.has(s));
    if (next) {
      setSkills((prev) => [...prev, { name: next, proficiency: "beginner" }]);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ SUCCESS TOAST ═══ */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-forest-50 border border-forest-200 text-forest-700 px-4 py-3 rounded-xl shadow-lg"
          role="alert"
        >
          <CheckCircle2 className="w-4 h-4 text-forest-500" aria-hidden="true" />
          <span className="text-[13px] font-medium">Profile updated successfully</span>
        </motion.div>
      )}

      {/* ═══ AUTO-SAVE STATUS INDICATOR (FSD §4) ═══ */}
      <AnimatePresence>
        {autoSaveStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-xl shadow-md border"
            style={{
              background: autoSaveStatus === "saved" ? "var(--color-forest-50, #f0fdf4)" : autoSaveStatus === "saving" ? "var(--color-teal-50, #f0fdfa)" : autoSaveStatus === "error" ? "#fef2f2" : "var(--color-gold-50, #fffbeb)",
              borderColor: autoSaveStatus === "saved" ? "var(--color-forest-200, #bbf7d0)" : autoSaveStatus === "saving" ? "var(--color-teal-200, #99f6e4)" : autoSaveStatus === "error" ? "#fecaca" : "var(--color-gold-200, #fde68a)",
            }}
            role="status"
            aria-live="polite"
          >
            {autoSaveStatus === "saving" && (
              <>
                <Save className="w-3.5 h-3.5 text-teal-500 animate-pulse" aria-hidden="true" />
                <span className="text-[11px] font-medium text-teal-700">Auto-saving...</span>
              </>
            )}
            {autoSaveStatus === "saved" && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" aria-hidden="true" />
                <span className="text-[11px] font-medium text-forest-700">Auto-saved</span>
              </>
            )}
            {autoSaveStatus === "unsaved" && (
              <>
                <span className="w-2 h-2 rounded-full bg-gold-500" aria-hidden="true" />
                <span className="text-[11px] font-medium text-gold-700">Unsaved changes</span>
              </>
            )}
            {autoSaveStatus === "error" && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                <span className="text-[11px] font-medium text-red-600">Auto-save failed</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            Edit Profile
          </h1>
        </div>
      </motion.div>

      {/* ═══ PROFILE COMPLETENESS ═══ */}
      <motion.div variants={fadeUp}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
            <span className="text-sm font-semibold text-teal-700">{profile.profileCompleteness}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
              style={{ width: `${profile.profileCompleteness}%` }}
            />
          </div>
          {profile.profileCompleteness < 60 && (
            <p className="text-xs text-gold-700 mt-1">Complete at least 60% to unlock the skills assessment</p>
          )}
        </div>
      </motion.div>

      {/* ═══ SECTION 1: PERSONAL INFO ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <User className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-800">Personal Info</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          {/* Avatar display (non-editable) */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-lg font-semibold shrink-0">
              {profile.avatar}
            </div>
            <div>
              <span className="text-[12px] font-medium text-gray-700 block">{profile.anonymousId}</span>
              <span className="text-[10px] text-gray-400">Avatar initials are auto-generated</span>
            </div>
          </div>

          <Input
            label="Display Name"
            icon={User}
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.displayName; return n; }); }}
          />
          {formErrors.displayName && <p className="text-xs text-red-500 -mt-2 ml-1" role="alert">{formErrors.displayName}</p>}

          <Textarea
            label="Bio"
            rows={3}
            placeholder="Tell us a bit about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </motion.div>

      {/* ═══ SECTION 2: CONTACT ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <Mail className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-800">Contact</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          <Input
            label="Email"
            icon={Mail}
            value={profile.email}
            readOnly
          />
          <Input
            label="Phone"
            icon={Phone}
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.phone; return n; }); }}
            placeholder="+91-XXXXXXXXXX"
          />
          {formErrors.phone && <p className="text-xs text-red-500 -mt-2 ml-1" role="alert">{formErrors.phone}</p>}
        </div>
      </motion.div>

      {/* ═══ SECTION 3: LOCATION ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <MapPin className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-800">Location</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          <Select label="Country" icon={Globe} value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          <Input
            label="City"
            icon={MapPin}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
          />

          <Select label="Timezone" icon={Clock} value={timezone} onChange={(e) => { setTimezone(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.timezone; return n; }); }}>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </Select>
          {formErrors.timezone && <p className="text-xs text-red-500 -mt-2 ml-1" role="alert">{formErrors.timezone}</p>}
        </div>
      </motion.div>

      {/* ═══ SECTION 4: AVAILABILITY ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <Clock className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-800">Availability</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label htmlFor="weekly-hours" className="text-[11px] font-medium text-gray-500 mb-1.5 block">Weekly Hours</label>
            <input
              id="weekly-hours"
              type="number"
              min={1}
              max={60}
              value={weeklyHours}
              onChange={(e) => { setWeeklyHours(Number(e.target.value)); setFormErrors((p) => { const n = { ...p }; delete n.weeklyHours; return n; }); }}
              aria-label="Weekly hours availability"
              className="w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-teal-500 transition-colors"
            />
            {formErrors.weeklyHours && <p className="text-xs text-red-500 mt-1" role="alert">{formErrors.weeklyHours}</p>}
          </div>

          <Select label="Availability Status" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="away">Away</option>
          </Select>

          <Select label="Language Preference" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </Select>
        </div>
      </motion.div>

      {/* ═══ SECTION 5: SKILLS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Skills</span>
          <Badge variant="teal">{skills.length}</Badge>
        </div>
        {formErrors.skills && <p className="text-xs text-red-500 px-5 pt-2" role="alert">{formErrors.skills}</p>}
        <div className="py-2">
          {skills.length === 0 && (
            <p className="text-xs text-gray-400 px-5 py-4 text-center">No skills added. Add at least one skill.</p>
          )}
          {skills.map((skill, i) => (
            <div
              key={skill.name}
              className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: i < skills.length - 1 ? "1px solid var(--border-hair)" : undefined }}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium text-gray-800">{skill.name}</span>
              </div>
              <select
                value={skill.proficiency}
                onChange={(e) => updateSkillProficiency(i, e.target.value)}
                aria-label={`Proficiency level for ${skill.name}`}
                className="text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-teal-500 transition-colors appearance-none"
              >
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeSkill(i)}
                aria-label={`Remove ${skill.name} skill`}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <button
            onClick={addSkill}
            aria-label="Add a new skill"
            className="flex items-center gap-1.5 text-[12px] font-medium text-brown-500 hover:text-brown-600 transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Skill
          </button>
        </div>
      </motion.div>

      {/* ═══ BOTTOM ACTIONS ═══ */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          aria-label="Save profile changes"
          aria-busy={saving}
          className="bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 text-white rounded-xl px-6 py-2.5 text-[13px] font-medium transition-all focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {Object.keys(formErrors).length > 0 && (
          <span className="text-xs text-red-500" role="alert">Please fix the errors above</span>
        )}
        <Link href="/contributor/profile">
          <button aria-label="Cancel editing and return to profile" className="border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-6 py-2.5 text-[13px] font-medium transition-all focus:ring-2 focus:ring-teal-500 focus:outline-none">
            Cancel
          </button>
        </Link>
      </motion.div>

    </motion.div>
  );
}
