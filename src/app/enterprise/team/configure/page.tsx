"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Settings,
  Save,
  Users,
  Clock,
  Target,
  Globe,
  Sparkles,
  Shield,
  SlidersHorizontal,
  Tag,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Input,
  Checkbox,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Label,
} from "@/components/ui";

/* ── Skill tag component with remove ── */
function SkillTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/50 group">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 text-teal-400 hover:text-teal-700 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ── Slider with label ── */
function RangeSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "%",
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-brown-800 font-medium">{label}</span>
        <span className="text-[13px] font-bold text-brown-900 font-mono">
          {value}
          {suffix}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "bg-beige-200",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
            color
          )}
          style={{
            background: `linear-gradient(to right, var(--slider-fill, #A67763) 0%, var(--slider-fill, #A67763) ${((value - min) / (max - min)) * 100}%, #E9DFD7 ${((value - min) / (max - min)) * 100}%, #E9DFD7 100%)`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
    >
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center shrink-0 text-beige-600">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-brown-900">{title}</h3>
          <p className="text-[11px] text-beige-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   TEAM CONSTRAINTS CONFIG PAGE
   ══════════════════════════════════════════ */
export default function TeamConfigurePage() {
  /* Skill tags state */
  const [skills, setSkills] = React.useState<string[]>([
    "Full-Stack",
    "Backend",
    "DevOps",
    "QA",
    "Design",
  ]);
  const [skillInput, setSkillInput] = React.useState("");

  /* Team size */
  const [minSize, setMinSize] = React.useState("3");
  const [maxSize, setMaxSize] = React.useState("10");

  /* Availability */
  const [fullTimeRequired, setFullTimeRequired] = React.useState(true);
  const [partTimeAccepted, setPartTimeAccepted] = React.useState(true);

  /* Track preferences */
  const [womenPct, setWomenPct] = React.useState(40);
  const [studentPct, setStudentPct] = React.useState(30);
  const generalPct = 100 - womenPct - studentPct;

  /* Quality threshold */
  const [qualityThreshold, setQualityThreshold] = React.useState(80);

  /* Timezone */
  const [timezone, setTimezone] = React.useState("any");

  function addSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((sk) => sk !== s));
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[900px] mx-auto space-y-6"
    >
      {/* Back + header */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/team"
          className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Team Formation
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-500 to-gold-500 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-brown-900 tracking-[-0.02em]">
                Team Configuration
              </h1>
              <p className="text-[12px] text-beige-500 mt-0.5">
                Configure constraints for AI-powered team formation
              </p>
            </div>
          </div>
          <Button variant="gradient-primary" size="sm">
            <Save className="w-3.5 h-3.5" />
            Save Configuration
          </Button>
        </div>
      </motion.div>

      {/* Preferred Skills */}
      <FormSection
        icon={Tag}
        title="Preferred Skills"
        description="Define the skills required for team formation. The AI engine will prioritize contributors with these skills."
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill) => (
            <SkillTag
              key={skill}
              label={skill}
              onRemove={() => removeSkill(skill)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder="Type a skill and press Enter..."
            className="flex-1 h-9 text-[12px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addSkill}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
      </FormSection>

      {/* Team Size Constraints */}
      <FormSection
        icon={Users}
        title="Team Size Constraints"
        description="Set the minimum and maximum team size. The AI will form teams within these bounds."
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[12px] text-beige-600">
              Minimum Members
            </Label>
            <Input
              type="number"
              value={minSize}
              onChange={(e) => setMinSize(e.target.value)}
              min={1}
              max={50}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[12px] text-beige-600">
              Maximum Members
            </Label>
            <Input
              type="number"
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              min={1}
              max={50}
              className="h-10"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-beige-50 p-3 border border-beige-200/50">
          <Sparkles className="w-3.5 h-3.5 text-gold-500 shrink-0" />
          <p className="text-[11px] text-beige-600">
            AI will optimize team size based on task complexity and skill
            requirements, staying within your bounds.
          </p>
        </div>
      </FormSection>

      {/* Availability Requirements */}
      <FormSection
        icon={Clock}
        title="Availability Requirements"
        description="Specify availability constraints for team members."
      >
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={fullTimeRequired}
              onCheckedChange={(v) => setFullTimeRequired(!!v)}
            />
            <div>
              <p className="text-[13px] font-medium text-brown-800 group-hover:text-brown-600 transition-colors">
                Full-time required
              </p>
              <p className="text-[11px] text-beige-500">
                At least one member must be available full-time
              </p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={partTimeAccepted}
              onCheckedChange={(v) => setPartTimeAccepted(!!v)}
            />
            <div>
              <p className="text-[13px] font-medium text-brown-800 group-hover:text-brown-600 transition-colors">
                Part-time accepted
              </p>
              <p className="text-[11px] text-beige-500">
                Allow part-time contributors for non-critical tasks
              </p>
            </div>
          </label>
        </div>
      </FormSection>

      {/* Track Preferences */}
      <FormSection
        icon={SlidersHorizontal}
        title="Track Preferences"
        description="Set preferred distribution across contributor tracks. These are soft preferences, not hard constraints."
      >
        <div className="space-y-5">
          <RangeSlider
            label="Women's Program"
            value={womenPct}
            onChange={(v) => {
              setWomenPct(v);
              if (v + studentPct > 100) setStudentPct(100 - v);
            }}
            suffix="%"
            color="[&::-webkit-slider-thumb]:bg-brown-500"
          />
          <RangeSlider
            label="University Track"
            value={studentPct}
            onChange={(v) => {
              setStudentPct(v);
              if (v + womenPct > 100) setWomenPct(100 - v);
            }}
            suffix="%"
            color="[&::-webkit-slider-thumb]:bg-teal-500"
          />
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-beige-50 border border-beige-200/50">
            <span className="text-[12px] text-beige-600 font-medium">
              General Track
            </span>
            <span className="text-[13px] font-bold text-brown-900 font-mono">
              {generalPct}%
            </span>
          </div>

          {/* Visual distribution bar */}
          <div className="h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-brown-400 to-brown-500 transition-all duration-300"
              style={{ width: `${womenPct}%` }}
            />
            <div
              className="bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-300"
              style={{ width: `${studentPct}%` }}
            />
            <div
              className="bg-gradient-to-r from-beige-300 to-beige-400 transition-all duration-300"
              style={{ width: `${generalPct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-brown-500" />
              <span className="text-beige-600">Women ({womenPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-beige-600">
                Student ({studentPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-beige-400" />
              <span className="text-beige-600">
                General ({generalPct}%)
              </span>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Time Zone Requirements */}
      <FormSection
        icon={Globe}
        title="Time Zone Requirements"
        description="Restrict team formation to specific time zones for synchronous collaboration."
      >
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time zone preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Time Zone</SelectItem>
            <SelectItem value="gmt-plus-5">
              GMT+5 (Pakistan, India)
            </SelectItem>
            <SelectItem value="gmt-plus-5-30">
              GMT+5:30 (India Standard)
            </SelectItem>
            <SelectItem value="gmt-plus-3">
              GMT+3 (Middle East)
            </SelectItem>
            <SelectItem value="gmt-plus-8">GMT+8 (Southeast Asia)</SelectItem>
            <SelectItem value="gmt-minus-5">
              GMT-5 (US Eastern)
            </SelectItem>
            <SelectItem value="gmt-overlap">
              Overlapping Hours (min 4h overlap)
            </SelectItem>
          </SelectContent>
        </Select>
      </FormSection>

      {/* Quality Threshold */}
      <FormSection
        icon={Target}
        title="Quality Threshold"
        description="Set the minimum match score required for contributors to be included in team formation."
      >
        <RangeSlider
          label="Minimum Match Score"
          value={qualityThreshold}
          onChange={setQualityThreshold}
          min={50}
          max={100}
          suffix="%"
          color="[&::-webkit-slider-thumb]:bg-forest-500"
        />
        <div className="mt-4 flex items-center gap-3 rounded-lg p-3 border border-beige-200/50">
          <Shield className="w-5 h-5 text-forest-500 shrink-0" />
          <div>
            <p className="text-[12px] text-brown-800 font-medium">
              Current threshold:{" "}
              <span className="font-bold text-forest-600">
                {qualityThreshold}%
              </span>
            </p>
            <p className="text-[10px] text-beige-500 mt-0.5">
              {qualityThreshold >= 90
                ? "Very strict — only top-tier contributors will be matched."
                : qualityThreshold >= 80
                ? "Recommended — balances quality and availability."
                : qualityThreshold >= 70
                ? "Moderate — wider pool, some trade-off in match quality."
                : "Relaxed — largest pool, lowest quality guarantee."}
            </p>
          </div>
        </div>
      </FormSection>

      {/* Save CTA */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-end gap-3 pt-2 pb-4"
      >
        <Link href="/enterprise/team">
          <Button variant="outline" size="md">
            Cancel
          </Button>
        </Link>
        <Button variant="gradient-primary" size="md" className="px-8">
          <Save className="w-4 h-4" />
          Save Configuration
        </Button>
      </motion.div>
    </motion.div>
  );
}
