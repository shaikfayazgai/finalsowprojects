"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileUp, CheckCircle2, File, FileType, Loader2,
  Search, Brain, LayoutList, AlertTriangle, ShieldCheck, Sparkles, RotateCcw, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { WhatHappensNext } from "./components/WhatHappensNext";
import { RecentUploads } from "./components/RecentUploads";
import { aiPoweredFeatures } from "@/mocks/data/sow-upload-flow";
import { useSOWUploadStore, setFileObjectUrl } from "@/lib/stores/sow-upload-store";
import { SOWUploadGuard } from "@/components/enterprise/sow/SOWUploadGuard";
import { useManualSOWList } from "@/lib/hooks/use-manual-sow";
import { validateSOWUploadFields, validateSOWField, type SOWUploadFieldErrors } from "@/lib/validations/sow-upload";
import { sowApi } from "@/lib/api/sow";

/* ═══ Parsing stages ═══ */

type ParsingStage = null | "uploading" | "extracting" | "analyzing" | "detecting" | "scoring" | "complete";

const PARSING_STAGES: { key: ParsingStage; label: string; icon: React.ElementType; description: string }[] = [
  { key: "uploading",  label: "Detecting Document Type",       icon: Upload,      description: "Identifying format and structure" },
  { key: "extracting", label: "Running OCR",                   icon: Search,      description: "OCR & content extraction" },
  { key: "analyzing",  label: "Reading Document Structure",    icon: Brain,       description: "Layout & hierarchy parsing" },
  { key: "detecting",  label: "Extracting Clauses & Sections", icon: LayoutList,  description: "Scope, budget, timeline, risks" },
  { key: "scoring",    label: "Tagging Clause Types",          icon: ShieldCheck, description: "Legal & commercial classification" },
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

/* ═══ Status → parsing stage mapping ═══ */

const STATUS_TO_PARSING_STAGE: Record<string, ParsingStage> = {
  uploading:  "uploading",
  extracting: "extracting",
  extraction: "extracting",
  analyzing:  "analyzing",
  detecting:  "detecting",
  scoring:    "scoring",
};

const PARSING_TERMINAL_STATUSES = new Set([
  "review", "uploaded", "created", "complete",
  "approval", "approved", "rejected", "changes_requested",
]);

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
  // Commercial details entered manually at upload → flow to the SOW + Super Admin.
  const [budgetAmount, setBudgetAmount] = React.useState("");
  const [budgetCurrency, setBudgetCurrency] = React.useState("USD");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<SOWUploadFieldErrors>({});
  const [touched, setTouched] = React.useState<{ projectTitle?: boolean; clientOrg?: boolean }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isParsing = parsingStage !== null && parsingStage !== "complete";
  const isComplete = parsingStage === "complete";

  /* The multi-step wizard was removed — upload now lands straight on the SOW
     detail. Clear any stale wizard state on mount so the entry page is always
     clean (no auto-redirect to dead step URLs, no stale "Resume" prompt). */
  React.useEffect(() => {
    useSOWUploadStore.getState().reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: sowListRes } = useManualSOWList();
  const existingSows = React.useMemo(() => {
    const res = sowListRes as unknown as { data?: unknown } | null;
    const payload = res?.data as { items?: unknown[] } | unknown[] | null;
    const items = Array.isArray(payload) ? payload : (payload as { items?: unknown[] } | null)?.items ?? [];
    return (items as Array<{ id: string; title: string; status: string }>)
      .filter((s) => s.status === "draft" || s.status === "review");
  }, [sowListRes]);

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

  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const startParsing = async () => {
    if (!selectedFile || isParsing) return;
    /* Validate required fields with Zod */
    const errors = validateSOWUploadFields({ projectTitle, clientOrg, linkedSowId });
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setUploadError(null);
    /* Save to store — clear any stale SOW ID from a previous session */
    store.setUploadedSowId(null);
    store.setProjectTitle(projectTitle);
    store.setClientOrganisation(clientOrg);
    store.setLinkedSowId(linkedSowId === "none" ? null : linkedSowId);
    store.setFile({ name: selectedFile.name, size: selectedFile.size, type: selectedFile.type, uploadedAt: new Date().toISOString() });
    setFileObjectUrl(URL.createObjectURL(selectedFile));
    store.setFlowStep(1);

    // No real AI extraction yet → upload and mark the SOW AI-approved straight
    // away. Show a brief uploading state, then land on the approved-SOW detail.
    setParsingStage("uploading");
    try {
      const res = await sowApi.uploadSOWApproved(selectedFile, {
        projectTitle,
        clientOrganisation: clientOrg,
        linkedSowId: linkedSowId !== "none" ? linkedSowId : null,
        budgetAmount: budgetAmount || undefined,
        budgetCurrency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const raw = res as unknown as Record<string, unknown>;
      const sowId =
        (raw.sow_id as string | undefined)
        ?? (raw.id as string | undefined)
        ?? ((raw.data as Record<string, unknown> | null)?.sow_id as string | undefined)
        ?? ((raw.data as Record<string, unknown> | null)?.id as string | undefined)
        ?? null;
      if (sowId) {
        // Reset the wizard store so the "you have in-progress work" navigation
        // guard does NOT fire (it triggers when uploadedFile/flowStep are set),
        // then hard-navigate to the new SOW (guaranteed to leave the page).
        store.reset();
        window.location.href = `/enterprise/sow/${sowId}`;
      } else {
        setParsingStage(null);
        setUploadError("Upload succeeded but no SOW id was returned. Check the SOW list.");
      }
    } catch (err) {
      setParsingStage(null);
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  };

  return (
    <>
    <motion.div variants={stagger} initial="hidden" animate="show">
      <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleInputChange} className="hidden" aria-hidden="true" />

      {/* Flow step progress */}
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={1} />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Upload Statement of Work</h1>
        <p className="mt-1.5 text-[13px] text-gray-500">Upload your SOW document — it enters the 5-stage approval pipeline (Business → Commercial → Legal → Security → Final).</p>
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjectTitle(val);
                        if (touched.projectTitle) {
                          setFieldErrors((p) => ({ ...p, projectTitle: validateSOWField("projectTitle", val) }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, projectTitle: true }));
                        setFieldErrors((p) => ({ ...p, projectTitle: validateSOWField("projectTitle", projectTitle) }));
                      }}
                      placeholder="e.g. HealthTech Patient Portal"
                      className={cn("w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border bg-white outline-none focus:border-brown-300 transition-colors",
                        fieldErrors.projectTitle ? "border-red-300 bg-red-50/30" : "border-gray-200")} />
                    <AnimatePresence>
                      {fieldErrors.projectTitle && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                          className="text-[11px] text-red-500 mt-1">
                          {fieldErrors.projectTitle}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                      Client / Organisation <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={clientOrg}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClientOrg(val);
                        if (touched.clientOrg) {
                          setFieldErrors((p) => ({ ...p, clientOrg: validateSOWField("clientOrg", val) }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, clientOrg: true }));
                        setFieldErrors((p) => ({ ...p, clientOrg: validateSOWField("clientOrg", clientOrg) }));
                      }}
                      placeholder="e.g. MedCare Solutions Pvt. Ltd."
                      className={cn("w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border bg-white outline-none focus:border-brown-300 transition-colors",
                        fieldErrors.clientOrg ? "border-red-300 bg-red-50/30" : "border-gray-200")} />
                    <AnimatePresence>
                      {fieldErrors.clientOrg && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                          className="text-[11px] text-red-500 mt-1">
                          {fieldErrors.clientOrg}
                        </motion.p>
                      )}
                    </AnimatePresence>
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

                  {/* ── Commercial details (manual) ── */}
                  <div className="sm:col-span-2 mt-1 pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-600 mb-2">Commercial details</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Estimated Budget</label>
                    <div className="flex gap-2">
                      <select value={budgetCurrency} onChange={(e) => setBudgetCurrency(e.target.value)}
                        className="text-[13px] text-gray-700 px-2.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300">
                        <option>USD</option><option>INR</option><option>EUR</option><option>GBP</option>
                      </select>
                      <input type="number" min="0" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)}
                        placeholder="e.g. 50000"
                        className="flex-1 w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">End Date / Deadline</label>
                    <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 transition-colors" />
                  </div>
                  {startDate && endDate && (
                    <div className="flex items-end">
                      <p className="text-[11px] text-gray-500">
                        Duration: <span className="font-semibold text-gray-700">
                          {Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))} days
                        </span>
                      </p>
                    </div>
                  )}
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

          {/* STATE 1 + 2: Drop zone (unified — shows file info inside when selected) */}
          {!isParsing && !isComplete && (
            <motion.div variants={fadeUp} className="space-y-3">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={!selectedFile ? handleBrowseClick : undefined}
                className={cn(
                  "rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center px-10",
                  selectedFile ? "py-8 cursor-default" : "py-16 cursor-pointer",
                  isDragging
                    ? "border-brown-400 bg-brown-50/60"
                    : selectedFile
                    ? "border-brown-300 bg-brown-50/30"
                    : "border-gray-300 bg-white hover:border-brown-300"
                )}
              >
                <AnimatePresence mode="wait">
                  {selectedFile ? (
                    /* ── File selected state (inside dropzone) ── */
                    <motion.div
                      key="file-selected"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 w-full"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        selectedFile.name.endsWith(".pdf")
                          ? "bg-gradient-to-br from-brown-400 to-brown-600"
                          : "bg-gradient-to-br from-teal-400 to-teal-600"
                      )}>
                        {selectedFile.name.endsWith(".pdf")
                          ? <File className="w-5 h-5 text-white" />
                          : <FileType className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[15px] font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{getFileTypeLabel(selectedFile)}</span>
                          <span className="text-[11px] text-gray-400">{formatFileSize(selectedFile.size)}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        className="shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" /> Change
                      </button>
                    </motion.div>
                  ) : (
                    /* ── Empty drop zone ── */
                    <motion.div
                      key="drop-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors",
                        isDragging ? "bg-brown-100" : "bg-gray-100"
                      )}>
                        <FileUp className={cn("w-8 h-8 transition-colors", isDragging ? "text-brown-500" : "text-gray-400")} />
                      </div>
                      <h3 className="text-[18px] font-bold text-gray-800 tracking-wide uppercase mb-2">
                        {isDragging ? "Release to Upload" : "Drag & Drop Your SOW Document"}
                      </h3>
                      <p className="text-[13px] text-gray-400 mb-4">
                        {isDragging ? "Drop the file anywhere in this area" : "or click to browse your files"}
                      </p>
                      <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">
                        PDF &nbsp;•&nbsp; DOCX &nbsp;•&nbsp; DOC &nbsp;•&nbsp; Max 50MB
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Upload & Parse button — disabled until file selected */}
              <button
                onClick={startParsing}
                disabled={!selectedFile}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-3.5 rounded-xl transition-all uppercase tracking-wide",
                  selectedFile
                    ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-sm cursor-pointer"
                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                )}
              >
                <Upload className="w-4 h-4" /> Upload & Parse
              </button>
            </motion.div>
          )}

          {/* Upload error */}
          <AnimatePresence>
            {uploadError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 mt-3 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-[12px] text-red-700">{uploadError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STATE 3: Uploading → AI-approved (no real extraction yet) */}
          <AnimatePresence>
            {isParsing && selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "linear-gradient(160deg, #FFFFFF 0%, #FAF7F4 100%)",
                    boxShadow: "0 8px 32px rgba(166,119,99,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(229,221,212,0.8)",
                  }}
                >
                  <div className="flex items-center gap-5 px-7 py-7">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0"
                      style={{ boxShadow: "0 6px 20px rgba(42,96,104,0.30)" }}>
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight leading-tight">
                        Uploading…
                      </h2>
                      <p className="text-[12.5px] text-gray-400 mt-1">
                        Storing your document and starting the 5-stage approval pipeline.
                      </p>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-forest-500 shrink-0" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ═══ RIGHT COLUMN — Sidebar ═══ */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <WhatHappensNext activeStep={isComplete ? 2 : 1} />

          {/* How approval works */}
          <div className="card-parchment px-5 py-5">
            <h3 className="text-[13px] font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brown-400" /> How approval works
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
    <SOWUploadGuard />
    </>
  );
}
