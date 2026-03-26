"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Info,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockUniversities } from "@/mocks/data/contributor";

const academicPrograms = [
  "Computer Science",
  "Information Technology",
  "Data Science",
  "Software Engineering",
  "Electrical Engineering",
  "Other",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 8 }, (_, i) => (currentYear + i).toString());

export default function StudentTrackPage() {
  const router = useRouter();

  const [university, setUniversity] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [program, setProgram] = React.useState("");
  const [gradMonth, setGradMonth] = React.useState("");
  const [gradYear, setGradYear] = React.useState("");
  const [advisorEmail, setAdvisorEmail] = React.useState("");

  const isValid = university && studentId.trim() && program && gradMonth && gradYear;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Heading */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">
          Student details
        </h1>
        <p className="text-[13px] text-gray-400 mt-1.5">
          Connect your academic program for credit eligibility
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-gold-50 text-gold-700 text-[11px] font-medium px-3 py-1 rounded-full">
          <GraduationCap className="w-3.5 h-3.5" />
          Student Track
        </div>
      </motion.div>

      {/* Single form card */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="p-6 space-y-5">
          {/* Row 1: University */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
              University
            </label>
            <div className="relative">
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className={cn(
                  "w-full text-[13px] bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none cursor-pointer",
                  university ? "text-gray-700" : "text-gray-400"
                )}
              >
                <option value="" disabled>
                  Select university
                </option>
                {mockUniversities.map((uni) => (
                  <option key={uni.id} value={uni.name}>
                    {uni.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: Student ID */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., STU-2026-0451"
              className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Row 3: Program + Graduation (2-col) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
                Academic Program
              </label>
              <div className="relative">
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className={cn(
                    "w-full text-[13px] bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none cursor-pointer",
                    program ? "text-gray-700" : "text-gray-400"
                  )}
                >
                  <option value="" disabled>
                    Select program
                  </option>
                  {academicPrograms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
                Expected Graduation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={gradMonth}
                    onChange={(e) => setGradMonth(e.target.value)}
                    className={cn(
                      "w-full text-[13px] bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none cursor-pointer",
                      gradMonth ? "text-gray-700" : "text-gray-400"
                    )}
                  >
                    <option value="" disabled>
                      Month
                    </option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className={cn(
                      "w-full text-[13px] bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none cursor-pointer",
                      gradYear ? "text-gray-700" : "text-gray-400"
                    )}
                  >
                    <option value="" disabled>
                      Year
                    </option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Advisor Email (optional) */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
              Academic Advisor Email{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              value={advisorEmail}
              onChange={(e) => setAdvisorEmail(e.target.value)}
              placeholder="e.g., professor@iitb.ac.in"
              className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              For credit verification with your institution
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info notice */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl bg-teal-50 px-4 py-3 flex items-start gap-3 mb-8"
      >
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-teal-700 leading-relaxed">
          Your academic institution will be contacted to verify enrollment and arrange
          credit mapping for completed tasks.
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
