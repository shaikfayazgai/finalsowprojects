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
  "Business context anchoring",
  "Industry-specific templates",
  "Risk & Confidence scoring",
];

const uploadFeatures = [
  "OCR + NLP parsing",
  "Automated gap analysis",
  "Smart section detection",
  "Structured commercial details",
  "Multi-format support (PDF, DOCX)",
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
  isRecommended?: boolean;
  onNavigate: (href: string) => void;
  href: string;
  accentColor: string;
  isNavigating: boolean;
}

function SelectionCard({
  title,
  description,
  icon: Icon,
  features,
  timeEstimate,
  isRecommended,
  onNavigate,
  href,
  accentColor,
  isNavigating,
}: SelectionCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      className="relative flex flex-col rounded-3xl overflow-hidden h-full cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => !isNavigating && onNavigate(href)}
      initial={false}
      animate={{
        y: hovered ? -8 : 0,
        boxShadow: hovered
          ? `0 32px 56px -12px ${accentColor}32, 0 12px 24px -6px ${accentColor}20, 0 0 0 1.5px ${accentColor}35`
          : `0 6px 24px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)`,
      }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      style={{
        background: `linear-gradient(160deg, #FFFFFF 0%, ${accentColor}05 100%)`,
      }}
    >
      {/* Always-on subtle top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-20"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}40 25%, ${accentColor}70 50%, ${accentColor}40 75%, transparent 100%)`,
        }}
      />

      {/* Hover shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? "100%" : "-40%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{
          background: `linear-gradient(105deg, transparent 25%, ${accentColor}0C 50%, transparent 75%)`,
        }}
      />

      {/* Always-on diagonal grain/texture overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            ${accentColor} 0px,
            ${accentColor} 1px,
            transparent 1px,
            transparent 8px
          )`,
        }}
      />

      {/* Always-on corner glow (bottom-right decorative) */}
      <div
        className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none z-0 rounded-full"
        style={{
          background: `radial-gradient(circle at bottom right, ${accentColor}10 0%, transparent 70%)`,
          transform: "translate(30%, 30%)",
        }}
      />

      {/* Hover radial bloom */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        initial={false}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: `radial-gradient(ellipse at 15% 10%, ${accentColor}10 0%, transparent 55%)`,
        }}
      />

      {/* RECOMMENDED badge */}
      {isRecommended && (
        <motion.div
          className="absolute top-5 right-5 z-30"
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}12)`,
              color: accentColor,
              border: `1.5px solid ${accentColor}35`,
              boxShadow: `0 2px 10px ${accentColor}20, inset 0 1px 0 ${accentColor}15`,
            }}
          >
            <Star className="w-2.5 h-2.5 fill-current" />
            Recommended
          </span>
        </motion.div>
      )}

      {/* Card body */}
      <div className="relative flex flex-col flex-1 p-7 pb-5 z-20">

        {/* Icon box — premium at rest */}
        <motion.div
          className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-6"
          animate={{
            scale: hovered ? 1.1 : 1,
            boxShadow: hovered
              ? `0 12px 28px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.5)`
              : `0 4px 16px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.6)`,
          }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
          style={{
            background: `linear-gradient(145deg, ${accentColor}28, ${accentColor}12)`,
            border: `1.5px solid ${accentColor}28`,
          }}
        >
          <motion.div
            animate={{ rotate: hovered ? [0, -10, 10, 0] : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Icon className="w-8 h-8" style={{ color: accentColor }} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h3
          className="text-[22px] font-extrabold uppercase tracking-tight leading-tight mb-2"
          animate={{ color: hovered ? accentColor : "#1C1C1C" }}
          transition={{ duration: 0.25 }}
        >
          {title}
        </motion.h3>

        {/* Description */}
        <p className="text-[13.5px] leading-relaxed mb-6" style={{ color: "#6B7280" }}>{description}</p>

        {/* Features — single column */}
        <div className="flex flex-col gap-3 flex-1">
          {features.map((feature, i) => (
            <motion.div
              key={feature}
              className="flex items-center gap-3"
              animate={{ x: hovered ? 5 : 0 }}
              transition={{ duration: 0.22, delay: hovered ? i * 0.045 : 0, ease: "easeOut" }}
            >
              <motion.div
                className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center"
                animate={{
                  backgroundColor: hovered ? accentColor + "22" : accentColor + "12",
                  borderColor: hovered ? accentColor + "AA" : accentColor + "55",
                  boxShadow: hovered ? `0 0 0 3px ${accentColor}10` : "none",
                }}
                transition={{ duration: 0.2 }}
                style={{ border: `1.5px solid ${accentColor}55` }}
              >
                <Check className="w-2.5 h-2.5" style={{ color: accentColor }} strokeWidth={3} />
              </motion.div>
              <span className="text-[13.5px] text-gray-700 leading-snug">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.div
        className="relative flex items-center justify-between px-7 py-4 z-20"
        animate={{ backgroundColor: hovered ? `${accentColor}07` : `${accentColor}03` }}
        transition={{ duration: 0.3 }}
        style={{ borderTop: `1px solid ${accentColor}18` }}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
          <Clock className="w-3.5 h-3.5" />
          Est. Time: {timeEstimate}
        </div>

        <motion.button
          onClick={(e) => { e.stopPropagation(); onNavigate(href); }}
          disabled={isNavigating}
          className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ color: accentColor }}
        >
          {isNavigating ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing...</>
          ) : (
            <>
              Start Path
              <motion.span
                animate={{ x: hovered ? 4 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>
            </>
          )}
        </motion.button>
      </motion.div>
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
            description="Best for new engagements without an existing SOW document."
            icon={Sparkles}
            features={aiFeatures}
            timeEstimate="~55–65 min"
            isRecommended
            onNavigate={handleNavigate}
            href="/enterprise/sow/generate"
            accentColor="#2A6068"
            isNavigating={navigatingTo === "/enterprise/sow/generate"}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <SelectionCard
            title="Upload SOW Document"
            description="Best for enterprises with an existing SOW from procurement or legal."
            icon={Upload}
            features={uploadFeatures}
            timeEstimate="~40–50 min"
            onNavigate={handleNavigate}
            href="/enterprise/sow/upload"
            accentColor="#A67763"
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
