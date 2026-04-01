"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileCode2,
  Upload,
  Clock,
  CheckCircle2,
  ArrowLeft,
  FileText,
  X,
  Send,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockWorkSampleBrief, mockContributorProfile } from "@/mocks/data/contributor";

/* ═══ Constants ═══ */
const DEADLINE_HOURS = 72;
const DEADLINE_SECONDS = DEADLINE_HOURS * 60 * 60;

/* ═══ PAGE ═══ */

export default function WorkSamplePage() {
  const brief = mockWorkSampleBrief;

  const [timeLeft, setTimeLeft] = React.useState(DEADLINE_SECONDS);
  const [uploadedFiles, setUploadedFiles] = React.useState<{ name: string; size: number; displaySize: string }[]>([]);
  const [checkedCriteria, setCheckedCriteria] = React.useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const mountedRef = React.useRef(true);
  React.useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  /* ═══ Timer ═══ */
  React.useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!mountedRef.current) return prev;
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  /* ═══ Format time ═══ */
  function formatCountdown(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /* ═══ File handlers ═══ */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  }

  function addFiles(files: File[]) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    const MAX_FILE_COUNT = 10;
    const ALLOWED_EXT = [".pdf", ".zip", ".jpg", ".jpeg", ".png", ".gif", ".js", ".ts", ".tsx", ".jsx", ".txt", ".md", ".json"];

    setFileError(null);

    if (uploadedFiles.length + files.length > MAX_FILE_COUNT) {
      setFileError(`Maximum ${MAX_FILE_COUNT} files allowed. You have ${uploadedFiles.length} already.`);
      return;
    }

    for (const f of files) {
      const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
      if (!ALLOWED_EXT.includes(ext)) {
        setFileError(`File type "${ext}" not allowed. Accepted: PDF, ZIP, JPG, PNG, JS, TS, TXT, MD, JSON`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`"${f.name}" exceeds 10 MB limit (${(f.size / (1024 * 1024)).toFixed(1)} MB)`);
        return;
      }
    }

    const currentTotal = uploadedFiles.reduce((sum, uf) => sum + uf.size, 0);
    const newTotal = files.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
      setFileError("Total upload size would exceed 50 MB limit");
      return;
    }

    const newFiles = files.map((f) => ({
      name: f.name,
      size: f.size,
      displaySize: f.size < 1024 * 1024
        ? `${(f.size / 1024).toFixed(1)} KB`
        : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(idx: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleCriterion(idx: number) {
    setCheckedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  /* ═══ Submitted view ═══ */
  if (submitted) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="mb-8">
          <Link href="/contributor/assessment" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4" aria-label="Back to assessment overview">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
          </Link>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            Work Sample Submitted
          </h1>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[20px] font-semibold text-gray-900 mb-2">Submission Received</h2>
          <p className="text-[13px] text-gray-500 mb-4">
            Your work sample has been submitted successfully. It will be reviewed by the assessment panel within 48 hours.
          </p>
          <div className="space-y-2 text-left">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50/50">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-[12px] text-gray-600 flex-1 truncate">{f.name}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{f.displaySize}</span>
              </div>
            ))}
          </div>
          <Link
            href="/contributor/assessment"
            className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-teal-700 hover:text-teal-800 transition-colors"
            aria-label="Return to assessment overview"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assessment
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <Link href="/contributor/assessment" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4" aria-label="Back to assessment overview">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
              Work Sample Submission
            </h1>
            <p className="text-[13px] text-gray-400 mt-1">
              50% weight in your composite assessment score
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-[14px] font-semibold",
            timeLeft <= 3600 ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-700"
          )}>
            <Clock className="w-4 h-4" />
            {formatCountdown(timeLeft)}
          </div>
        </div>
      </motion.div>

      {/* ═══ Deadline warning ═══ */}
      {timeLeft <= 3600 && timeLeft > 0 && (
        <motion.div variants={fadeUp} className="rounded-xl bg-red-50/60 border border-red-200 p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-[12px] text-red-700">Less than 1 hour remaining. Submit your work before the deadline expires.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ═══ TASK BRIEF ═══ */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          {/* ═══ M3: Designation-Specific Context ═══ */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-teal-600 shrink-0" />
            <p className="text-[12px] text-teal-700">
              This work sample is tailored to your designation: <span className="font-semibold">{mockContributorProfile.designation}</span> ({mockContributorProfile.designationLevel} level)
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                <FileCode2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brown-900">{brief.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {brief.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-forest-50 text-forest-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line mb-4">
              {brief.description}
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Deadline: {brief.deadline}</span>
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Format: {brief.submissionFormat}</span>
            </div>
          </div>

          {/* ═══ FILE UPLOAD ═══ */}
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-brown-900 mb-4">Upload Your Work</h3>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-teal-400 bg-teal-50/40"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/30"
              )}
              role="button"
              aria-label="Drop files here or click to upload"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            >
              <Upload className={cn("w-8 h-8 mx-auto mb-3", isDragging ? "text-teal-500" : "text-gray-300")} />
              <p className="text-[13px] font-medium text-gray-600 mb-1">
                {isDragging ? "Drop files here" : "Drag & drop files here, or click to browse"}
              </p>
              <p className="text-[11px] text-gray-400">PDF, ZIP, JPG, PNG, JS, TS, JSON, TXT, MD. Max 10 MB each, 50 MB total.</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                aria-label="File upload input"
              />
            </div>

            {fileError && (
              <div className="flex items-center gap-2 mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {fileError}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50/50">
                    <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="text-[12px] text-gray-700 flex-1 truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{file.displaySize}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      aria-label={`Remove file ${file.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ SIDEBAR: Evaluation Criteria ═══ */}
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6">
            <h3 className="text-[12px] font-semibold text-gray-600 mb-4">Evaluation Criteria</h3>
            <p className="text-[11px] text-gray-400 mb-4">Check each criterion you have addressed in your submission.</p>

            <div className="space-y-3">
              {brief.evaluationCriteria.map((criterion, idx) => (
                <label
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    checkedCriteria.has(idx) ? "bg-forest-50/50" : "hover:bg-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checkedCriteria.has(idx)}
                    onChange={() => toggleCriterion(idx)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    aria-label={criterion}
                  />
                  <span className={cn(
                    "text-[12px] leading-relaxed",
                    checkedCriteria.has(idx) ? "text-forest-700" : "text-gray-600"
                  )}>
                    {criterion}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
              {checkedCriteria.size} of {brief.evaluationCriteria.length} criteria addressed
            </div>
          </div>

          {/* ═══ SUBMIT ═══ */}
          <div className="mt-4">
            <button
              onClick={handleSubmit}
              disabled={uploadedFiles.length === 0}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-3 rounded-xl transition-colors",
                uploadedFiles.length > 0
                  ? "text-white bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700"
                  : "text-gray-400 bg-gray-100 cursor-not-allowed"
              )}
              aria-label="Submit work sample"
            >
              <Send className="w-4 h-4" />
              Submit Work Sample
            </button>
            {uploadedFiles.length === 0 && (
              <p className="text-[10px] text-gray-400 text-center mt-2">Upload at least one file to submit</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
