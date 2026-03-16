"use client";
import {
  AlertCircle, ArrowRight, ArrowLeft, X,
  Briefcase, Users, GraduationCap, Clock,
  Sparkles, Globe, Link2,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui";
import { Checkbox } from "@/components/ui";
import { SKILL_OPTIONS, TIMEZONES } from "../data";
import type { ContributorType } from "../types";

/* ── Reusable section header ── */
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
      <div className="w-5 h-5 rounded-md bg-beige-100 flex items-center justify-center shrink-0">
        <Icon className="w-3 h-3 text-beige-500" />
      </div>
      <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">{title}</p>
      {badge && <span className="text-[10px] text-beige-400 font-medium">{badge}</span>}
    </div>
  );
}

/* ── Reusable skill tag pill ── */
function SkillPill({
  label,
  onRemove,
  variant = "teal",
}: {
  label: string;
  onRemove: () => void;
  variant?: "teal" | "beige" | "forest";
}) {
  const styles = {
    teal:   "bg-teal-100 border-teal-200 text-teal-800 [&_button]:text-teal-500 [&_button:hover]:text-teal-700",
    beige:  "bg-beige-100 border-beige-200 text-brown-800 [&_button]:text-beige-500 [&_button:hover]:text-brown-700",
    forest: "bg-forest-100 border-forest-200 text-forest-800 [&_button]:text-forest-500 [&_button:hover]:text-forest-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${styles[variant]}`}>
      {label}
      <button type="button" onClick={onRemove}><X className="w-3 h-3" /></button>
    </span>
  );
}

/* ── Skill input with autocomplete dropdown ── */
function SkillAutocomplete({
  label, badge, skills, onAdd, onRemove,
  inputValue, onInputChange,
  suggestions, maxItems = 20, placeholder, tagVariant = "teal",
}: {
  label: string;
  badge?: string;
  skills: string[];
  onAdd: (s: string) => void;
  onRemove: (s: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  suggestions: string[];
  maxItems?: number;
  placeholder: string;
  tagVariant?: "teal" | "beige" | "forest";
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        <span className="text-beige-400 text-xs">
          {badge ?? `(${skills.length}/${maxItems})`}
        </span>
      </Label>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => (
            <SkillPill key={s} label={s} onRemove={() => onRemove(s)} variant={tagVariant} />
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          disabled={skills.length >= maxItems}
        />
        {inputValue && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-beige-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.slice(0, 6).map(s => (
              <button key={s} type="button" onClick={() => onAdd(s)}
                className="w-full text-left px-4 py-2.5 text-sm text-brown-800 hover:bg-brown-50 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Free-form skill input (press Enter to add) ── */
function SkillFreeform({
  label, badge, skills, onAdd, onRemove,
  inputValue, onInputChange,
  maxItems = 20, placeholder,
}: {
  label: string;
  badge?: string;
  skills: string[];
  onAdd: (s: string) => void;
  onRemove: (s: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  maxItems?: number;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        <span className="text-beige-400 text-xs">{badge ?? `(${skills.length}/${maxItems})`}</span>
      </Label>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => (
            <SkillPill key={s} label={s} onRemove={() => onRemove(s)} variant="beige" />
          ))}
        </div>
      )}
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={e => onInputChange(e.target.value)}
        disabled={skills.length >= maxItems}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            const trimmed = inputValue.trim();
            if (trimmed && !skills.includes(trimmed)) onAdd(trimmed);
          }
        }}
      />
      <p className="text-[10px] text-beige-400">Press Enter to add a custom skill</p>
    </div>
  );
}

/* ─────────────────────────── Step3Profile ──────────────────────────── */

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
  mentorAck: boolean;            setMentorAck: (v: boolean) => void;
  // Primary skills
  primarySkills: string[];
  skillInput: string;            setSkillInput: (v: string) => void;
  addPrimarySkill: (s: string) => void;
  removePrimarySkill: (s: string) => void;
  // Secondary skills
  secondarySkills: string[];
  secondarySkillInput: string;   setSecondarySkillInput: (v: string) => void;
  addSecondarySkill: (s: string) => void;
  removeSecondarySkill: (s: string) => void;
  // Other skills (free-form)
  otherSkills: string[];
  otherSkillInput: string;       setOtherSkillInput: (v: string) => void;
  addOtherSkill: (s: string) => void;
  removeOtherSkill: (s: string) => void;
  // Type-specific
  workStart: string;             setWorkStart: (v: string) => void;
  workEnd: string;               setWorkEnd: (v: string) => void;
  careerStage: string;           setCareerStage: (v: string) => void;
  yearsExperience: string;       setYearsExperience: (v: string) => void;
  error: string;
  onContinue: () => void;
  onBack: () => void;
}

