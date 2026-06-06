"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake,
  ArrowRight,
  ArrowLeft,
  Shield,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";

const communicationChannels = [
  { id: "whatsapp", label: "WhatsApp", recommended: true },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "inapp", label: "In-app" },
];

const languages = [
  "English",
  "Hindi",
  "Urdu",
  "Bengali",
  "Tamil",
  "Arabic",
  "Other",
];

const mentorshipStyles = [
  "Hands-on guidance",
  "Light-touch check-ins",
  "Technical deep-dives",
];

export default function WomensProgramPage() {
  const router = useRouter();

  const [selectedChannels, setSelectedChannels] = React.useState<string[]>(["whatsapp"]);
  const [language, setLanguage] = React.useState("");
  const [wantsMentor, setWantsMentor] = React.useState(true);
  const [mentorStyle, setMentorStyle] = React.useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = React.useState("");
  const [scheduleNotes, setScheduleNotes] = React.useState("");

  function toggleChannel(id: string) {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  const isValid = selectedChannels.length > 0 && language;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Heading */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">
          Program preferences
        </h1>
        <p className="text-[13px] text-gray-400 mt-1.5">
          Customize your experience for flexible, supported delivery
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-brown-50 text-brown-700 text-[11px] font-medium px-3 py-1 rounded-full">
          <HeartHandshake className="w-3.5 h-3.5" />
          Women&apos;s Program
        </div>
      </motion.div>

      {/* Single form card */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="p-6 space-y-6">
          {/* Section 1: Communication */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-3">
              Preferred communication
            </label>
            <div className="space-y-0">
              {communicationChannels.map((channel, i) => (
                <div key={channel.id}>
                  <label
                    className="flex items-center gap-3 cursor-pointer py-2.5"
                    onClick={() => toggleChannel(channel.id)}
                  >
                    {/* Custom checkbox */}
                    <div
                      className={cn(
                        "w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        selectedChannels.includes(channel.id)
                          ? "border-brown-500 bg-brown-500"
                          : "border-gray-300"
                      )}
                    >
                      {selectedChannels.includes(channel.id) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-gray-700">{channel.label}</span>
                    {channel.recommended && selectedChannels.includes(channel.id) && (
                      <span className="text-[9px] font-semibold text-brown-700 bg-brown-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Recommended
                      </span>
                    )}
                  </label>
                  {i < communicationChannels.length - 1 && (
                    <div style={{ borderBottom: "1px solid var(--border-hair)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Language */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
              Language preference
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={cn(
                  "w-full text-[13px] bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none cursor-pointer",
                  language ? "text-gray-700" : "text-gray-400"
                )}
              >
                <option value="" disabled>
                  Select language
                </option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Section 3: Mentorship */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-3">
              Mentorship
            </label>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-700">
                Assign me a dedicated mentor
              </span>
              <button
                type="button"
                onClick={() => setWantsMentor(!wantsMentor)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
                  wantsMentor ? "bg-brown-500" : "bg-gray-300"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    wantsMentor ? "translate-x-[22px]" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            <AnimatePresence>
              {wantsMentor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3">
                    <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
                      Mentorship style
                    </label>
                    <div className="relative">
                      <select
                        value={mentorStyle}
                        onChange={(e) => setMentorStyle(e.target.value)}
                        className={cn(
                          "w-full text-[13px] bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none cursor-pointer",
                          mentorStyle ? "text-gray-700" : "text-gray-400"
                        )}
                      >
                        <option value="" disabled>
                          Select mentorship style
                        </option>
                        {mentorshipStyles.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 4: Additional notes (optional) */}
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
                Accessibility needs{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={accessibilityNeeds}
                onChange={(e) => setAccessibilityNeeds(e.target.value)}
                placeholder="e.g., need screen reader support"
                rows={2}
                className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all resize-none placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
                Schedule constraints{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                placeholder="e.g., available evenings only"
                rows={2}
                className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all resize-none placeholder:text-gray-400"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                e.g., available evenings only, need screen reader support
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Privacy notice */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl bg-brown-50 px-4 py-3 flex items-start gap-3 mb-8"
      >
        <Shield className="w-4 h-4 text-brown-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-brown-700 leading-relaxed">
          All information is kept strictly confidential
        </p>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mt-5">
        <button
          onClick={() => router.push("/onboarding/availability")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          onClick={() => isValid && router.push("/onboarding/complete")}
          disabled={!isValid}
          className={cn(
            "flex items-center gap-1.5 text-[12px] font-medium px-6 py-2.5 rounded-xl transition-all",
            isValid
              ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
              : "text-gray-400 bg-gray-100 cursor-not-allowed"
          )}
        >
          Continue <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
