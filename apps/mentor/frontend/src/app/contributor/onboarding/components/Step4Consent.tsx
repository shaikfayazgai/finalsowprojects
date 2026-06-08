"use client";

import Link from "next/link";
import {
  AlertCircle, ArrowRight, ArrowLeft, CheckCircle,
  FileUp, Shield, Pencil, RefreshCw, Upload,
} from "lucide-react";
import { Button, Checkbox } from "@/components/ui";

interface Props {
  resumeFile: File | null;    setResumeFile: (v: File | null) => void;
  resumeDrag: boolean;        setResumeDrag: (v: boolean) => void;
  acceptTos: boolean;         setAcceptTos: (v: boolean) => void;
  acceptCoc: boolean;         setAcceptCoc: (v: boolean) => void;
  acceptPrivacy: boolean;     setAcceptPrivacy: (v: boolean) => void;
  acceptFee: boolean;         setAcceptFee: (v: boolean) => void;
  acceptAhp: boolean;         setAcceptAhp: (v: boolean) => void;
  marketingOptIn: boolean;    setMarketingOptIn: (v: boolean) => void;
  isLoading: boolean;
  error: string;
  onPreview: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

const AGREEMENTS = [
  { id: "tos"     as const, label: "Terms of Use",           link: "#" },
  { id: "coc"     as const, label: "Code of Conduct",        link: "#" },
  { id: "privacy" as const, label: "Privacy Policy",         link: "#" },
  { id: "ahp"     as const, label: "Anti-Harassment Policy", link: "#" },
] as const;

type AgreementId = (typeof AGREEMENTS)[number]["id"];

export function Step4Consent({
  resumeFile, setResumeFile, resumeDrag, setResumeDrag,
  acceptTos, setAcceptTos, acceptCoc, setAcceptCoc,
  acceptPrivacy, setAcceptPrivacy, acceptFee, setAcceptFee,
  acceptAhp, setAcceptAhp, marketingOptIn, setMarketingOptIn,
  isLoading, error, onPreview, onSubmit, onBack,
}: Props) {
  const stateMap: Record<AgreementId, { checked: boolean; set: (v: boolean) => void }> = {
    tos:     { checked: acceptTos,     set: setAcceptTos },
    coc:     { checked: acceptCoc,     set: setAcceptCoc },
    privacy: { checked: acceptPrivacy, set: setAcceptPrivacy },
    ahp:     { checked: acceptAhp,     set: setAcceptAhp },
  };
  const allRequired = acceptTos && acceptCoc && acceptPrivacy && acceptFee && acceptAhp;

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full mb-3">
          Step 4 of 4
        </span>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">Consent & Terms</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Optionally upload your resume, then review and accept all required agreements.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Resume upload */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileUp className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resume / CV</span>
            <span className="text-xs text-gray-400 font-normal normal-case tracking-normal ml-auto">Optional · PDF · max 5 MB</span>
          </div>
          <label
            onDragOver={e => { e.preventDefault(); setResumeDrag(true); }}
            onDragLeave={() => setResumeDrag(false)}
            onDrop={e => { e.preventDefault(); setResumeDrag(false); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setResumeFile(f); }}
            className={`flex items-center gap-3 w-full rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-all ${
              resumeDrag   ? "border-teal-400 bg-teal-50" :
              resumeFile   ? "border-teal-300 bg-teal-50/50" :
                             "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <input type="file" accept=".pdf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) setResumeFile(f); }} />
            {resumeFile ? (
              <>
                <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
                <span className="text-sm font-medium text-teal-700 flex-1 truncate">{resumeFile.name}</span>
                <button type="button" onClick={e => { e.preventDefault(); setResumeFile(null); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0">Remove</button>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Drop file or <span className="text-teal-600">browse</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF only · Maximum 5 MB</p>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Legal agreements */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Legal Agreements</span>
            <span className="text-xs text-red-400 font-medium ml-auto">All required</span>
          </div>
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {AGREEMENTS.map(({ id, label, link }) => {
              const { checked, set } = stateMap[id];
              return (
                <label key={id} htmlFor={id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? "bg-teal-50/50" : "bg-white hover:bg-gray-50"}`}>
                  <Checkbox id={id} checked={checked} onCheckedChange={v => set(!!v)} onClick={e => e.stopPropagation()} className="shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">
                    I agree to the{" "}
                    <Link href={link} className="text-teal-600 hover:underline font-medium" onClick={e => e.stopPropagation()}>{label}</Link>
                  </span>
                  {checked && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />}
                </label>
              );
            })}
          </div>
        </div>

        {/* Acknowledgments */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Acknowledgments</span>
          </div>

          {/* Platform fee */}
          <label htmlFor="fee"
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              acceptFee ? "border-amber-300 bg-amber-50/60" : "border-amber-200 bg-amber-50/30 hover:border-amber-300"
            }`}>
            <Checkbox id="fee" checked={acceptFee} onCheckedChange={v => setAcceptFee(!!v)} onClick={e => e.stopPropagation()} className="mt-0.5 shrink-0" />
            <span className="text-sm text-amber-900 leading-relaxed flex-1">
              I understand that GlimmoraTeam charges a <strong>platform service fee</strong> on completed task earnings.
              The rate is shown in my profile settings. <span className="text-red-400">*</span>
            </span>
            {acceptFee && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />}
          </label>

          {/* Marketing */}
          <label htmlFor="mkt"
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              marketingOptIn ? "border-teal-300 bg-teal-50/50" : "border-gray-200 hover:border-gray-300 bg-white"
            }`}>
            <Checkbox id="mkt" checked={marketingOptIn} onCheckedChange={v => setMarketingOptIn(!!v)} onClick={e => e.stopPropagation()} className="mt-0.5 shrink-0" />
            <span className="text-sm leading-relaxed flex-1">
              <span className={marketingOptIn ? "text-teal-800" : "text-gray-500"}>
                Keep me updated on new task matches, platform news, and growth resources
              </span>{" "}
              <span className="text-xs text-gray-400">(optional)</span>
            </span>
            {marketingOptIn && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />}
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button type="button" onClick={onPreview}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-500 hover:text-gray-700 transition-all">
            <Pencil className="w-3.5 h-3.5" /> Preview my answers
          </button>

          <div className="flex gap-3">
            <button type="button" onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Button type="submit" variant="gradient-forest" size="lg" className="flex-1" disabled={isLoading || !allRequired}>
              {isLoading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating account…</>
                : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
