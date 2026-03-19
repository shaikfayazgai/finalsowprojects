"use client";

import {
  AlertCircle, ArrowLeft, ArrowRight, FileUp, FileText,
  CheckCircle, Upload, Rocket, RefreshCw,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
} from "@/components/ui";

interface Props {
  sowFile: File | null;
  setSowFile: (v: File | null) => void;
  sowDrag: boolean;
  setSowDrag: (v: boolean) => void;
  projectTitle: string;
  setProjectTitle: (v: string) => void;
  isLoading: boolean;
  error: string;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function Step4UploadSOW({
  sowFile, setSowFile, sowDrag, setSowDrag,
  projectTitle, setProjectTitle,
  isLoading, error, onComplete, onSkip, onBack,
}: Props) {
  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 4 of 4</p>
            <span className="text-[9px] font-medium text-beige-400 bg-beige-100 px-1.5 py-0.5 rounded">Optional</span>
          </div>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Upload First SOW</p>
          <p className="text-xs text-beige-500 mt-0.5">Start your first project immediately, or skip and upload later from the dashboard</p>
        </div>

        <div className="space-y-5">

          {/* Info card */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-teal-50 border border-teal-100">
            <Rocket className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-teal-800">APG Intelligence Processing</p>
              <p className="text-[11px] text-teal-600 mt-0.5 leading-relaxed">
                Upload your Statement of Work and our AI engine will parse it, extract deliverables, and generate
                a project Blueprint for your review — typically in 30-90 seconds.
              </p>
            </div>
          </div>

          {/* SOW file upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-brown-100 flex items-center justify-center shrink-0">
                <FileUp className="w-3 h-3 text-brown-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Statement of Work</p>
              <span className="text-[10px] text-beige-400 font-medium ml-auto">PDF, DOCX, XLSX · max 50 MB</span>
            </div>

            <label
              onDragOver={e => { e.preventDefault(); setSowDrag(true); }}
              onDragLeave={() => setSowDrag(false)}
              onDrop={e => {
                e.preventDefault();
                setSowDrag(false);
                const file = e.dataTransfer.files[0];
                if (file && ACCEPTED_TYPES.includes(file.type) && file.size <= 50 * 1024 * 1024) setSowFile(file);
              }}
              className={`flex flex-col items-center gap-3 w-full rounded-2xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all ${
                sowDrag
                  ? "border-brown-400 bg-brown-50"
                  : sowFile
                  ? "border-teal-400 bg-teal-50"
                  : "border-beige-300 hover:border-beige-400 bg-white"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.xlsx"
                className="sr-only"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 50 * 1024 * 1024) setSowFile(file);
                }}
              />
              {sowFile ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-teal-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-teal-800">{sowFile.name}</p>
                    <p className="text-[11px] text-teal-600">{(sowFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-beige-300" />
                  <div className="text-center">
                    <p className="text-sm text-brown-700 font-medium">Drop your SOW file here or click to browse</p>
                    <p className="text-[11px] text-beige-400 mt-1">Accepted formats: PDF, DOCX, XLSX — max 50 MB</p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Project Title */}
          <div className="space-y-1.5">
            <Label>Project Title <span className="text-beige-400 text-[10px] font-normal">(optional)</span></Label>
            <Input
              placeholder="e.g. Mobile App Redesign Q2 2026"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-[10px] text-beige-400">If not provided, APG will extract the project name from your SOW.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Actions */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Setting up your workspace...</>
            ) : (
              <>Complete Setup <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>

          <button type="button" onClick={onSkip} disabled={isLoading}
            className="w-full text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1 disabled:opacity-50">
            Skip — I&apos;ll upload a SOW from the dashboard
          </button>

          <button type="button" onClick={onBack} disabled={isLoading}
            className="w-full text-sm text-beige-600 hover:text-beige-800 flex items-center justify-center gap-1 disabled:opacity-50">
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
