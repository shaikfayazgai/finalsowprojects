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
  Zap,
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
  FileText,
  Info,
  Star,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";

/* ══════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════ */

type SelectionMode = "ai" | "upload" | null;

/* ══════════════════════════════════════════
   DATA
   ══════════════════════════════════════════ */

const hallucinationLayers = [
  { icon: Shield, label: "Input Validation", description: "Schema enforcement on every parameter" },
  { icon: Lock, label: "Template Locking", description: "Immutable clause structures prevent drift" },
  { icon: ScrollText, label: "Clause Library", description: "Pre-vetted legal & technical clause bank" },
  { icon: ListChecks, label: "Completeness Checks", description: "Every required section validated pre-output" },
  { icon: Fingerprint, label: "Confidence Scoring", description: "Per-section confidence with 90% min gate" },
  { icon: ScanSearch, label: "Pattern Matching", description: "Cross-reference against industry baselines" },
  { icon: Eye, label: "Human Approval", description: "Mandatory review gate before finalization" },
  { icon: ClipboardCheck, label: "Audit Logging", description: "Every AI decision logged with full trace" },
];

const comparisonRows = [
  { label: "Best For", ai: "New projects without existing SOW", manual: "Existing SOW documents needing analysis" },
  { label: "Time to Complete", ai: "~55–65 minutes", manual: "~40–50 minutes" },
  { label: "AI Involvement", ai: "Full generation with human oversight", manual: "Parsing, extraction & gap detection" },
  { label: "Hallucination Controls", ai: "8-layer framework active", manual: "Gap analysis & ambiguity flagging" },
  { label: "Output Document", ai: "Complete SOW from structured inputs", manual: "SOW assembled from uploaded document" },
];

const aiFeatures = [
  "10-step guided wizard",
  "8-layer hallucination prevention",
  "Business context anchoring",
  "Industry-specific templates",
  "Risk scoring",
  "Confidence scoring",
];

const uploadFeatures = [
  "OCR + NLP parsing",
  "Automated gap analysis",
  "Smart section detection",
  "Structured commercial & project details capture",
  "Multi-format support (PDF, DOCX)",
];

/* ══════════════════════════════════════════
   COMPONENT: Selection Card — Premium
   ══════════════════════════════════════════ */

interface SelectionCardProps {
  id: SelectionMode;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  timeEstimate: string;
  bestFor: string;
  ctaLabel: string;
  isRecommended?: boolean;
  isSelected: boolean;
  otherSelected: boolean;
  onSelect: (id: SelectionMode) => void;
  onNavigate: (href: string) => void;
  href: string;
  accentColor: string;
  accentLight: string;
  isNavigating: boolean;
}

