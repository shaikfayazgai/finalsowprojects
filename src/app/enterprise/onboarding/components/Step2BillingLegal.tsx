"use client";

import {
  AlertCircle, ArrowRight, ArrowLeft, CreditCard, FileText,
  Upload, ShieldCheck, CheckCircle, RefreshCw, Mail, Download,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
} from "@/components/ui";

const CURRENCIES = [
  { code: "INR", symbol: "\u20B9", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "AED", symbol: "\u062F.\u0625", label: "UAE Dirham" },
  { code: "GBP", symbol: "\u00A3", label: "British Pound" },
];

interface Props {
  billingCurrency: string;
  setBillingCurrency: (v: string) => void;
  billingContactEmail: string;
  setBillingContactEmail: (v: string) => void;
  billingContactName: string;
  setBillingContactName: (v: string) => void;
  ndaFile: File | null;
  setNdaFile: (v: File | null) => void;
  ndaDrag: boolean;
  setNdaDrag: (v: boolean) => void;
  acceptTos: boolean;
  setAcceptTos: (v: boolean) => void;
  acceptDpa: boolean;
  setAcceptDpa: (v: boolean) => void;
  esigOtpSent: boolean;
  esigOtp: string;
  setEsigOtp: (v: string) => void;
  esigCooldown: number;
  esigVerified: boolean;
  esigOtpLoading: boolean;
  onSendOTP: () => void;
  onVerifyOTP: () => void;
  error: string;
  onContinue: () => void;
  onBack: () => void;
}

