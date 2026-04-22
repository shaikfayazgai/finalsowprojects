"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Leaf,
  Download,
  CheckCircle2,
  ChevronDown,
  Calendar,
  Users,
  GraduationCap,
  BarChart3,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Button } from "@/components/ui";
import { mockProjects } from "@/mocks/data/enterprise-projects";

/* ── FSD §9.4: Format options ── */
type EsgFormat = "csv" | "xlsx" | "pdf";

/* ── FSD §9.4: Pre-selected metrics (read-only) ── */
const esgMetrics = [
  { id: "women_hours", label: "Women contributor hours", description: "Total hours delivered by women workforce contributors", icon: Users },
  { id: "student_hours", label: "Student contributor hours", description: "Total hours delivered by student contributors building career credentials", icon: GraduationCap },
  { id: "underrepresented_pct", label: "% workforce from underrepresented groups", description: "Percentage of total workforce from underrepresented groups", icon: BarChart3 },
];

const mockEsgSummary = {
  womenHours: 0,
  studentHours: 0,
  underrepresentedPct: 0,
  totalProjects: mockProjects.length,
};

export default function ESGExportPage() {
  const [selectedProjects, setSelectedProjects] = React.useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [format, setFormat] = React.useState<EsgFormat>("csv");
  const [isGenerating, setIsGenerating] = React.useState(false);

  /* Toggle project selection — FSD: multi-select */
  const toggleProject = (id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllProjects = () => {
    setSelectedProjects(new Set(mockProjects.map((p) => p.id)));
  };

  const clearAllProjects = () => {
    setSelectedProjects(new Set());
  };

  const hasFilters = selectedProjects.size > 0 || dateFrom || dateTo;

  /* Generate — FSD §9.4 */
  const handleDownload = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsGenerating(false);

    const scopeLabel = selectedProjects.size > 0 ? `${selectedProjects.size} projects` : "All projects";
    toast.success("ESG Report Generated", `${format.toUpperCase()} report ready. Scope: ${scopeLabel}.`);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[800px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <motion.div variants={fadeUp}>
        <Link href="/enterprise/compliance/evidence" className="inline-flex items-center gap-1.5 text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Evidence Packs
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-forest-200/40">
          <Leaf className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">ESG Data Export</h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Environmental, Social, and Governance metrics for sustainability reporting.
          </p>
        </div>
      </motion.div>

      {/* Info notice */}
      <motion.div variants={fadeUp} className="rounded-xl bg-forest-50 border border-forest-200/60 p-4 flex items-start gap-3">
        <Leaf className="w-5 h-5 text-forest-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-forest-700">Automatically Tracked by APG</p>
          <p className="text-[11px] text-forest-600 mt-1">
            All ESG metrics are tracked automatically throughout delivery — no manual tagging or data entry required.
            Data is suitable for direct use in corporate ESG and sustainability reports.
          </p>
        </div>
      </motion.div>

      {/* ESG Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: "Women Contributor Hours", value: mockEsgSummary.womenHours.toLocaleString(), icon: Users, color: "from-pink-400 to-pink-600" },
          { label: "Student Contributor Hours", value: mockEsgSummary.studentHours.toLocaleString(), icon: GraduationCap, color: "from-teal-400 to-teal-600" },
          { label: "Underrepresented Groups", value: `${mockEsgSummary.underrepresentedPct}%`, icon: BarChart3, color: "from-forest-400 to-forest-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", s.color)}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[20px] font-bold text-brown-900 tracking-tight leading-none">{s.value}</p>
              <p className="text-[9px] text-beige-500 mt-0.5 font-medium leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Form */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 space-y-5">
        {/* Project Filter — Multi-select */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-semibold text-brown-700">
              Project Filter
              <span className="text-beige-400 font-normal ml-1">(optional — default: All)</span>
            </label>
            <div className="flex gap-2">
              <button onClick={selectAllProjects} className="text-[11px] text-teal-600 hover:text-teal-700 font-medium">Select All</button>
              {selectedProjects.size > 0 && (
                <button onClick={clearAllProjects} className="text-[11px] text-beige-500 hover:text-brown-700 font-medium">Clear</button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            {mockProjects.map((p) => (
              <label key={p.id} className={cn(
                "flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all",
                selectedProjects.has(p.id) ? "border-forest-300 bg-forest-50" : "border-beige-200/60 hover:border-beige-300"
              )}>
                <input
                  type="checkbox"
                  checked={selectedProjects.has(p.id)}
                  onChange={() => toggleProject(p.id)}
                  className="w-4 h-4 rounded border-beige-300 text-forest-600 focus:ring-forest-200"
                />
                <span className="text-[12px] font-medium text-brown-800">{p.title}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range — Optional */}
        <div>
          <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
            Date Range
            <span className="text-beige-400 font-normal ml-1">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full h-10 rounded-xl border border-beige-200/60 bg-white/60 pl-9 pr-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40" />
            </div>
            <span className="text-[12px] text-beige-400">to</span>
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full h-10 rounded-xl border border-beige-200/60 bg-white/60 pl-9 pr-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40" />
            </div>
          </div>
        </div>

        {/* Format — Required */}
        <div>
          <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
            Format <span className="text-danger">*</span>
          </label>
          <div className="flex gap-2">
            {(["csv", "xlsx", "pdf"] as EsgFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 text-[13px] font-semibold uppercase transition-all",
                  format === f ? "border-forest-400 bg-forest-50 text-forest-700" : "border-beige-200/60 text-beige-500 hover:border-beige-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Included — FSD §9.4: pre-selected, read-only */}
        <div>
          <label className="text-[12px] font-semibold text-brown-700 mb-2 block">
            Metrics Included
            <span className="text-beige-400 font-normal ml-1">(pre-selected, read-only)</span>
          </label>
          <div className="space-y-1.5">
            {esgMetrics.map((metric) => (
              <div key={metric.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-forest-50/50 border border-forest-100/60">
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                <metric.icon className="w-3.5 h-3.5 text-forest-400 shrink-0" />
                <div>
                  <span className="text-[12px] font-medium text-brown-800">{metric.label}</span>
                  <span className="text-[10px] text-beige-500 ml-2">{metric.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download button */}
        <div className="pt-2">
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-700 hover:from-forest-600 hover:to-forest-800 text-white py-3"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating ESG Report...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download ESG Report
              </span>
            )}
          </Button>
        </div>

        {/* Auto-tracking note */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-beige-400 pt-1">
          <Leaf className="w-3 h-3" />
          <span>All metrics tracked automatically by APG — no manual tagging required</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
