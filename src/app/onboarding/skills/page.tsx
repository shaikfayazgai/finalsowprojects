"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockSkillsTaxonomy } from "@/mocks/data/contributor";

/* ═══ Types ═══ */

type Proficiency = "beginner" | "intermediate" | "advanced" | "expert";

interface SelectedSkill {
  name: string;
  proficiency: Proficiency;
}

/* ═══ Constants ═══ */

const proficiencyOptions: { value: Proficiency; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

/* ═══ PAGE ═══ */

export default function SkillsSetupPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = React.useState(
    mockSkillsTaxonomy[0]?.category ?? ""
  );
  const [selectedSkills, setSelectedSkills] = React.useState<SelectedSkill[]>([]);
  const tabsRef = React.useRef<HTMLDivElement>(null);

  const selectedNames = React.useMemo(
    () => new Set(selectedSkills.map((s) => s.name)),
    [selectedSkills]
  );

  /* ── Handlers ── */

  function toggleSkill(name: string) {
    if (selectedNames.has(name)) {
      setSelectedSkills((prev) => prev.filter((s) => s.name !== name));
    } else {
      setSelectedSkills((prev) => [
        ...prev,
        { name, proficiency: "intermediate" },
      ]);
    }
  }

  function updateProficiency(name: string, proficiency: Proficiency) {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.name === name ? { ...s, proficiency } : s))
    );
  }

  function removeSkill(name: string) {
    setSelectedSkills((prev) => prev.filter((s) => s.name !== name));
  }

  const canContinue = selectedSkills.length >= 3;
  const activeCategoryData = mockSkillsTaxonomy.find(
    (c) => c.category === activeCategory
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ── Heading ── */}
      <motion.div variants={fadeUp} className="mb-10">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">
          What are your skills?
        </h1>
        <p className="text-[13px] text-gray-400 mt-1.5 leading-relaxed">
          Select at least 3 skills and rate your proficiency
        </p>
      </motion.div>

      {/* ══════════ Category Tabs ══════════ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div
          ref={tabsRef}
          className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {mockSkillsTaxonomy.map((cat) => {
            const isActive = cat.category === activeCategory;
            const selectedCount = cat.skills.filter((s) =>
              selectedNames.has(s)
            ).length;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => setActiveCategory(cat.category)}
                className={cn(
                  "relative shrink-0 px-4 py-2 text-[12px] font-medium rounded-lg transition-all whitespace-nowrap",
                  isActive
                    ? "text-brown-600 bg-brown-50"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                {cat.category}
                {selectedCount > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold",
                      isActive
                        ? "bg-brown-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {selectedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* Active indicator line */}
        <div className="h-px bg-gray-100 -mt-px" />
      </motion.div>

      {/* ══════════ Skill Chips Grid ══════════ */}
      <motion.div variants={fadeUp} className="mb-8">
        {activeCategoryData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activeCategoryData.skills.map((skill) => {
              const isSelected = selectedNames.has(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200 text-center",
                    isSelected
                      ? "bg-gradient-to-r from-brown-400 to-brown-600 text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ══════════ Selected Skills Panel ══════════ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-semibold text-gray-600">
            Your skills ({selectedSkills.length} selected)
          </span>
          {selectedSkills.length > 0 && selectedSkills.length < 3 && (
            <span className="text-[11px] text-gold-600">
              {3 - selectedSkills.length} more needed
            </span>
          )}
          {selectedSkills.length >= 3 && (
            <span className="text-[11px] text-forest-600">
              Minimum met
            </span>
          )}
        </div>

        {selectedSkills.length === 0 ? (
          <div className="card-parchment px-5 py-8 text-center">
            <p className="text-[12px] text-gray-400">
              Select skills from the categories above
            </p>
          </div>
        ) : (
          <div className="card-parchment overflow-hidden">
            {selectedSkills.map((skill, i) => (
              <div
                key={skill.name}
                className={cn(
                  "px-4 py-3 flex items-center justify-between gap-3",
                  i < selectedSkills.length - 1 && "border-b border-gray-100"
                )}
              >
                <span className="text-[12px] font-semibold text-gray-600 min-w-0 truncate">
                  {skill.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <select
                      value={skill.proficiency}
                      onChange={(e) =>
                        updateProficiency(
                          skill.name,
                          e.target.value as Proficiency
                        )
                      }
                      className="appearance-none text-[11px] text-gray-600 bg-gray-50 rounded-lg pl-3 pr-7 py-1.5 outline-none focus:ring-2 focus:ring-brown-200/50 transition-all cursor-pointer"
                    >
                      {proficiencyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.name)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ══════════ Navigation ══════════ */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={() => router.push("/onboarding/consent")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => router.push("/onboarding/evidence")}
          className={cn(
            "flex items-center gap-1.5 text-[12px] font-medium px-6 py-2.5 rounded-xl transition-all",
            canContinue
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
