"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FolderLock,
  Download,
  CheckCircle2,
  Shield,
  Lock,
  ChevronDown,
  Mail,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Button } from "@/components/ui";
import { mockProjects, mockMilestones } from "@/mocks/data/enterprise-projects";

/* ── FSD §9.3: Pre-selected contents (read-only) ── */
const complianceContents = [
  { id: "nda", label: "NDA Confirmation", description: "Non-disclosure agreement signed by all parties" },
  { id: "dpa", label: "DPA Confirmation", description: "Data Processing Agreement signed and verified" },
  { id: "sow", label: "Approved SOW", description: "Final approved Statement of Work with all amendments" },
  { id: "evidence", label: "Evidence Packs", description: "All submitted evidence packs for selected milestones" },
  { id: "podl", label: "PoDL (Proof of Delivery Ledger)", description: "Cryptographically signed delivery records" },
  { id: "payments", label: "Payment Records", description: "Complete payment history for all milestones" },
];

export default function ComplianceDocumentsPage() {
  const [projectId, setProjectId] = React.useState("");
  const [selectedMilestones, setSelectedMilestones] = React.useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  /* Milestones for selected project — FSD: default "All Approved Milestones" */
  const projectMilestones = React.useMemo(() => {
    if (!projectId) return [];
    return mockMilestones.filter((m) => m.projectId === projectId);
  }, [projectId]);

  const selectedProject = mockProjects.find((p) => p.id === projectId);

  const toggleMilestone = (id: string) => {
    setSelectedMilestones((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllMilestones = () => {
    setSelectedMilestones(new Set(projectMilestones.map((m) => m.id)));
  };

  /* Validate — FSD: Project is required */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!projectId) errs.projectId = "Please select a project";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* Generate — FSD §9.3: password-protected PDF, password sent to billing email */
  const handleGenerate = async () => {
    if (!validate()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsGenerating(false);

    const milestoneScope = selectedMilestones.size > 0 ? `${selectedMilestones.size} milestones` : "All approved milestones";
    toast.success(
      "Compliance Pack Generated",
      `Password-protected PDF bundle ready for ${selectedProject?.title}. Scope: ${milestoneScope}. Password has been sent to the billing contact email.`
    );
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
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500 to-brown-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brown-200/40">
          <FolderLock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">Compliance Documentation Pack</h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Bundled export for audits, vendor due diligence, and regulatory inquiries.
          </p>
        </div>
      </motion.div>

      {/* Security notice — FSD §9.3 */}
      <motion.div variants={fadeUp} className="rounded-xl bg-gold-50 border border-gold-200 p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-gold-700">Password-Protected Bundle</p>
          <p className="text-[11px] text-gold-600 mt-1">
            The generated PDF bundle is password-protected. The password will be sent separately to the
            billing contact email to ensure the download cannot be intercepted and immediately opened.
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

        {/* Milestone Scope — Optional, default "All Approved" */}
        {projectId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-brown-700">
                Milestone Scope
                <span className="text-beige-400 font-normal ml-1">(default: All Approved Milestones)</span>
              </label>
              <button onClick={selectAllMilestones} className="text-[11px] text-teal-600 hover:text-teal-700 font-medium">
                Select All
              </button>
            </div>
            <div className="space-y-2">
              {projectMilestones.map((m) => (
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
                    <span className={cn(
                      "text-[11px] ml-2",
                      m.status === "completed" ? "text-forest-600" : "text-beige-400"
                    )}>
                      {m.status === "completed" ? "✓ Completed" : m.status === "in_progress" ? "In Progress" : "Upcoming"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Contents Checklist — FSD §9.3: pre-selected, read-only */}
        <div>
          <label className="text-[12px] font-semibold text-brown-700 mb-2 block">
            Contents Included
            <span className="text-beige-400 font-normal ml-1">(pre-selected, read-only)</span>
          </label>
          <div className="space-y-1.5">
            {complianceContents.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-beige-50/80 border border-beige-100/60">
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                <div>
                  <span className="text-[12px] font-medium text-brown-800">{item.label}</span>
                  <span className="text-[10px] text-beige-500 ml-2">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="pt-2">
          <Button
            onClick={handleGenerate}
            disabled={!projectId || isGenerating}
            className="w-full bg-gradient-to-r from-gold-500 to-brown-600 hover:from-gold-600 hover:to-brown-700 text-white py-3"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Compliance Pack...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Generate Compliance Pack
              </span>
            )}
          </Button>
        </div>

        {/* Password delivery note */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-beige-400 pt-1">
          <Mail className="w-3 h-3" />
          <span>Bundle password will be sent separately to the billing contact email</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
