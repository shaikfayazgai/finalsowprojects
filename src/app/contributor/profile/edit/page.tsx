"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  User, Mail, Phone, Globe, MapPin, Clock,
  Lock, CheckCircle2, Plus, Trash2, AlertCircle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import {
  fetchContributorProfile,
  isAvatarImageUrl,
  patchContributorProfile,
  putContributorProfileSkills,
  type ContributorProfileResponse,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { useContributorPhonePrefill } from "@/lib/stores/contributor-phone-store";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";

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
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />}
        <input
          {...props}
          readOnly={readOnly}
          className={cn(
            "w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors",
            Icon && "pl-9",
            readOnly && "cursor-not-allowed opacity-60"
          )}
        />
        {readOnly && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />}
      </div>
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">{label}</label>
      <textarea
        {...props}
        className="w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors resize-none"
      />
    </div>
  );
}

function Select({ label, icon: Icon, children, ...props }: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />}
        <select
          {...props}
          className={cn(
            "w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors appearance-none",
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

function normalizeProficiency(p?: string) {
  const v = (p ?? "intermediate").toLowerCase();
  if (v === "beginner" || v === "intermediate" || v === "advanced" || v === "expert") return v;
  return "intermediate";
}

/* ═══ PAGE ═══ */

export default function ProfileEditPage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = getContributorAccessToken(session);
  const contributorId = session?.user?.id ?? "";

  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [anonymousId, setAnonymousId] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [city, setCity] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [weeklyHours, setWeeklyHours] = React.useState(0);
  const [availability, setAvailability] = React.useState("available");
  const [language, setLanguage] = React.useState("en");
  const [skills, setSkills] = React.useState<Array<{ name: string; proficiency: string }>>([]);

  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const displayInitials = displayName
    ? displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  React.useEffect(() => {
    const { phone: stored } = useContributorPhonePrefill.getState();
    if (!stored || stored.replace(/\D/g, "").length < 7) return;
    setPhone((prev) => (prev.replace(/\D/g, "").length >= 7 ? prev : stored));
  }, []);

  const applyProfileFromApi = React.useCallback((data: ContributorProfileResponse) => {
    setDisplayName(String(data.display_name ?? ""));
    setEmail(String(data.email ?? ""));
    setAnonymousId(String(data.anonymous_id ?? ""));
    setAvatar(String(data.avatar ?? ""));
    setBio(String(data.bio ?? ""));
    setPhone(String(data.phone ?? ""));
    setCountry(String(data.country ?? ""));
    setCity(String(data.city ?? ""));
    setTimezone(String(data.timezone ?? ""));
    setWeeklyHours(Number(data.weekly_hours ?? 0));
    setAvailability(String(data.availability ?? "available").toLowerCase() || "available");
    setLanguage(String(data.language ?? "en"));
    setSkills(
      (data.skills ?? []).map((s) => ({
        name: String(s.name ?? ""),
        proficiency: normalizeProficiency(s.proficiency),
      })),
    );
  }, []);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token || !contributorId) {
      setLoading(false);
      setLoadError("Please sign in to edit your profile.");
      return;
    }
    setLoading(true);
    setLoadError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:profile-edit:${contributorId}:${sk}:${retryKey}`, () =>
      fetchContributorProfile(token, contributorId),
    )
      .then((data) => {
        if (!live) return;
        applyProfileFromApi(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!live) return;
        setLoadError(err.message ?? "Failed to load profile");
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, contributorId, sessionStatus, retryKey, applyProfileFromApi]);

  const handleSave = async () => {
    if (!token || !contributorId || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      await patchContributorProfile(token, contributorId, {
        display_name: displayName,
        bio,
        phone,
        country,
        city,
        timezone,
        weekly_hours: Number.isFinite(weeklyHours) ? weeklyHours : 0,
        availability,
        language,
      });
      const updated = await putContributorProfileSkills(token, contributorId, {
        skills: skills
          .map((s) => ({ name: s.name.trim(), proficiency: normalizeProficiency(s.proficiency) }))
          .filter((s) => s.name.length > 0),
      });
      applyProfileFromApi(updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
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

  if (sessionStatus === "loading" || (token && contributorId && loading)) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="card-parchment h-48 bg-[#faf8f5] animate-pulse" />
        <div className="card-parchment h-36 bg-[#faf8f5] animate-pulse" />
      </motion.div>
    );
  }

  if (!token || !contributorId) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="card-parchment px-6 py-10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-800 text-[13px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {loadError || "You need to be signed in to edit your profile."}
        </div>
      </motion.div>
    );
  }

  if (loadError) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="card-parchment px-6 py-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-red-700 text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {loadError}
          </div>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {saveError && (
        <motion.div variants={fadeUp} className="mb-4 card-parchment px-4 py-3 text-[13px] text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError}
        </motion.div>
      )}

      {/* ═══ SUCCESS TOAST ═══ */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-forest-50 border border-forest-200 text-forest-700 px-4 py-3 rounded-xl shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-forest-500" />
          <span className="text-[13px] font-medium">Profile updated successfully</span>
        </motion.div>
      )}

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            Edit Profile
          </h1>
        </div>
      </motion.div>

      {/* ═══ SECTION 1: PERSONAL INFO ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Personal Info</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          {/* Avatar display (non-editable) */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-lg font-semibold shrink-0 overflow-hidden">
              {isAvatarImageUrl(avatar) ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (avatar || displayInitials).slice(0, 2)
              )}
            </div>
            <div>
              <span className="text-[12px] font-medium text-gray-700 block">{anonymousId || "—"}</span>
              <span className="text-[10px] text-gray-400">Avatar from your Glimmora profile</span>
            </div>
          </div>

          <Input
            label="Display Name"
            icon={User}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

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
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Contact</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          <Input
            label="Email"
            icon={Mail}
            value={email}
            readOnly
          />
          <Input
            label="Phone"
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91-XXXXXXXXXX"
          />
        </div>
      </motion.div>

      {/* ═══ SECTION 3: LOCATION ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Location</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          <Select label="Country" icon={Globe} value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select country</option>
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

          <Select label="Timezone" icon={Clock} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="">Select timezone</option>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </Select>
        </div>
      </motion.div>

      {/* ═══ SECTION 4: AVAILABILITY ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Availability</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Weekly Hours</label>
            <input
              type="number"
              min={0}
              max={60}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors"
            />
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
        <div className="py-2">
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
                className="text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors appearance-none"
              >
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeSkill(i)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <button
            onClick={addSkill}
            className="flex items-center gap-1.5 text-[12px] font-medium text-brown-500 hover:text-brown-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Skill
          </button>
        </div>
      </motion.div>

      {/* ═══ BOTTOM ACTIONS ═══ */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "text-white rounded-xl px-6 py-2.5 text-[13px] font-medium transition-all",
            saving ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700",
          )}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <Link href="/contributor/profile">
          <button className="border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-6 py-2.5 text-[13px] font-medium transition-all">
            Cancel
          </button>
        </Link>
      </motion.div>

    </motion.div>
  );
}
