"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ExternalLink, ArrowLeft, ArrowRight, FileCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockConsentItems } from "@/mocks/data/contributor";

export default function OnboardingConsentPage() {
  const router = useRouter();
  const [accepted, setAccepted] = React.useState<Record<string, boolean>>({});

  const toggleConsent = (id: string) => {
    setAccepted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const requiredItems = mockConsentItems.filter((item) => item.required);
  const requiredAcceptedCount = requiredItems.filter((item) => accepted[item.id]).length;
  const allRequiredAccepted = requiredItems.every((item) => accepted[item.id]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ── Page Header with Icon Block ── */}
      <motion.div variants={fadeUp} className="mb-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-sm shrink-0">
          <FileCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
            Review agreements
          </h1>
          <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">
            Please review and accept the following to continue
          </p>
        </div>
      </motion.div>

      {/* ══════════ Consent Card ══════════ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8 overflow-hidden">
        {/* Section header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-semibold text-gray-800">Agreements</span>
          </div>
          <span className="text-[11px] font-semibold text-brown-600 bg-brown-50 px-2.5 py-1 rounded-full">
            {requiredAcceptedCount}/{requiredItems.length} accepted
          </span>
        </div>

        {/* Consent rows */}
        {mockConsentItems.map((item, idx) => {
          const isAccepted = !!accepted[item.id];
          const isLast = idx === mockConsentItems.length - 1;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleConsent(item.id)}
              className={cn(
                "w-full text-left px-5 py-4 flex items-start gap-4 transition-colors hover:bg-gray-50/60",
                !isLast && "border-b border-gray-100"
              )}
            >
              {/* Custom checkbox */}
              <div
                className={cn(
                  "w-[18px] h-[18px] rounded-md border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                  isAccepted
                    ? "border-brown-500 bg-brown-500"
                    : "border-gray-200 bg-white"
                )}
              >
                {isAccepted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-800">{item.title}</span>
                  {item.required && (
                    <span className="text-[10px] font-semibold text-brown-700 bg-brown-50 px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open("#", "_blank");
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 font-medium mt-2 cursor-pointer"
                >
                  Read full document <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}

        {/* Footer summary */}
        <div className="px-5 py-3 bg-gray-50/50">
          <p className="text-[12px] text-gray-400 text-center">
            {requiredAcceptedCount} of {requiredItems.length} required agreements accepted
          </p>
        </div>
      </motion.div>

      {/* ══════════ Navigation ══════════ */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mt-5">
        <Link
          href="/onboarding/verify"
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <button
          onClick={() => allRequiredAccepted && router.push("/onboarding/skills")}
          disabled={!allRequiredAccepted}
          className={cn(
            "flex items-center gap-1.5 text-[12px] font-medium px-6 py-2.5 rounded-xl transition-all",
            allRequiredAccepted
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
