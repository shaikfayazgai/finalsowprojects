"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileUp,
  FileText,
  Sparkles,
  CheckCircle2,
  X,
  File,
  FileType,
  Loader2,
  ArrowRight,
  Search,
  Brain,
  LayoutList,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge, Button, Progress } from "@/components/ui";
import { StatusTimeline } from "@/components/enterprise/status-timeline";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockSOWs } from "@/mocks/data/enterprise-sow";

const recentUploads = mockSOWs.slice(0, 2);

/* ────────────────────────────────────────────────────────────
   Parsing stage definitions
   ──────────────────────────────────────────────────────────── */
type ParsingStage =
  | null
  | "uploading"
  | "extracting"
  | "analyzing"
  | "detecting"
  | "scoring"
  | "complete";

const PARSING_STAGES: {
  key: ParsingStage;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    key: "uploading",
    label: "Uploading File",
    icon: Upload,
    description: "Transferring document to secure cloud storage...",
  },
  {
    key: "extracting",
    label: "OCR / Text Extraction",
    icon: Search,
    description: "Extracting text content from document pages...",
  },
  {
    key: "analyzing",
    label: "NLP Analysis",
    icon: Brain,
    description: "Running natural language processing pipeline...",
  },
  {
    key: "detecting",
    label: "Section Detection",
    icon: LayoutList,
    description: "Identifying scope, budget, timeline, and risk sections...",
  },
  {
    key: "scoring",
    label: "Gap Analysis & Risk Scoring",
    icon: ShieldCheck,
    description: "Evaluating completeness and flagging ambiguities...",
  },
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

/* ────────────────────────────────────────────────────────────
   File type helpers
   ──────────────────────────────────────────────────────────── */
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
const ACCEPTED_EXTENSIONS = ".pdf,.docx,.doc";

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

/* ────────────────────────────────────────────────────────────
   Mock parse results
   ──────────────────────────────────────────────────────────── */
const MOCK_RESULTS = {
  sectionsDetected: 14,
  aiConfidence: 92,
  gapScore: 88,
  riskScore: 22,
  ambiguities: 3,
  estimatedBudget: "$310,000",
  estimatedDuration: "7 months",
};

