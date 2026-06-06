"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Target,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";

/* === Next Steps === */

const nextSteps = [
  {
    icon: Target,
    gradient: "from-teal-400 to-teal-600",
    title: "AI Matching",
    description: "Scanning projects that fit your skills and preferences",
  },
  {
    icon: ShieldCheck,
    gradient: "from-forest-400 to-forest-600",
    title: "Verification",
    description: "Identity review completes within 24-48 hours",
  },
  {
    icon: Sparkles,
    gradient: "from-gold-400 to-gold-600",
    title: "First Task",
    description: "You'll be notified when a match is found",
  },
];

/* === PAGE === */

export default function OnboardingCompletePage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center min-h-[520px] py-8"
    >
      {/* -- Celebration area -- */}
      <motion.div variants={fadeUp} className="text-center mb-10">
        {/* Animated checkmark with pulse glow */}
        <motion.div variants={scaleIn} className="relative mx-auto mb-8 w-20 h-20">
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-forest-400 to-forest-600"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(77, 87, 65, 0.3)",
                "0 0 0 20px rgba(77, 87, 65, 0)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          {/* Icon circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        <h1 className="font-heading text-[32px] font-semibold tracking-tight leading-tight">
          <span className="text-gray-900">Welcome </span>
          <span className="bg-gradient-to-r from-brown-500 via-brown-400 to-brown-600 bg-clip-text text-transparent">
            aboard!
          </span>
        </h1>
        <p className="text-[14px] text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed">
          Your profile is ready. Our AI is already finding your first task match.
        </p>
      </motion.div>

      {/* -- What happens next — card -- */}
      <motion.div variants={fadeUp} className="card-parchment overflow-hidden w-full max-w-lg mb-10">
        {/* Section header */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <span className="text-[13px] font-semibold text-gray-800">What happens next</span>
        </div>

        {/* Step rows */}
        {nextSteps.map((step, idx) => {
          const StepIcon = step.icon;
          const isLast = idx === nextSteps.length - 1;
          return (
            <div
              key={step.title}
              className={`flex items-center gap-4 px-5 py-4 ${!isLast ? "border-b border-gray-100" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-sm shrink-0`}
              >
                <StepIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                  {step.title}
                </p>
                <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* -- CTA Buttons -- */}
      <motion.div variants={fadeUp} className="w-full max-w-lg space-y-3">
        <Link
          href="/contributor/dashboard"
          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold px-6 py-3.5 rounded-xl text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-md transition-all"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/contributor/profile"
          className="w-full flex items-center justify-center text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors py-2"
        >
          View Profile
        </Link>
      </motion.div>
    </motion.div>
  );
}