export function Step2BillingLegal({
  billingCurrency, setBillingCurrency,
  billingContactEmail, setBillingContactEmail,
  billingContactName, setBillingContactName,
  ndaFile, setNdaFile, ndaDrag, setNdaDrag,
  acceptTos, setAcceptTos, acceptDpa, setAcceptDpa,
  esigOtpSent, esigOtp, setEsigOtp, esigCooldown, esigVerified, esigOtpLoading,
  onSendOTP, onVerifyOTP,
  error, onContinue, onBack,
}: Props) {
  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 2 of 4</p>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Billing & Legal</p>
          <p className="text-xs text-beige-500 mt-0.5">Set billing preferences and sign required agreements</p>
        </div>

        <div className="space-y-5">

          {/* Billing Currency */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center shrink-0">
                <CreditCard className="w-3 h-3 text-teal-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Billing Preferences</p>
            </div>

            <div className="space-y-1.5">
              <Label>Billing Currency <span className="text-red-400">*</span></Label>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map(({ code, symbol, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setBillingCurrency(code)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                      billingCurrency === code
                        ? "border-brown-500 bg-brown-50 shadow-sm"
                        : "border-beige-200 bg-white hover:border-beige-300"
                    }`}
                  >
                    <span className="text-lg font-bold text-brown-800">{symbol}</span>
                    <span className="text-[10px] font-semibold text-brown-600">{code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Billing Contact Name <span className="text-red-400">*</span></Label>
                <Input placeholder="Full name" value={billingContactName} onChange={e => setBillingContactName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Billing Contact Email <span className="text-red-400">*</span></Label>
                <Input type="email" placeholder="billing@company.com" value={billingContactEmail} onChange={e => setBillingContactEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* NDA Upload */}
          <div className="pt-2 border-t border-beige-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                <FileText className="w-3 h-3 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">NDA Upload</p>
              <span className="text-[10px] text-beige-400 font-medium ml-auto">PDF only · max 5 MB</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100 mb-2">
              <Download className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <p className="text-[11px] text-blue-700">
                <a href="/nda-agreement.pdf" target="_blank" className="font-semibold hover:underline">Download NDA template</a>
                {" "}— print, sign, scan, and upload below.
              </p>
            </div>

            <label
              onDragOver={e => { e.preventDefault(); setNdaDrag(true); }}
              onDragLeave={() => setNdaDrag(false)}
              onDrop={e => {
                e.preventDefault();
                setNdaDrag(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type === "application/pdf" && file.size <= 5 * 1024 * 1024) setNdaFile(file);
              }}
              className={`flex items-center gap-3 w-full rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all ${
                ndaDrag
                  ? "border-brown-400 bg-brown-50"
                  : ndaFile
                  ? "border-teal-400 bg-teal-50"
                  : "border-beige-300 hover:border-beige-400 bg-white"
              }`}
            >
              <input type="file" accept=".pdf" className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 5 * 1024 * 1024) setNdaFile(f); }} />
              {ndaFile ? (
                <>
                  <FileText className="w-5 h-5 text-teal-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-teal-800 truncate">{ndaFile.name}</p>
                    <p className="text-[10px] text-teal-600">{(ndaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-beige-400 shrink-0" />
                  <div>
                    <p className="text-sm text-brown-700 font-medium">Upload signed NDA (PDF)</p>
                    <p className="text-[10px] text-beige-400 mt-0.5">Drop file or click to browse — max 5 MB</p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Legal Agreements */}
          <div className="pt-2 border-t border-beige-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-brown-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3 h-3 text-brown-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Legal Agreements</p>
              <span className="text-red-400 text-xs">*</span>
            </div>

            {/* ToS */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-beige-50 border border-beige-100 cursor-pointer hover:bg-beige-100/60 transition-colors">
              <input type="checkbox" checked={acceptTos} onChange={e => setAcceptTos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-beige-300 text-brown-600 focus:ring-brown-500" />
              <div>
                <p className="text-sm font-medium text-brown-800">Terms of Service</p>
                <p className="text-[11px] text-beige-500 mt-0.5">I have read and agree to the GlimmoraTeam Terms of Service.</p>
              </div>
            </label>

            {/* DPA */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-beige-50 border border-beige-100 cursor-pointer hover:bg-beige-100/60 transition-colors">
              <input type="checkbox" checked={acceptDpa} onChange={e => setAcceptDpa(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-beige-300 text-brown-600 focus:ring-brown-500" />
              <div>
                <p className="text-sm font-medium text-brown-800">Data Processing Agreement</p>
                <p className="text-[11px] text-beige-500 mt-0.5">I accept the Data Processing Agreement and confirm authority to bind my organisation.</p>
              </div>
            </label>
          </div>

          {/* Electronic Signature OTP */}
          <div className="pt-2 border-t border-beige-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center shrink-0">
                <Mail className="w-3 h-3 text-teal-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Electronic Signature Confirmation</p>
              <span className="text-red-400 text-xs">*</span>
              {esigVerified && (
                <span className="ml-auto flex items-center gap-1 text-xs text-teal-600 font-medium">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <p className="text-[11px] text-beige-500">A 6-digit OTP will be sent to your registered email to confirm your legal authority.</p>

            {!esigVerified ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={billingContactEmail} disabled className="flex-1 opacity-70" />
                  <Button type="button" size="sm" variant="primary" onClick={onSendOTP}
                    disabled={esigOtpLoading || esigVerified} className="shrink-0">
                    {esigOtpLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</> : esigOtpSent ? "Resend OTP" : "Send OTP"}
                  </Button>
                </div>

                {esigOtpSent && (
                  <div className="space-y-2 p-3 rounded-xl bg-teal-50/60 border border-teal-100">
                    <p className="text-xs text-teal-700">A 6-digit code was sent to <strong>{billingContactEmail}</strong>. Valid for 10 minutes.</p>
                    <div className="flex gap-2 items-center">
                      <Input type="text" inputMode="numeric" maxLength={6}
                        placeholder="Enter 6-digit code"
                        className="text-center tracking-[0.5em] font-mono flex-1"
                        value={esigOtp} onChange={e => setEsigOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                      <Button type="button" size="sm" variant="primary" className="shrink-0"
                        onClick={onVerifyOTP} disabled={esigOtpLoading || esigOtp.length < 6}>
                        {esigOtpLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Verify <ArrowRight className="w-3.5 h-3.5" /></>}
                      </Button>
                    </div>
                    {esigCooldown > 0 && (
                      <p className="text-xs text-teal-600">Resend in {esigCooldown}s</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 border border-teal-200">
                <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0" />
                <p className="text-xs text-teal-700 font-medium">Electronic signature confirmed. Your identity has been verified.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <Button type="button" variant="primary" size="lg" className="w-full"
            onClick={onContinue} disabled={!acceptTos || !acceptDpa || !esigVerified}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>

          <button type="button" onClick={onBack}
            className="w-full text-sm text-beige-600 hover:text-beige-800 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
