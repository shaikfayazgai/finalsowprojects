"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileUp, CheckCircle2, File, FileType, Loader2, ArrowRight,
  Search, Brain, LayoutList, AlertTriangle, ShieldCheck, Sparkles, RotateCcw, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { KpiRow } from "@/components/enterprise/sow/KpiRow";
import { WhatHappensNext } from "./components/WhatHappensNext";
import { RecentUploads } from "./components/RecentUploads";
import { aiPoweredFeatures } from "@/mocks/data/sow-upload-flow";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import { useSOWUploadStore, setFileObjectUrl } from "@/lib/stores/sow-upload-store";

/* ═══ Parsing stages ═══ */

type ParsingStage = null | "uploading" | "extracting" | "analyzing" | "detecting" | "scoring" | "complete";

const PARSING_STAGES: { key: ParsingStage; label: string; icon: React.ElementType; description: string }[] = [
  { key: "uploading", label: "Uploading", icon: Upload, description: "Transferring to secure storage" },
  { key: "extracting", label: "Text Extraction", icon: Search, description: "OCR & content extraction" },
  { key: "analyzing", label: "NLP Analysis", icon: Brain, description: "Language processing pipeline" },
  { key: "detecting", label: "Section Detection", icon: LayoutList, description: "Scope, budget, timeline, risks" },
  { key: "scoring", label: "Gap & Risk Scoring", icon: ShieldCheck, description: "Completeness & ambiguity check" },
];

function getStageIndex(stage: ParsingStage): number {
  if (!stage) return -1;
  if (stage === "complete") return PARSING_STAGES.length;
  return PARSING_STAGES.findIndex((s) => s.key === stage);
}

function getProgressPercent(stage: ParsingStage): number {
  if (!stage) return 0;
  if (stage === "complete") return 100;
  const idx = getStageIndex(stage);
  return Math.round(((idx + 0.5) / PARSING_STAGES.length) * 100);
}

/* ═══ File helpers ═══ */

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.doc";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function getFileTypeLabel(file: File): string {
  if (file.name.endsWith(".pdf")) return "PDF";
  if (file.name.endsWith(".docx")) return "DOCX";
  if (file.name.endsWith(".doc")) return "DOC";
  return "Document";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const ext = file.name.toLowerCase();
  if (!ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".doc")) {
    errors.push("Unsupported file format. Please upload a PDF, DOCX, or DOC file.");
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.push("File size exceeds 50MB. Please compress the document.");
  }
  return { passed: errors.length === 0, errors };
}

/* ═══ Mock results (NO budget/duration per EIR-001/EIR-002) ═══ */

const MOCK_RESULTS = {
  sectionsDetected: 14, aiConfidence: 87, gapScore: 72, ambiguities: 5,
};

/* ═══ PAGE ═══ */