export function Step3Profile({
  contribType,
  dob, setDob,
  timezone, setTimezone,
  departmentCategory, setDepartmentCategory,
  departmentOther, setDepartmentOther,
  availability, setAvailability,
  degree, setDegree,
  branch, setBranch,
  linkedin, setLinkedin,
  mentorAck, setMentorAck,
  primarySkills, skillInput, setSkillInput, addPrimarySkill, removePrimarySkill,
  secondarySkills, secondarySkillInput, setSecondarySkillInput, addSecondarySkill, removeSecondarySkill,
  otherSkills, otherSkillInput, setOtherSkillInput, addOtherSkill, removeOtherSkill,
  workStart, setWorkStart,
  workEnd, setWorkEnd,
  careerStage, setCareerStage,
  yearsExperience, setYearsExperience,
  error,
  onContinue, onBack,
}: Props) {
  // Filtered suggestions for autocomplete
  const primarySuggestions = SKILL_OPTIONS.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) && !primarySkills.includes(s)
  );
  const secondarySuggestions = SKILL_OPTIONS.filter(
    s =>
      s.toLowerCase().includes(secondarySkillInput.toLowerCase()) &&
      !primarySkills.includes(s) &&
      !secondarySkills.includes(s)
  );

  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 2 of 4</p>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Profile &amp; Skills</p>
          <p className="text-xs text-beige-500 mt-0.5">Add your profile details so we can intelligently match you to the right tasks</p>
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeader icon={Globe} title="Profile Basics" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth <span className="text-red-400">*</span></Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
                <p className="text-[10px] text-beige-400">Must be 18 years or older</p>
              </div>
              <div className="space-y-2">
                <Label>Time Zone <span className="text-red-400">*</span></Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue placeholder="Select your timezone" /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ══ Work Preferences ══ */}
          <div>
            <SectionHeader icon={Clock} title="Work Preferences" />
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="avail">Weekly Availability <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Input id="avail" type="number" min="1" max="60"
                    placeholder="Hours per week"
                    value={availability} onChange={e => setAvailability(e.target.value)} className="pr-14" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-beige-400 pointer-events-none">hrs/wk</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department Category <span className="text-red-400">*</span></Label>
                <Select value={departmentCategory} onValueChange={setDepartmentCategory}>
                  <SelectTrigger><SelectValue placeholder="Select your department" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Technology</SelectLabel>
                      <SelectItem value="engineering">Engineering &amp; Development</SelectItem>
                      <SelectItem value="devops">DevOps &amp; Infrastructure</SelectItem>
                      <SelectItem value="data">Data &amp; Analytics</SelectItem>
                      <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                      <SelectItem value="qa">Quality Assurance &amp; Testing</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Creative &amp; Design</SelectLabel>
                      <SelectItem value="design">Design &amp; UX/UI</SelectItem>
                      <SelectItem value="content">Content &amp; Copywriting</SelectItem>
                      <SelectItem value="media">Media &amp; Video Production</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Business</SelectLabel>
                      <SelectItem value="product">Product Management</SelectItem>
                      <SelectItem value="marketing">Marketing &amp; Growth</SelectItem>
                      <SelectItem value="sales">Sales &amp; Business Development</SelectItem>
                      <SelectItem value="finance">Finance &amp; Accounting</SelectItem>
                      <SelectItem value="operations">Operations &amp; Strategy</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>People &amp; Support</SelectLabel>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="customer-support">Customer Support</SelectItem>
                      <SelectItem value="legal">Legal &amp; Compliance</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Research &amp; Education</SelectLabel>
                      <SelectItem value="research">Research &amp; Development</SelectItem>
                      <SelectItem value="education">Education &amp; Training</SelectItem>
                    </SelectGroup>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {departmentCategory === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="deptOther">Department Name <span className="text-red-400">*</span></Label>
                  <Input id="deptOther" placeholder="Enter your department name"
                    value={departmentOther} onChange={e => setDepartmentOther(e.target.value)} maxLength={80} />
                </div>
              )}
            </div>
          </div>

          {/* ══ Education ══ */}
          <div>
            <SectionHeader icon={GraduationCap} title="Education" badge="(optional)" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="degree">Degree / Qualification</Label>
                <Input id="degree" placeholder="Highest degree or qualification"
                  value={degree} onChange={e => setDegree(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Field of Study / Branch</Label>
                <Input id="branch" placeholder="Field of study or major"
                  value={branch} onChange={e => setBranch(e.target.value)} maxLength={80} />
              </div>
            </div>
          </div>

          {/* ══ Skills ══ */}
          <div>
            <SectionHeader icon={Sparkles} title="Skills" />
            <div className="space-y-4">
              <SkillAutocomplete
                label="Primary Skills"
                badge={`(${primarySkills.length}/20) — required`}
                skills={primarySkills}
                onAdd={addPrimarySkill}
                onRemove={removePrimarySkill}
                inputValue={skillInput}
                onInputChange={setSkillInput}
                suggestions={primarySuggestions}
                placeholder="Search and add your primary skills"
                tagVariant="teal"
              />
              <SkillAutocomplete
                label="Secondary Skills"
                badge={`(${secondarySkills.length}/20) — optional`}
                skills={secondarySkills}
                onAdd={addSecondarySkill}
                onRemove={removeSecondarySkill}
                inputValue={secondarySkillInput}
                onInputChange={setSecondarySkillInput}
                suggestions={secondarySuggestions}
                placeholder="Search and add supporting skills"
                tagVariant="forest"
              />
              <SkillFreeform
                label="Other / Niche Skills"
                badge="(optional — not in list above)"
                skills={otherSkills}
                onAdd={addOtherSkill}
                onRemove={removeOtherSkill}
                inputValue={otherSkillInput}
                onInputChange={setOtherSkillInput}
                placeholder="Add a niche or custom skill"
              />
            </div>
          </div>

          {/* ══ Online Presence ══ */}
          <div>
            <SectionHeader icon={Link2} title="Online Presence" badge="(optional)" />
            <div className="space-y-2">
              <Label htmlFor="li">LinkedIn Profile URL</Label>
              <Input id="li" type="url" placeholder="https://www.linkedin.com/in/your-profile"
                value={linkedin} onChange={e => setLinkedin(e.target.value)} />
            </div>
          </div>

          {/* ══ Women Workforce ══ */}
          {contribType === "women_workforce" && (
            <div className="space-y-4 p-4 rounded-xl bg-teal-50 border border-teal-200">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-600" />
                <p className="text-sm font-semibold text-teal-800">Schedule Preferences</p>
                <span className="text-xs text-teal-500 ml-1">(optional)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ws">Preferred Start Time</Label>
                  <Input id="ws" type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="we">Preferred End Time</Label>
                  <Input id="we" type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Career Stage</Label>
                <Select value={careerStage} onValueChange={setCareerStage}>
                  <SelectTrigger><SelectValue placeholder="Select your career stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="re-entering">Re-entering the workforce</SelectItem>
                    <SelectItem value="mid-career">Mid-career professional</SelectItem>
                    <SelectItem value="senior">Senior professional</SelectItem>
                    <SelectItem value="career-change">Career transition / change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ══ Mentor Acknowledgment ══ */}
          <label
            htmlFor="mentor-ack"
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
              mentorAck
                ? "border-brown-400 bg-brown-50"
                : "border-beige-200 hover:border-beige-300 bg-white"
            }`}
          >
            <Checkbox
              id="mentor-ack"
              checked={mentorAck}
              onCheckedChange={v => setMentorAck(!!v)}
              onClick={e => e.stopPropagation()}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm text-brown-800 leading-relaxed">
              I understand that my first 3 tasks will require an assigned{" "}
              <span className="font-semibold text-brown-950">Reviewer / Mentor</span>{" "}
              to guide my onboarding journey.{" "}
              <span className="text-red-400">*</span>
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>

          <button type="button" onClick={onBack}
            className="w-full text-sm text-beige-600 hover:text-beige-800 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
