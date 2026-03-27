"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, GraduationCap, HeartHandshake, ArrowRight, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";

const tracks = [
  {
    id: "general",
    label: "General Contributor",
    description: "Open to all IT professionals. Get matched with tasks based on your verified skills.",
    icon: Briefcase,
    iconBg: "bg-gradient-to-br from-teal-400 to-teal-600",
    benefits: [
      "Match with 500+ active tasks",
      "Earn delivery-validated credentials",
      "Flexible schedule, work from anywhere",
    ],
  },
  {
    id: "student",
    label: "Student Track",
    description: "For university students earning academic credits through real-world delivery.",
    icon: GraduationCap,
    iconBg: "bg-gradient-to-br from-gold-400 to-gold-600",
    benefits: [
      "Earn academic credits for real deliveries",
      "Supervised review with mentor support",
      "Build a PoDL credential portfolio",
    ],
  },
  {
    id: "women",
    label: "Women's Program",
    description: "Flexible work program designed for women in tech with mentorship support.",
    icon: HeartHandshake,
    iconBg: "bg-gradient-to-br from-brown-400 to-brown-600",
    benefits: [
      "72-hour activation with priority matching",
      "Dedicated mentor & WhatsApp support",
      "Flexible hours with accessibility options",
    ],
  },
];

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { setTrack } = useOnboardingStore();
  const [selectedTrack, setSelectedTrack] = React.useState<string>("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [showInvite, setShowInvite] = React.useState(false);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Hero heading */}
      <motion.div variants={fadeUp} className="text-center mb-10">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Get Started</p>
        <h1 className="font-heading text-[32px] font-semibold text-gray-900 tracking-tight leading-tight">
          Choose your{" "}
          <span
            className="bg-gradient-to-r from-brown-500 via-brown-400 to-brown-600 bg-clip-text text-transparent"
          >
            path
          </span>
        </h1>
        <p className="text-[14px] text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed">
          Select a contributor track to get started. You can always update this later.
        </p>
      </motion.div>

      {/* Track cards */}
      <motion.div variants={fadeUp} className="space-y-3 mb-8">
        {tracks.map((track) => {
          const TrackIcon = track.icon;
          const isSelected = selectedTrack === track.id;

          return (
            <button
              key={track.id}
              onClick={() => setSelectedTrack(track.id)}
              className="w-full text-left rounded-2xl px-5 py-4 transition-all duration-200"
              style={{
                background: isSelected ? "var(--color-brown-50)" : "#FFFFFF",
                borderRadius: 18,
                boxShadow: isSelected
                  ? "0 0 0 2px var(--color-brown-400), 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"
                  : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    track.iconBg
                  )}
                >
                  <TrackIcon className="w-5 h-5 text-white" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-gray-800 block">
                    {track.label}
                  </span>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                {/* Radio indicator */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                    isSelected
                      ? "border-brown-500 bg-brown-500"
                      : "border-gray-300"
                  )}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              {/* Benefit bullets — revealed when selected */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 ml-14 space-y-2" style={{ borderTop: "1px solid var(--color-brown-100)" }}>
                      {track.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-forest-50 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-forest-500" />
                          </div>
                          <span className="text-[12px] text-gray-600">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </motion.div>

      {/* Invite code — collapsed by default */}
      <motion.div variants={fadeUp} className="mb-8">
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-500 transition-colors mx-auto"
        >
          <span>Have an invite code?</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              showInvite && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g., GLIM-2026-ABCD"
                  className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Continue button */}
      <motion.div variants={fadeUp}>
        <button
          onClick={() => {
            if (selectedTrack) {
              setTrack(selectedTrack as "general" | "student" | "women");
              router.push("/onboarding/verify");
            }
          }}
          disabled={!selectedTrack}
          className={cn(
            "w-full flex items-center justify-center gap-2 text-[13px] font-semibold px-6 py-3.5 rounded-xl transition-all duration-200",
            selectedTrack
              ? "text-white bg-gradient-to-r from-brown-500 to-brown-600 hover:from-brown-600 hover:to-brown-700 shadow-sm hover:shadow-lg"
              : "text-gray-400 bg-gray-100 shadow-sm cursor-not-allowed"
          )}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
        <div className="mt-5 text-center">
          <span className="text-[12px] text-gray-400">Already have an account? </span>
          <Link
            href="/auth/login"
            className="text-[12px] font-medium text-brown-500 hover:text-brown-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
