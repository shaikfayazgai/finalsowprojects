"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  Clock,
  ScanSearch,
  ListChecks,
  Fingerprint,
  ClipboardCheck,
  ScrollText,
  Sparkles,
  Check,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";

/* ══════════════════════════════════════════
   DATA
   ══════════════════════════════════════════ */

const hallucinationLayers = [
  { icon: Shield, label: "Input Validation" },
  { icon: Lock, label: "Template Locking" },
  { icon: ScrollText, label: "Clause Library" },
  { icon: ListChecks, label: "Completeness Checks" },
  { icon: Fingerprint, label: "Confidence Scoring" },
  { icon: ScanSearch, label: "Pattern Matching" },
  { icon: Eye, label: "Human Approval" },
  { icon: ClipboardCheck, label: "Audit Logging" },
];

const aiFeatures = [
  "10-step guided wizard",
  "8-layer hallucination prevention",
  "Industry-specific templates",
  "Risk & confidence scoring",
];

const uploadFeatures = [
  "OCR + NLP parsing",
  "Automated gap analysis",
  "Smart section detection",
  "PDF & DOCX support",
];

/* ══════════════════════════════════════════
   COMPONENT: Selection Card
   ══════════════════════════════════════════ */

interface SelectionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  timeEstimate: string;
  ctaLabel: string;
  isRecommended?: boolean;
  onNavigate: (href: string) => void;
  href: string;
  accentColor: string;
  accentLight: string;
  isNavigating: boolean;
}

