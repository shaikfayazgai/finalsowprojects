"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  X, Save, Plus, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

const fieldLabel = "mb-1.5 block text-[12px] font-semibold text-gray-600";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-parchment">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════ Skills pool ══════════════════════════════════════════ */

const allSkills = [
  "React", "TypeScript", "Node.js", "Python", "PostgreSQL", "System Design",
  "Accessibility", "CSS", "Docker", "AWS", "Redis", "GraphQL",
  "Security", "Testing", "DevOps", "Mobile", "Flutter", "Go",
];

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function EditMentorProfilePage() {
  const router = useRouter();

  const [name, setName] = React.useState("Dr. Ravi Krishnan");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [expertise, setExpertise] = React.useState(["React", "TypeScript", "Node.js", "System Design", "Accessibility", "PostgreSQL"]);
  const [maxConcurrent, setMaxConcurrent] = React.useState(5);
  const [availability, setAvailability] = React.useState<Record<string, boolean>>({
    Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false,
  });
  const [saving, setSaving] = React.useState(false);

  function toggleSkill(skill: string) {
    setExpertise((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  }

  function toggleDay(day: string) {
    setAvailability((prev) => ({ ...prev, [day]: !prev[day] }));
  }

  function handleSave() {
    if (expertise.length === 0) { toast.warning("Select at least one expertise area"); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile updated");
      router.push("/mentor/profile");
    }, 800);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Edit Profile
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Update your personal info, expertise, and availability
        </p>
      </motion.div>

      <div className="space-y-5 max-w-3xl">

        {/* Personal Info */}
        <motion.div variants={fadeUp}>
          <Section title="Personal Information">
            <div className="space-y-4">
              <div>
                <label className={fieldLabel}>Display Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className={fieldLabel}>Timezone</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Expertise */}
        <motion.div variants={fadeUp}>
          <Section title="Expertise Areas">
            <div>
              <p className="text-[11px] text-gray-400 mb-3">Select the skill areas you are qualified to review. These determine which submissions are assigned to you.</p>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => {
                  const selected = expertise.includes(skill);
                  return (
                    <button key={skill} onClick={() => toggleSkill(skill)}
                      className={cn(
                        "text-[12px] font-medium px-3.5 py-2 rounded-lg transition-all",
                        selected
                          ? "text-brown-700 bg-brown-50"
                          : "text-gray-400 bg-gray-50 hover:text-gray-600 hover:bg-gray-100"
                      )}
                      style={{ border: selected ? "1px solid var(--color-brown-200)" : "1px solid var(--border-soft)" }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{expertise.length} selected</p>
            </div>
          </Section>
        </motion.div>

        {/* Capacity */}
        <motion.div variants={fadeUp}>
          <Section title="Review Capacity">
            <div>
              <label className={fieldLabel}>Maximum Concurrent Reviews</label>
              <p className="text-[11px] text-gray-400 mb-3">How many reviews can you handle at the same time?</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setMaxConcurrent((p) => Math.max(1, p - 1))} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all text-[16px] font-semibold">−</button>
                <span className="font-mono text-[18px] font-semibold text-gray-800 w-8 text-center">{maxConcurrent}</span>
                <button onClick={() => setMaxConcurrent((p) => Math.min(20, p + 1))} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all text-[16px] font-semibold">+</button>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Availability */}
        <motion.div variants={fadeUp}>
          <Section title="Weekly Availability">
            <div>
              <p className="text-[11px] text-gray-400 mb-3">Which days are you available for review work?</p>
              <div className="flex items-center gap-2">
                {Object.entries(availability).map(([day, available]) => (
                  <button key={day} onClick={() => toggleDay(day)}
                    className={cn(
                      "flex-1 text-center py-3 rounded-lg text-[12px] font-semibold transition-all",
                      available
                        ? "bg-forest-50 text-forest-700"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    )}
                    style={{ border: available ? "1px solid var(--color-forest-200)" : "1px solid var(--border-soft)" }}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{Object.values(availability).filter(Boolean).length} days active</p>
            </div>
          </Section>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeUp} className="flex items-center justify-end gap-3 pb-8">
          <button onClick={() => router.push("/mentor/profile")} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2.5 rounded-xl transition-all disabled:opacity-60">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
