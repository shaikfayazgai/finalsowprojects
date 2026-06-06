"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";

/* ═══ Constants ═══ */

const TIMEZONES = [
  { value: "Pacific/Honolulu", label: "Hawaii (UTC-10)" },
  { value: "America/Anchorage", label: "Alaska (UTC-9)" },
  { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
  { value: "America/Denver", label: "Mountain Time (UTC-7)" },
  { value: "America/Chicago", label: "Central Time (UTC-6)" },
  { value: "America/New_York", label: "Eastern Time (UTC-5)" },
  { value: "America/Sao_Paulo", label: "Brasilia (UTC-3)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Paris", label: "Central Europe (UTC+1)" },
  { value: "Europe/Istanbul", label: "Istanbul (UTC+3)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "Asia/Karachi", label: "Pakistan (UTC+5)" },
  { value: "Asia/Kolkata", label: "India (UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Bangladesh (UTC+6)" },
  { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Tokyo", label: "Japan (UTC+9)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+11)" },
  { value: "Pacific/Auckland", label: "New Zealand (UTC+12)" },
];

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const TIME_SLOTS = [
  { key: "morning", label: "AM" },
  { key: "afternoon", label: "PM" },
  { key: "evening", label: "Eve" },
];

type ScheduleMap = Record<string, Set<string>>;

/* ═══ PAGE ═══ */

export default function AvailabilityPage() {
  const router = useRouter();
  const { track } = useOnboardingStore();

  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [weeklyHours, setWeeklyHours] = React.useState(20);
  const [schedule, setSchedule] = React.useState<ScheduleMap>(() => {
    const init: ScheduleMap = {};
    DAYS.forEach((d) => {
      init[d.key] = new Set<string>();
    });
    return init;
  });

  /* ── Handlers ── */

  function toggleSlot(day: string, slot: string) {
    setSchedule((prev) => {
      const next = { ...prev };
      const daySlots = new Set(prev[day]);
      if (daySlots.has(slot)) daySlots.delete(slot);
      else daySlots.add(slot);
      next[day] = daySlots;
      return next;
    });
  }

  function adjustHours(delta: number) {
    setWeeklyHours((prev) => Math.min(40, Math.max(5, prev + delta)));
  }

  function handleContinue() {
    if (track === "student") router.push("/onboarding/student");
    else if (track === "women") router.push("/onboarding/women");
    else router.push("/onboarding/complete");
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">
          Set your schedule
        </h1>
        <p className="text-[13px] text-gray-400 mt-1.5 leading-relaxed">
          Help us match you with tasks that fit your availability
        </p>
      </motion.div>

      {/* Single card with 3 sections */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        {/* ── Section 1: Timezone ── */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-hair)" }}
        >
          <label className="text-[12px] font-semibold text-gray-600 block mb-2">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none cursor-pointer"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Section 2: Weekly Hours ── */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-hair)" }}
        >
          <label className="text-[12px] font-semibold text-gray-600 block mb-3">
            Hours per week
          </label>

          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={() => adjustHours(-5)}
              disabled={weeklyHours <= 5}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                weeklyHours <= 5
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95"
              )}
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center min-w-[72px]">
              <span className="font-heading text-[28px] font-bold text-gray-900 leading-none tabular-nums">
                {weeklyHours}
              </span>
              <p className="text-[11px] text-gray-400 mt-0.5">hrs / week</p>
            </div>

            <button
              type="button"
              onClick={() => adjustHours(5)}
              disabled={weeklyHours >= 40}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                weeklyHours >= 40
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-4">
            Most contributors work 15-25 hours per week
          </p>
        </div>

        {/* ── Section 3: Preferred Schedule ── */}
        <div className="px-6 py-5">
          <label className="text-[12px] font-semibold text-gray-600 block mb-3">
            Preferred times
          </label>

          <div className="space-y-2.5">
            {DAYS.map((day) => (
              <div key={day.key} className="flex items-center gap-3">
                <span className="text-[12px] font-medium text-gray-600 w-9 shrink-0">
                  {day.label}
                </span>
                <div className="flex gap-1.5 flex-1">
                  {TIME_SLOTS.map((slot) => {
                    const isActive = schedule[day.key]?.has(slot.key);
                    return (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => toggleSlot(day.key, slot.key)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-150",
                          isActive
                            ? "bg-brown-100 text-brown-700"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                        )}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={() => router.push("/onboarding/evidence")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all"
        >
          Continue <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