function SelectionCard({
  title,
  description,
  icon: Icon,
  features,
  timeEstimate,
  ctaLabel,
  isRecommended,
  onNavigate,
  href,
  accentColor,
  accentLight,
  isNavigating,
}: SelectionCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      className="relative flex flex-col rounded-2xl border border-[#E5DDD4] overflow-hidden h-full"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        borderColor: hovered ? accentColor + "35" : "#E5DDD4",
        boxShadow: hovered
          ? `0 16px 36px -10px ${accentColor}18, 0 4px 12px -4px ${accentColor}10`
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
      transition={{ duration: 0.25 }}
      style={{ backgroundColor: "white" }}
    >
      {/* Subtle top accent line on hover */}
      <motion.div
        className="absolute top-0 left-6 right-6 h-0.5 rounded-b-full"
        animate={{ opacity: hovered ? 1 : 0, scaleX: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
      />

      {/* Background gradient on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        style={{ background: `radial-gradient(ellipse at top left, ${accentColor}06 0%, transparent 65%)` }}
      />

      <div className="relative flex flex-col flex-1 p-7">
        {/* Header Row */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: `linear-gradient(145deg, ${accentColor}${hovered ? "20" : "12"}, ${accentLight}${hovered ? "12" : "07"})`,
              boxShadow: hovered ? `0 6px 16px ${accentColor}18` : `0 2px 8px rgba(0,0,0,0.05)`,
              border: `1px solid ${accentColor}${hovered ? "22" : "12"}`,
            }}
          >
            <Icon className="w-6 h-6 transition-colors duration-300" style={{ color: accentColor }} />
          </div>

          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-bold text-[#3D3126] leading-tight">{title}</h3>
              {isRecommended && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}12, ${accentLight}08)`,
                    color: accentColor,
                    border: `1px solid ${accentColor}20`,
                  }}
                >
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Recommended
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[#A99B8C]">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-wide">{timeEstimate}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13.5px] text-[#8B7355] leading-relaxed mb-5">{description}</p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 mb-6">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <div
                className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: accentColor + "10",
                  border: `1px solid ${accentColor}18`,
                }}
              >
                <Check className="w-3 h-3" style={{ color: accentColor }} strokeWidth={2.5} />
              </div>
              <span className="text-[13px] text-[#6B5344] leading-snug">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* CTA Button */}
        <button
          onClick={() => onNavigate(href)}
          disabled={isNavigating}
          className="group/cta relative flex items-center justify-center gap-2.5 w-full px-6 py-3.5 rounded-xl text-white text-sm font-bold transition-all duration-300 active:scale-[0.98] overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            boxShadow: hovered ? `0 6px 20px ${accentColor}30` : `0 2px 8px ${accentColor}18`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
          {isNavigating ? (
            <><Loader2 className="relative w-4 h-4 animate-spin" /><span className="relative">Preparing...</span></>
          ) : (
            <><span className="relative">{ctaLabel}</span><ArrowRight className="relative w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════ */

export default function SOWIntakePage() {
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

  const handleNavigate = React.useCallback((href: string) => {
    setNavigatingTo(href);
    router.push(href);
  }, [router]);

  return (
    <div className="min-h-screen pb-16">
      {/* Back Link */}
      <Link
        href="/enterprise/sow"
        className="inline-flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#A67763] transition-all duration-200 mb-8 group"
      >
        <div className="w-7 h-7 rounded-lg border border-[#E5DDD4] bg-white flex items-center justify-center transition-all duration-200 group-hover:border-[#A67763]/30 group-hover:shadow-sm">
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </div>
        <span className="font-medium">Back to SOW Repository</span>
      </Link>

      {/* Header Section */}
      <motion.div
        className="mb-8"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "rounded-full transition-all duration-500",
                    step === 1
                      ? "h-2 w-10 bg-gradient-to-r from-[#A67763] to-[#C49582]"
                      : "h-2 w-3 bg-[#E5DDD4]"
                  )}
                />
              ))}
            </div>
            <div className="h-4 w-px bg-[#E5DDD4]" />
            <span className="text-[11px] font-bold text-[#A67763] uppercase tracking-widest">
              Step 1 of 3
            </span>
          </div>

          <h1 className="text-[26px] font-bold text-[#3D3126] mb-2 tracking-tight">
            Create New SOW
          </h1>
          <p className="text-[#8B7355] text-[14px] leading-relaxed max-w-xl">
            Choose how you&apos;d like to create your Statement of Work. Both paths produce a
            complete, development-ready document.
          </p>
        </motion.div>
      </motion.div>

      {/* Selection Cards */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-10"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          <SelectionCard
            title="AI-Generated SOW"
            description="Answer guided questions and let AI craft a complete SOW with built-in hallucination prevention."
            icon={Sparkles}
            features={aiFeatures}
            timeEstimate="55–65 min"
            ctaLabel="Start AI Wizard"
            isRecommended
            onNavigate={handleNavigate}
            href="/enterprise/sow/generate"
            accentColor="#2A6068"
            accentLight="#5B9BA2"
            isNavigating={navigatingTo === "/enterprise/sow/generate"}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <SelectionCard
            title="Upload SOW Document"
            description="Upload existing SOW files for AI-enhanced parsing, extraction, and gap analysis."
            icon={Upload}
            features={uploadFeatures}
            timeEstimate="40–50 min"
            ctaLabel="Upload & Analyze"
            onNavigate={handleNavigate}
            href="/enterprise/sow/upload"
            accentColor="#A67763"
            accentLight="#D4C8BC"
            isNavigating={navigatingTo === "/enterprise/sow/upload"}
          />
        </motion.div>
      </motion.div>

      {/* AI Safeguards — card grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-2xl border border-[#E5DDD4] bg-white overflow-hidden shadow-sm"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E5DDD4]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2A6068]/15 to-[#5B9BA2]/8 border border-[#2A6068]/15 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#2A6068]" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-[#3D3126]">8-Layer AI Hallucination Prevention</h2>
            <p className="text-[11px] text-[#A99B8C]">Every AI-generated SOW passes through our multi-gate safety framework</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
          {hallucinationLayers.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.04, duration: 0.3 }}
                className="group relative flex items-center gap-3 rounded-xl border border-[#E5DDD4] bg-[#FAFAF8] px-4 py-3 hover:border-[#2A6068]/25 hover:bg-white hover:shadow-md hover:shadow-[#2A6068]/5 transition-all duration-250"
              >
                <span className="absolute -top-2 -right-2 w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#2A6068] to-[#3A7A82] flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                  {idx + 1}
                </span>
                <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#2A6068]/12 to-[#5B9BA2]/6 border border-[#2A6068]/10 flex items-center justify-center group-hover:from-[#2A6068]/18 transition-all duration-250">
                  <Icon className="w-4 h-4 text-[#2A6068]" />
                </div>
                <span className="text-[12px] font-semibold text-[#3D3126] leading-tight">{layer.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