/* ────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────── */
export default function SOWUploadPage() {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsingStage, setParsingStage] = React.useState<ParsingStage>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isParsing = parsingStage !== null && parsingStage !== "complete";
  const isComplete = parsingStage === "complete";

  /* ── File selection handlers ── */
  const handleFileSelect = (file: File) => {
    // Validate type
    const ext = file.name.toLowerCase();
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !ext.endsWith(".pdf") &&
      !ext.endsWith(".docx") &&
      !ext.endsWith(".doc")
    ) {
      return; // silently reject unsupported files
    }
    setSelectedFile(file);
    setParsingStage(null);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset the input so re-selecting the same file triggers onChange
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsingStage(null);
  };

  /* ── Parsing simulation ── */
  const startParsing = () => {
    if (!selectedFile || isParsing) return;

    const stages: ParsingStage[] = [
      "uploading",
      "extracting",
      "analyzing",
      "detecting",
      "scoring",
      "complete",
    ];

    stages.forEach((stage, i) => {
      setTimeout(() => {
        setParsingStage(stage);
      }, i * 600);
    });
  };

  /* ── Sidebar timeline status based on parsing stage ── */
  const getTimelineSteps = () => {
    const stageIdx = getStageIndex(parsingStage);

    const getStatus = (threshold: number): "completed" | "current" | "upcoming" => {
      if (isComplete) return "completed";
      if (stageIdx >= threshold) return "completed";
      if (stageIdx >= threshold - 1) return "current";
      return "upcoming";
    };

    return [
      {
        label: "Upload Document",
        description: "Drop your SOW file -- PDF or DOCX supported",
        status: selectedFile
          ? isParsing || isComplete
            ? ("completed" as const)
            : ("current" as const)
          : ("current" as const),
      },
      {
        label: "AI Parsing",
        description: "Our AI engine reads and interprets every clause",
        status: getStatus(2),
      },
      {
        label: "Section Extraction",
        description: "Scope, budget, timeline, risks -- all auto-structured",
        status: getStatus(4),
      },
      {
        label: "Review & Edit",
        description: "Verify AI interpretations, accept or modify suggestions",
        status: isComplete ? ("current" as const) : ("upcoming" as const),
      },
      {
        label: "Approve & Decompose",
        description: "Lock the SOW and generate your project blueprint",
        status: "upcoming" as const,
      },
    ];
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-2 text-sm text-beige-600 hover:text-brown-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to SOW Repository
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-brown-900 tracking-tight font-heading">
          Upload Statement of Work
        </h1>
        <p className="text-sm text-beige-600 mt-1">
          Upload your SOW document and our AI will parse and extract key
          sections for project decomposition.
        </p>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Upload Area */}
          <div className="lg:col-span-3 space-y-5">
            {/* Drag & Drop Zone */}
            {!isComplete && (
              <div
                className={cn(
                  "relative rounded-2xl border-2 border-dashed transition-all duration-300 p-10",
                  isParsing && "pointer-events-none opacity-60",
                  isDragging
                    ? "border-brown-500 bg-brown-50/50 shadow-lg shadow-brown-100/30"
                    : "border-brown-200 bg-beige-50/60 hover:border-brown-300 hover:bg-beige-100/40"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isParsing) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={isParsing ? undefined : handleDrop}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Animated icon cluster */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center">
                      <FileUp className="w-9 h-9 text-brown-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-brown-900 mb-1">
                    Drag & drop your SOW document
                  </h3>
                  <p className="text-sm text-beige-500 mb-4 max-w-sm">
                    or click to browse your files
                  </p>

                  <Button
                    variant="outline"
                    size="md"
                    className="mb-4"
                    onClick={handleBrowseClick}
                    disabled={isParsing}
                  >
                    <Upload className="w-4 h-4" />
                    Browse Files
                  </Button>

                  <div className="flex items-center gap-4 text-[11px] text-beige-400">
                    <span>Supported: PDF, DOCX, DOC</span>
                    <span className="w-1 h-1 rounded-full bg-beige-300" />
                    <span>Max size: 50MB</span>
                  </div>
                </div>

                {/* Subtle corner decorations */}
                <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-brown-200/60 rounded-tl-md" />
                <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-brown-200/60 rounded-tr-md" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-brown-200/60 rounded-bl-md" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-brown-200/60 rounded-br-md" />
              </div>
            )}

            {/* Selected File Card */}
            <AnimatePresence>
              {selectedFile && !isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center shrink-0">
                      {selectedFile.name.endsWith(".pdf") ? (
                        <File className="w-5 h-5 text-brown-500" />
                      ) : (
                        <FileType className="w-5 h-5 text-teal-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-brown-800 truncate">
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="beige" size="sm">
                          {getFileTypeLabel(selectedFile)}
                        </Badge>
                        <span className="text-[11px] text-beige-500">
                          {formatFileSize(selectedFile.size)}
                        </span>
                      </div>
                    </div>
                    {!isParsing && (
                      <button
                        onClick={handleRemoveFile}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-beige-400 hover:text-brown-600 hover:bg-beige-100 transition-all shrink-0"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Parsing Progress */}
            <AnimatePresence>
              {isParsing && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
                      <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-brown-900">
                        Parsing Document...
                      </h3>
                      <p className="text-[12px] text-beige-500">
                        AI engine is analyzing your SOW
                      </p>
                    </div>
                  </div>

                  {/* Overall progress bar */}
                  <div className="mb-5">
                    <Progress
                      value={getProgressPercent(parsingStage)}
                      variant="gradient-forest"
                      size="md"
                      showValue
                    />
                  </div>

                  {/* Stage list */}
                  <div className="space-y-3">
                    {PARSING_STAGES.map((stage) => {
                      const currentIdx = getStageIndex(parsingStage);
                      const stageIdx = PARSING_STAGES.indexOf(stage);
                      const isActive = stage.key === parsingStage;
                      const isDone = currentIdx > stageIdx;
                      const isPending = currentIdx < stageIdx;
                      const StageIcon = stage.icon;

                      return (
                        <div
                          key={stage.key}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300",
                            isActive && "bg-teal-50/80 border border-teal-100",
                            isDone && "opacity-70",
                            isPending && "opacity-40"
                          )}
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                              isActive &&
                                "bg-teal-500 text-white ring-4 ring-teal-100",
                              isDone && "bg-forest-500 text-white",
                              isPending && "bg-beige-200 text-beige-400"
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : isActive ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <StageIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-[13px] font-semibold",
                                isActive && "text-teal-800",
                                isDone && "text-brown-700",
                                isPending && "text-beige-400"
                              )}
                            >
                              {stage.label}
                            </p>
                            {isActive && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[11px] text-teal-600 mt-0.5"
                              >
                                {stage.description}
                              </motion.p>
                            )}
                          </div>
                          {isDone && (
                            <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Parse Complete — Results Card */}
            <AnimatePresence>
              {isComplete && selectedFile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="rounded-2xl border border-forest-200/50 bg-gradient-to-br from-white/80 to-forest-50/30 backdrop-blur-sm p-6"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-brown-900">
                        Parsing Complete
                      </h3>
                      <p className="text-[12px] text-beige-600">
                        {selectedFile.name} has been analyzed successfully
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      {
                        label: "Sections Found",
                        value: MOCK_RESULTS.sectionsDetected,
                        color: "brown" as const,
                      },
                      {
                        label: "AI Confidence",
                        value: `${MOCK_RESULTS.aiConfidence}%`,
                        color: "forest" as const,
                      },
                      {
                        label: "Gap Score",
                        value: `${MOCK_RESULTS.gapScore}%`,
                        color: "teal" as const,
                      },
                      {
                        label: "Ambiguities",
                        value: MOCK_RESULTS.ambiguities,
                        color: "gold" as const,
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-xl bg-white/60 border border-beige-200/40 p-3 text-center"
                      >
                        <p
                          className={cn(
                            "text-xl font-bold font-heading",
                            metric.color === "brown" && "text-brown-700",
                            metric.color === "forest" && "text-forest-600",
                            metric.color === "teal" && "text-teal-600",
                            metric.color === "gold" && "text-gold-600"
                          )}
                        >
                          {metric.value}
                        </p>
                        <p className="text-[11px] text-beige-500 mt-0.5">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Estimates row */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 rounded-lg bg-white/50 border border-beige-200/40 px-3 py-2">
                      <p className="text-[11px] text-beige-500">
                        Estimated Budget
                      </p>
                      <p className="text-[14px] font-bold text-brown-800">
                        {MOCK_RESULTS.estimatedBudget}
                      </p>
                    </div>
                    <div className="flex-1 rounded-lg bg-white/50 border border-beige-200/40 px-3 py-2">
                      <p className="text-[11px] text-beige-500">
                        Estimated Duration
                      </p>
                      <p className="text-[14px] font-bold text-brown-800">
                        {MOCK_RESULTS.estimatedDuration}
                      </p>
                    </div>
                  </div>

                  {/* Risk flags */}
                  <div className="rounded-lg bg-gold-50/60 border border-gold-100/60 p-3 mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-gold-600" />
                      <span className="text-[12px] font-bold text-gold-800">
                        {MOCK_RESULTS.ambiguities} ambiguities flagged
                      </span>
                    </div>
                    <p className="text-[11px] text-gold-700">
                      Review these in the parsed SOW to ensure accurate
                      decomposition.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link href="/enterprise/sow/upload/extraction-report" className="flex-1">
                      <Button
                        variant="gradient-primary"
                        size="lg"
                        className="w-full"
                      >
                        Review Extraction
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setSelectedFile(null);
                        setParsingStage(null);
                      }}
                    >
                      Upload Another
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload & Parse CTA */}
            {!isComplete && (
              <Button
                variant="gradient-primary"
                size="lg"
                className="w-full"
                disabled={!selectedFile || isParsing}
                onClick={startParsing}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Parse
                  </>
                )}
              </Button>
            )}

            {/* Recent Uploads */}
            <div>
              <h3 className="text-sm font-semibold text-brown-800 mb-3">
                Recent Uploads
              </h3>
              <div className="space-y-2.5">
                {recentUploads.map((sow) => (
                  <Link
                    key={sow.id}
                    href={`/enterprise/sow/${sow.id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-beige-200/50 bg-white/60 backdrop-blur-sm p-3.5 hover:shadow-md hover:border-beige-300 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-brown-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-brown-800 truncate group-hover:text-brown-600 transition-colors">
                          {sow.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-beige-500">
                            {sow.client}
                          </span>
                          <span className="text-beige-300">|</span>
                          <span className="text-[11px] text-beige-500">
                            {sow.fileSize}
                          </span>
                        </div>
                      </div>
                      <MetricRing
                        value={sow.aiConfidence}
                        size={40}
                        strokeWidth={3}
                        color={sow.aiConfidence >= 90 ? "forest" : "teal"}
                        className="shrink-0"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: What Happens Next */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-[15px] font-semibold text-brown-900">
                  What happens next?
                </h3>
              </div>

              <StatusTimeline steps={getTimelineSteps()} />

              {/* AI Features Callout */}
              <div className="mt-6 rounded-xl bg-gradient-to-br from-teal-50 to-beige-50 border border-teal-100/60 p-4">
                <h4 className="text-[12px] font-bold text-teal-800 uppercase tracking-wider mb-2">
                  AI-Powered Features
                </h4>
                <ul className="space-y-2">
                  {[
                    "Smart section detection with 94%+ accuracy",
                    "Automated risk & ambiguity flagging",
                    "Budget estimation from scope analysis",
                    "Timeline feasibility assessment",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                      <span className="text-[12px] text-teal-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