export default function SOWUploadPage() {
  const router = useRouter();
  const store = useSOWUploadStore();

  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsingStage, setParsingStage] = React.useState<ParsingStage>(null);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [projectTitle, setProjectTitle] = React.useState(store.projectTitle);
  const [clientOrg, setClientOrg] = React.useState(store.clientOrganisation);
  const [linkedSowId, setLinkedSowId] = React.useState(store.linkedSowId || "none");
  const [fieldErrors, setFieldErrors] = React.useState<{ projectTitle?: string; clientOrg?: string }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isParsing = parsingStage !== null && parsingStage !== "complete";
  const isComplete = parsingStage === "complete";

  React.useEffect(() => {
    if (isComplete) {
      store.setFlowStep(2);
      router.push("/enterprise/sow/upload/report");
    }
  }, [isComplete]);

  const existingSows = mockSOWs.filter((s) => s.status === "draft" || s.status === "review");

  const handleFileSelect = (file: File) => {
    const result = validateFile(file);
    if (!result.passed) {
      setValidationErrors(result.errors);
      return;
    }
    setValidationErrors([]);
    setSelectedFile(file);
    setParsingStage(null);
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 1) {
      setValidationErrors(["Only one document per SOW upload. Please upload files one at a time."]);
      return;
    }
    const file = files[0];
    if (file) handleFileSelect(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsingStage(null);
    setValidationErrors([]);
  };

  const startParsing = () => {
    if (!selectedFile || isParsing) return;
    /* Validate required fields */
    const errors: { projectTitle?: string; clientOrg?: string } = {};
    if (!projectTitle.trim()) errors.projectTitle = "Project title is required";
    if (!clientOrg.trim()) errors.clientOrg = "Client / Organisation is required";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    /* Save to store */
    store.setProjectTitle(projectTitle);
    store.setClientOrganisation(clientOrg);
    store.setLinkedSowId(linkedSowId === "none" ? null : linkedSowId);
    store.setFile({ name: selectedFile.name, size: selectedFile.size, type: selectedFile.type, uploadedAt: new Date().toISOString() });
    setFileObjectUrl(URL.createObjectURL(selectedFile));
    store.setFlowStep(1);

    const stages: ParsingStage[] = ["uploading", "extracting", "analyzing", "detecting", "scoring", "complete"];
    stages.forEach((stage, i) => { setTimeout(() => setParsingStage(stage), i * 600); });
  };

  const handleViewReport = () => {
    store.setFlowStep(2);
    router.push("/enterprise/sow/upload/report");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleInputChange} className="hidden" aria-hidden="true" />

      {/* Flow step progress */}
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={1} />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Upload Statement of Work</h1>
        <p className="mt-1.5 text-[13px] text-gray-500">Upload your SOW document and our AI will parse, extract, and structure key sections automatically.</p>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ═══ LEFT COLUMN — Main content ═══ */}
        <div>
          {/* Optional fields */}
          {!isParsing && !isComplete && (
            <motion.div variants={fadeUp} className="mb-4">
              <div className="card-parchment px-5 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                      Project Title <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={projectTitle}
                      onChange={(e) => { setProjectTitle(e.target.value); if (fieldErrors.projectTitle) setFieldErrors((p) => ({ ...p, projectTitle: undefined })); }}
                      placeholder="e.g. HealthTech Patient Portal"
                      className={cn("w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border bg-white outline-none focus:border-brown-300 transition-colors",
                        fieldErrors.projectTitle ? "border-red-300 bg-red-50/30" : "border-gray-200")} />
                    {fieldErrors.projectTitle && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.projectTitle}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                      Client / Organisation <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={clientOrg}
                      onChange={(e) => { setClientOrg(e.target.value); if (fieldErrors.clientOrg) setFieldErrors((p) => ({ ...p, clientOrg: undefined })); }}
                      placeholder="e.g. MedCare Solutions Pvt. Ltd."
                      className={cn("w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border bg-white outline-none focus:border-brown-300 transition-colors",
                        fieldErrors.clientOrg ? "border-red-300 bg-red-50/30" : "border-gray-200")} />
                    {fieldErrors.clientOrg && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.clientOrg}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                      Link to existing SOW? <span className="text-red-400">*</span>
                    </label>
                    <select value={linkedSowId} onChange={(e) => setLinkedSowId(e.target.value)}
                      className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors">
                      <option value="none">No — create a new SOW</option>
                      {existingSows.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.status})</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Validation errors */}
          <AnimatePresence>
            {validationErrors.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 mb-4">
                {validationErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-[12px] text-red-700">{err}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* STATE 1: Drop zone */}
          {!selectedFile && !isParsing && !isComplete && (
            <motion.div variants={fadeUp}>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className={cn(
                  "rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center py-16 px-10",
                  isDragging
                    ? "border-brown-400 bg-brown-50/60"
                    : "border-gray-300 bg-white hover:border-brown-300"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors",
                  isDragging ? "bg-brown-100" : "bg-gray-100"
                )}>
                  <FileUp className={cn("w-8 h-8 transition-colors", isDragging ? "text-brown-500" : "text-gray-400")} />
                </div>

                {/* Title */}
                <h3 className="text-[18px] font-bold text-gray-800 tracking-wide uppercase mb-2">
                  {isDragging ? "Release to Upload" : "Drag & Drop Your SOW Document"}
                </h3>

                {/* Subtitle */}
                <p className="text-[13px] text-gray-400 mb-6">
                  {isDragging ? "Drop the file anywhere in this area" : "or click to browse your files"}
                </p>

                {/* Format info */}
                <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase mb-8">
                  PDF &nbsp;•&nbsp; DOCX &nbsp;•&nbsp; DOC &nbsp;•&nbsp; Max 50MB
                </p>

                {/* CTA button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}
                  className="w-64 flex items-center justify-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800 py-3 rounded-xl shadow-sm transition-all uppercase tracking-wide"
                >
                  <Upload className="w-4 h-4" /> Upload & Parse
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 2: File selected */}
          {selectedFile && !isParsing && !isComplete && (
            <motion.div variants={fadeUp}>
              <div className="card-parchment px-6 py-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    selectedFile.name.endsWith(".pdf") ? "bg-gradient-to-br from-brown-400 to-brown-600" : "bg-gradient-to-br from-teal-400 to-teal-600"
                  )}>
                    {selectedFile.name.endsWith(".pdf") ? <File className="w-5 h-5 text-white" /> : <FileType className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{getFileTypeLabel(selectedFile)}</span>
                      <span className="text-[11px] text-gray-400">{formatFileSize(selectedFile.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleReset} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                      <RotateCcw className="w-3 h-3" /> Change
                    </button>
                    <button onClick={startParsing} className="flex items-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all">
                      <Upload className="w-3.5 h-3.5" /> Upload & Parse
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 3: Parsing progress */}
          <AnimatePresence>
            {isParsing && selectedFile && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div className="card-parchment px-6 py-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900">Parsing {selectedFile.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{getFileTypeLabel(selectedFile)} · {formatFileSize(selectedFile.size)}</p>
                    </div>
                    <span className="num-display text-[24px] text-gray-900">{getProgressPercent(parsingStage)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-6">
                    <div className="h-full rounded-full bg-gradient-to-r from-brown-400 to-brown-500 transition-all duration-500" style={{ width: `${getProgressPercent(parsingStage)}%` }} />
                  </div>
                  <div className="space-y-1">
                    {PARSING_STAGES.map((stage) => {
                      const currentIdx = getStageIndex(parsingStage);
                      const stageIdx = PARSING_STAGES.indexOf(stage);
                      const isActive = stage.key === parsingStage;
                      const isDone = currentIdx > stageIdx;
                      const StageIcon = stage.icon;
                      return (
                        <div key={stage.key} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                          isActive && "bg-brown-50", !isActive && !isDone && "opacity-40"
                        )}>
                          {isDone ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" /> :
                           isActive ? <Loader2 className="w-4 h-4 text-brown-500 animate-spin shrink-0" /> :
                           <StageIcon className="w-4 h-4 text-gray-400 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <span className={cn("text-[12px] font-medium",
                              isDone ? "text-forest-700" : isActive ? "text-brown-700" : "text-gray-400"
                            )}>{stage.label}</span>
                            <span className="text-[11px] text-gray-400 ml-2">{stage.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STATE 4: Complete — Results (NO budget/duration per EIR-001/002) */}
          <AnimatePresence>
            {isComplete && selectedFile && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="card-parchment overflow-hidden">

                {/* Success header */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-gray-900">Parsing Complete</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{selectedFile.name} · {getFileTypeLabel(selectedFile)} · {formatFileSize(selectedFile.size)}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full shrink-0">PARSING COMPLETE</span>
                </div>

                {/* KPI cards — NO budget or duration */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <KpiRow items={[
                    { label: "Sections Detected", value: MOCK_RESULTS.sectionsDetected, icon: LayoutList, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
                    { label: "AI Confidence", value: `${MOCK_RESULTS.aiConfidence}%`, icon: Sparkles, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
                    { label: "Completeness", value: `${MOCK_RESULTS.gapScore}%`, icon: ShieldCheck, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
                    { label: "Ambiguities", value: MOCK_RESULTS.ambiguities, icon: AlertTriangle, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
                  ]} />
                </div>

                {/* Ambiguities warning */}
                {MOCK_RESULTS.ambiguities > 0 && (
                  <div className="px-6 py-4 border-b border-gray-100 bg-gold-50/60">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-gold-600" />
                      <span className="text-[12px] font-semibold text-gold-700">{MOCK_RESULTS.ambiguities} ambiguities flagged</span>
                    </div>
                    <p className="text-[11px] text-gold-600 leading-relaxed">Review these in the Extraction Intelligence Report before proceeding.</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50/40">
                  <button onClick={handleReset}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white hover:border-gray-300 transition-all uppercase">
                    <RotateCcw className="w-3 h-3" /> Upload Another
                  </button>
                  <button onClick={handleViewReport}
                    className="flex items-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all uppercase">
                    View Extraction Report <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ RIGHT COLUMN — Sidebar ═══ */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <WhatHappensNext activeStep={isComplete ? 2 : 1} />

          {/* AI-Powered Features */}
          <div className="card-parchment px-5 py-5">
            <h3 className="text-[13px] font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brown-400" /> AI-Powered Features
            </h3>
            <ul className="space-y-2">
              {aiPoweredFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-forest-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-gray-600">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <RecentUploads />
        </div>
      </div>
    </motion.div>
  );
}
