"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileSignature,
  Download,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Lock,
  ChevronDown,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";
import { mockProjects, mockMilestones } from "@/mocks/data/enterprise-projects";

/* ── Types ── */
type PodlScope = "full" | "specific";
type PodlFormat = "pdf" | "json" | "xml";

export default function PoDLExportPage() {
  const [projectId, setProjectId] = React.useState("");
  const [scope, setScope] = React.useState<PodlScope>("full");
  const [selectedMilestones, setSelectedMilestones] = React.useState<Set<string>>(new Set());
  const [format, setFormat] = React.useState<PodlFormat>("pdf");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  /* Milestones for selected project (only approved ones for PoDL) */
  const projectMilestones = React.useMemo(() => {
    if (!projectId) return [];
    return mockMilestones.filter((m) => m.projectId === projectId);
  }, [projectId]);

  const approvedMilestones = projectMilestones.filter((m) => m.status === "completed");
  const inProgressMilestones = projectMilestones.filter((m) => m.status !== "completed");
  const isInProgress = inProgressMilestones.length > 0 && approvedMilestones.length > 0;
  const selectedProject = mockProjects.find((p) => p.id === projectId);

  /* Toggle milestone selection */
  const toggleMilestone = (id: string) => {
    setSelectedMilestones((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* Validate */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!projectId) errs.projectId = "Please select a project";
    if (scope === "specific" && selectedMilestones.size === 0) errs.milestones = "Select at least one milestone";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* Generate PoDL */
  const handleGenerate = async () => {
    if (!validate()) return;
    setIsGenerating(true);
    // Simulate generation
    await new Promise((r) => setTimeout(r, 2000));
    setIsGenerating(false);

    const scopeLabel = scope === "full" ? "Full Project" : `${selectedMilestones.size} milestones`;
    toast.success("PoDL Generated", `${format.toUpperCase()} document ready for ${selectedProject?.title}. Scope: ${scopeLabel}.`);
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
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brown-500 to-brown-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brown-200/40">
          <FileSignature className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">PoDL Export</h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Proof of Delivery Ledger — immutable, cryptographically signed record of completed work.
          </p>
        </div>
      </motion.div>

      {/* Immutability notice — FSD §9.2 */}
      <motion.div variants={fadeUp} className="rounded-xl bg-brown-50 border border-brown-200/60 p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-brown-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-brown-700">Cryptographically Signed & Immutable</p>
          <p className="text-[11px] text-brown-500 mt-1">
            PoDL documents are signed with the platform private key and contain a tamper-evident hash.
            Once generated for a completed milestone, they cannot be altered and serve as legal proof of delivery.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 space-y-5">
        {/* Project — Required */}
        <div>
          <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
            Project <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setSelectedMilestones(new Set()); setErrors({}); }}
              className={cn(
                "w-full h-10 rounded-xl border bg-white/60 px-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40 appearance-none pr-8",
                errors.projectId ? "border-danger" : "border-beige-200/60"
              )}
            >
              <option value="">Select a project...</option>
              {mockProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
          </div>
          {errors.projectId && <p className="text-[11px] text-danger mt-1">{errors.projectId}</p>}
        </div>

        {/* In-progress warning — FSD §9.2.2 */}
        {projectId && isInProgress && (
          <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gold-700">
              This PoDL covers only completed milestones ({approvedMilestones.length} of {projectMilestones.length}).
              Final PoDL will be available at project closure.
            </p>
          </div>
        )}

        {/* Scope — Required radio */}
        <div>
          <label className="text-[12px] font-semibold text-brown-700 mb-2 block">
            Scope <span className="text-danger">*</span>
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => { setScope("full"); setSelectedMilestones(new Set()); }}
              className={cn(
                "w-full text-left p-3 rounded-xl border-2 transition-all",
                scope === "full" ? "border-brown-400 bg-brown-50 text-brown-800" : "border-beige-200/60 bg-white/40 text-brown-700 hover:border-beige-300"
              )}
            >
              <span className="text-[13px] font-semibold">Full Project</span>
              <span className="text-[11px] ml-2 opacity-70">Generate PoDL for all completed milestones</span>
            </button>
            <button
              type="button"
              onClick={() => setScope("specific")}
              className={cn(
                "w-full text-left p-3 rounded-xl border-2 transition-all",
                scope === "specific" ? "border-brown-400 bg-brown-50 text-brown-800" : "border-beige-200/60 bg-white/40 text-brown-700 hover:border-beige-300"
              )}
            >
              <span className="text-[13px] font-semibold">Specific Milestones</span>
              <span className="text-[11px] ml-2 opacity-70">Select individual milestones to include</span>
            </button>
          </div>
        </div>

        {/* Milestone checklist — shown when scope is "specific" */}
        {scope === "specific" && projectId && (
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-2 block">
              Select Milestones <span className="text-danger">*</span>
            </label>
            {approvedMilestones.length === 0 ? (
              <p className="text-[12px] text-beige-500 italic">No completed milestones available for this project.</p>
            ) : (
              <div className="space-y-2">
                {approvedMilestones.map((m) => (
                  <label key={m.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    selectedMilestones.has(m.id) ? "border-brown-300 bg-brown-50" : "border-beige-200/60 hover:border-beige-300"
                  )}>
                    <input
                      type="checkbox"
                      checked={selectedMilestones.has(m.id)}
                      onChange={() => toggleMilestone(m.id)}
                      className="w-4 h-4 rounded border-beige-300 text-brown-600 focus:ring-brown-200"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-brown-800">{m.title}</span>
                      <span className="text-[11px] text-forest-600 ml-2">✓ Completed</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {errors.milestones && <p className="text-[11px] text-danger mt-1">{errors.milestones}</p>}
          </div>
        )}

        {/* Format — Required */}
        <div>
          <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
            Format <span className="text-danger">*</span>
          </label>
          <div className="flex gap-2">
            {(["pdf", "json", "xml"] as PodlFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 text-[13px] font-semibold uppercase transition-all",
                  format === f ? "border-brown-400 bg-brown-50 text-brown-800" : "border-beige-200/60 text-beige-500 hover:border-beige-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="pt-2">
          <Button
            onClick={handleGenerate}
            disabled={!projectId || isGenerating}
            className="w-full bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800 text-white py-3"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating PoDL...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Generate PoDL Export
              </span>
            )}
          </Button>
        </div>

        {/* Security footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-beige-400 pt-1">
          <Lock className="w-3 h-3" />
          <span>Document will be cryptographically signed with platform private key</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