function SelectionCard({
  id,
  title,
  description,
  icon: Icon,
  features,
  timeEstimate,
  bestFor,
  ctaLabel,
  isRecommended,
  isSelected,
  otherSelected,
  onSelect,
  onNavigate,
  href,
  accentColor,
  accentLight,
  isNavigating,
}: SelectionCardProps) {
  return (
    <motion.div
      layout="position"
      onClick={() => onSelect(id)}
      className="relative flex flex-col rounded-2xl border border-[#E5DDD4] cursor-pointer overflow-hidden h-full"
      animate={{
        opacity: otherSelected && !isSelected ? 0.8 : 1,
        boxShadow: isSelected
          ? "0 20px 40px -12px rgba(166,119,99,0.15), 0 8px 20px -8px rgba(166,119,99,0.1)"
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -4,
        boxShadow: isSelected
          ? "0 25px 50px -12px rgba(166,119,99,0.2), 0 12px 24px -8px rgba(166,119,99,0.12)"
          : "0 12px 28px -8px rgba(0,0,0,0.08), 0 4px 12px -4px rgba(0,0,0,0.04)",
        transition: { duration: 0.25, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.985, transition: { duration: 0.15 } }}
      style={{ backgroundColor: "white" }}
    >

      {/* Background glow when selected */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${accentColor}08 0%, transparent 60%)`,
        }}
        animate={{ opacity: isSelected ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />

      <div className="relative flex flex-col flex-1 p-7">
        {/* Header Row */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex items-start gap-4 flex-1">
            {/* Icon Container */}
            <motion.div
              animate={{
                scale: isSelected ? 1.08 : 1,
                boxShadow: isSelected
                  ? `0 8px 20px ${accentColor}20, 0 0 0 1px ${accentColor}30`
                  : `0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px ${accentColor}15`,
              }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
              className="relative shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${accentColor}${isSelected ? "22" : "12"}, ${accentLight}${isSelected ? "15" : "08"})`,
              }}
            >
              <motion.div
                animate={{ rotate: isSelected ? [0, -8, 8, 0] : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: isSelected ? accentColor : accentColor + "cc" }}
                />
              </motion.div>
            </motion.div>

            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-[#3D3126] leading-tight">{title}</h3>
                {isRecommended && (
                  <motion.span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}12, ${accentLight}08)`,
                      color: accentColor,
                      border: `1px solid ${accentColor}20`,
                    }}
                    animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Recommended
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[#A99B8C]">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold tracking-wide">{timeEstimate}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Description */}
        <p className="text-[13.5px] text-[#8B7355] leading-relaxed mb-6">{description}</p>

        {/* Features — Two-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 mb-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature}
              className="flex items-center gap-2.5"
              animate={{
                x: isSelected ? [0, 4, 0] : 0,
              }}
              transition={{ delay: i * 0.03, duration: 0.35, ease: "easeOut" }}
            >
              <motion.div
                className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                animate={{
                  backgroundColor: isSelected ? accentColor + "18" : accentColor + "0c",
                  scale: isSelected ? [1, 1.15, 1] : 1,
                }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                style={{
                  border: `1px solid ${isSelected ? accentColor + "25" : "transparent"}`,
                }}
              >
                <Check
                  className="w-3 h-3"
                  style={{ color: isSelected ? accentColor : accentColor + "99" }}
                  strokeWidth={2.5}
                />
              </motion.div>
              <span
                className={cn(
                  "text-[13px] leading-snug transition-colors duration-300",
                  isSelected ? "text-[#3D3126] font-medium" : "text-[#6B5344]"
                )}
              >
                {feature}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Best For — Highlight Box */}
        <motion.div
          className="rounded-xl p-4 mb-6 border"
          animate={{
            backgroundColor: isSelected ? "rgba(166,119,99,0.04)" : "#F9F7F4",
            borderColor: isSelected ? "rgba(166,119,99,0.2)" : "#E5DDD4",
            scale: isSelected ? [1, 1.01, 1] : 1,
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                isSelected ? "bg-[#A67763]/12" : "bg-[#A67763]/8"
              )}
            >
              <Target
                className="w-3.5 h-3.5 transition-colors duration-300"
                style={{ color: isSelected ? "#A67763" : "#A6776399" }}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#A67763] uppercase tracking-widest">
                Best for
              </span>
              <p className="text-[13px] text-[#5B4538] mt-0.5 leading-relaxed">{bestFor}</p>
            </div>
          </div>
        </motion.div>

        {/* Spacer to push CTA to bottom */}
        <div className="flex-1" />

        {/* CTA Button */}
        <AnimatePresence mode="wait">
          {isSelected ? (
            <motion.div
              key="selected-cta"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(href);
                }}
                disabled={isNavigating}
                className="group/cta relative flex items-center justify-center gap-2.5 w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#A67763] to-[#8F5F4D] text-white text-sm font-bold transition-all duration-300 hover:shadow-xl hover:shadow-[#A67763]/25 active:scale-[0.98] overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/cta:translate-x-[100%] transition-transform duration-700" />
                {isNavigating ? (
                  <>
                    <Loader2 className="relative w-4 h-4 animate-spin" />
                    <span className="relative">Preparing...</span>
                  </>
                ) : (
                  <>
                    <span className="relative">{ctaLabel}</span>
                    <ArrowRight className="relative w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="unselected-cta"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => onSelect(id)}
                className={cn(
                  "group/cta flex items-center justify-center gap-2.5 w-full px-6 py-3.5 rounded-xl border-2 text-sm font-bold transition-all duration-300",
                  "border-[#E5DDD4] text-[#6B5344] hover:border-[#A67763] hover:text-[#A67763] hover:bg-[#A67763]/[0.03] hover:shadow-md hover:shadow-[#A67763]/8"
                )}
              >
                {ctaLabel}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   COMPONENT: Hallucination Layer Card
   ══════════════════════════════════════════ */

function HallucinationLayerCard({
  layer,
  index,
}: {
  layer: (typeof hallucinationLayers)[0];
  index: number;
}) {
  const Icon = layer.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group relative rounded-xl border border-[#E5DDD4] bg-white p-4 transition-all duration-300 hover:border-[#2A6068]/25 hover:shadow-lg hover:shadow-[#2A6068]/6 hover:-translate-y-0.5"
    >
      {/* Layer Number Badge */}
      <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-[#2A6068] to-[#3A7A82] flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-[#2A6068]/20">
        {index + 1}
      </div>

      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#2A6068]/10 to-[#5B9BA2]/6 border border-[#2A6068]/10 flex items-center justify-center group-hover:from-[#2A6068]/18 group-hover:to-[#5B9BA2]/12 group-hover:border-[#2A6068]/20 transition-all duration-300">
          <Icon className="w-[18px] h-[18px] text-[#2A6068] transition-transform duration-300 group-hover:scale-110" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h4 className="text-[13px] font-bold text-[#3D3126] mb-0.5 leading-tight">{layer.label}</h4>
          <p className="text-[11px] text-[#8B7355] leading-relaxed">{layer.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   COMPONENT: Comparison Table
   ══════════════════════════════════════════ */

function ComparisonTable() {
  return (
    <div className="rounded-2xl border border-[#E5DDD4] bg-white overflow-hidden shadow-sm">
      <div className="px-6 py-4.5 border-b border-[#E5DDD4] bg-gradient-to-r from-[#F9F7F4] to-white">
        <h3 className="text-sm font-bold text-[#3D3126]">Quick Comparison</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5DDD4] bg-[#FAFAF8]">
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-[#8B7355] uppercase tracking-wider w-1/4">
                Criteria
              </th>
              <th className="px-6 py-3.5 text-left w-[37.5%]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2A6068]/12 to-[#5B9BA2]/8 border border-[#2A6068]/15 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#2A6068]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#2A6068] uppercase tracking-wider">
                    AI-Generated
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#2A6068]/10 text-[#2A6068] border border-[#2A6068]/15">
                    Best
                  </span>
                </div>
              </th>
              <th className="px-6 py-3.5 text-left w-[37.5%]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A67763]/12 to-[#D4C8BC]/8 border border-[#A67763]/15 flex items-center justify-center">
                    <Upload className="w-3.5 h-3.5 text-[#A67763]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#A67763] uppercase tracking-wider">
                    Manual Upload
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, idx) => (
              <tr
                key={row.label}
                className={cn(
                  "transition-colors duration-200 hover:bg-[#F9F7F4]/60",
                  idx !== comparisonRows.length - 1 && "border-b border-[#F0EAE3]"
                )}
              >
                <td className="px-6 py-4 text-[13px] font-semibold text-[#3D3126]">{row.label}</td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 w-5 h-5 rounded-md bg-[#2A6068]/8 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-[#2A6068]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] text-[#5B4538] leading-relaxed">{row.ai}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 w-5 h-5 rounded-md bg-[#A67763]/8 flex items-center justify-center mt-0.5">
                      <FileText className="w-3 h-3 text-[#A67763]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] text-[#5B4538] leading-relaxed">{row.manual}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pro Tip */}
      <div className="px-6 py-4 border-t border-[#E5DDD4] bg-gradient-to-r from-[#FFFBF0] to-[#FFF9EA]/50">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-[#D4AF37]/12 border border-[#D4AF37]/15 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#B8941F]" />
          </div>
          <p className="text-[13px] text-[#6B5344] leading-relaxed pt-0.5">
            <span className="font-bold text-[#3D3126]">Pro tip:</span> Start with AI generation
            for new engagements. Use manual upload when clients provide their own SOW documents.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════ */

export default function SOWIntakePage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = React.useState<SelectionMode>(null);
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleNavigate = React.useCallback((href: string) => {
    setIsNavigating(true);
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
        className="mb-10"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "rounded-full transition-all duration-500",
                    step === 1
                      ? "h-2 w-12 bg-gradient-to-r from-[#A67763] to-[#C49582]"
                      : "h-2 w-4 bg-[#E5DDD4]"
                  )}
                />
              ))}
            </div>
            <div className="h-4 w-px bg-[#E5DDD4]" />
            <span className="text-[11px] font-bold text-[#A67763] uppercase tracking-widest">
              Step 1 of 3
            </span>
          </div>

          <h1 className="text-[28px] font-bold text-[#3D3126] mb-2 tracking-tight">
            Create New SOW
          </h1>
          <p className="text-[#8B7355] text-[15px] leading-relaxed max-w-2xl">
            Choose how you&apos;d like to create your Statement of Work. Both paths produce a
            complete, development-ready document.
          </p>
        </motion.div>
      </motion.div>

      {/* Selection Cards */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-12"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          <SelectionCard
            id="ai"
            title="AI-Generated SOW"
            description="Answer guided questions and let AI craft a complete SOW with built-in hallucination prevention."
            icon={Sparkles}
            features={aiFeatures}
            timeEstimate="55–65 min"
            bestFor="New engagements without an existing SOW document"
            ctaLabel="Start AI Wizard"
            isRecommended
            isSelected={selectedMode === "ai"}
            otherSelected={selectedMode === "upload"}
            onSelect={setSelectedMode}
            onNavigate={handleNavigate}
            href="/enterprise/sow/generate"
            accentColor="#2A6068"
            accentLight="#5B9BA2"
            isNavigating={isNavigating}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <SelectionCard
            id="upload"
            title="Upload SOW Document"
            description="Upload existing SOW files for AI-enhanced parsing, extraction, and gap analysis."
            icon={Upload}
            features={uploadFeatures}
            timeEstimate="40–50 min"
            bestFor="Enterprises with an existing SOW from procurement or legal"
            ctaLabel="Upload & Analyze"
            isSelected={selectedMode === "upload"}
            otherSelected={selectedMode === "ai"}
            onSelect={setSelectedMode}
            onNavigate={handleNavigate}
            href="/enterprise/sow/upload"
            accentColor="#A67763"
            accentLight="#D4C8BC"
            isNavigating={isNavigating}
          />
        </motion.div>
      </motion.div>

      {/* Hallucination Prevention Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="mb-8"
      >
        <div className="rounded-2xl border border-[#E5DDD4] bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E5DDD4] bg-gradient-to-r from-[#F9F7F4] to-white">
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#2A6068]/15 to-[#5B9BA2]/8 border border-[#2A6068]/18 flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-[#2A6068]" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#3D3126] mb-0.5">
                  8-Layer Hallucination Prevention
                </h2>
                <p className="text-[13px] text-[#8B7355]">
                  Every AI-generated SOW passes through our multi-gate safety framework
                </p>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hallucinationLayers.map((layer, idx) => (
                <HallucinationLayerCard key={layer.label} layer={layer} index={idx} />
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="px-6 py-3.5 border-t border-[#E5DDD4] bg-[#FAFAF8]">
            <div className="flex items-center gap-2.5 text-[#8B7355]">
              <Info className="w-4 h-4 shrink-0" />
              <span className="text-[12px]">
                All AI-generated content is validated against enterprise-grade safety standards
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
      >
        <ComparisonTable />
      </motion.div>
    </div>
  );
}
