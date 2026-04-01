"use client";

import { useState, useRef, useEffect } from "react";
import {
  AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle, RefreshCw, Smartphone, Mail,
  FileText, ShieldCheck, Download, Upload,
  ChevronDown, Search, X,
} from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { COUNTRIES_DATA } from "@/app/auth/register/data";

/* ─── Country dial picker ──────────────────────────────────── */
function CountryDialPicker({ value, onChange, disabled }: { value: string; onChange: (name: string) => void; disabled?: boolean }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef<HTMLDivElement>(null);
  const searchRef           = useRef<HTMLInputElement>(null);
  const selected            = COUNTRIES_DATA.find(c => c.name === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 50); }, [open]);

  const filtered = search.trim()
    ? COUNTRIES_DATA.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search))
    : COUNTRIES_DATA;

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" disabled={disabled}
        onClick={() => { setOpen(v => !v); setSearch(""); }}
        className={`flex items-center gap-1.5 h-10 px-3 border-r border-gray-200 bg-transparent transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg ${open ? "bg-gray-50" : "hover:bg-gray-50"}`}>
        <span className={`fi fi-${selected?.iso} text-base`} />
        <span className="text-sm font-semibold text-gray-700">{selected?.code}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input ref={searchRef} type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400" />
            {search && <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-400 text-center">No results</p>}
            {filtered.map(c => (
              <button key={c.name} type="button" onClick={() => { onChange(c.name); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${c.name === value ? "bg-teal-50 text-teal-900 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                <span className={`fi fi-${c.iso} text-base shrink-0`} />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-gray-400 font-medium shrink-0">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Verified badge ───────────────────────────────────────── */
function VerifiedBadge() {
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full whitespace-nowrap">
      <CheckCircle className="w-3 h-3" /> Verified
    </span>
  );
}

/* ─── Props ────────────────────────────────────────────────── */
interface Props {
  registrationEmail: string; setEmail: (v: string) => void;
  phoneCountry: string;  setPhoneCountry: (v: string) => void;
  phone: string;         setPhone: (v: string) => void;
  otpSent: boolean;
  otp: string;           setOtp: (v: string) => void;
  cooldown: number;
  phoneVerified: boolean; phoneOtpLoading: boolean;
  verificationEmail: string; setVerificationEmail: (v: string) => void;
  emailOtpSent: boolean;
  emailOtp: string;      setEmailOtp: (v: string) => void;
  emailCooldown: number;
  emailVerified: boolean; emailOtpLoading: boolean;
  ndaAccepted: boolean;  setNdaAccepted: (v: boolean) => void;
  ndaSignature: string;  setNdaSignature: (v: string) => void;
  ndaSignedFile: File | null; setNdaSignedFile: (v: File | null) => void;
  error: string;
  onSendOTP: () => void; onVerifyOTP: () => void;
  onSendEmailOTP: () => void; onVerifyEmailOTP: () => void;
  onContinue: () => void; onBack: () => void;
  hideEmailVerification?: boolean;
}

export function Step3Verification({
  registrationEmail, setEmail,
  phoneCountry, setPhoneCountry, phone, setPhone,
  otpSent, otp, setOtp, cooldown, phoneVerified, phoneOtpLoading,
  verificationEmail, setVerificationEmail,
  emailOtpSent, emailOtp, setEmailOtp, emailCooldown, emailVerified, emailOtpLoading,
  ndaAccepted, setNdaAccepted,
  ndaSignedFile, setNdaSignedFile,
  error,
  onSendOTP, onVerifyOTP, onSendEmailOTP, onVerifyEmailOTP,
  onContinue, onBack,
  hideEmailVerification = false,
}: Props) {
  const selectedCountry = COUNTRIES_DATA.find(c => c.name === phoneCountry);
  const phoneMaxLen     = selectedCountry?.phoneMaxLength ?? 12;
  const today           = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const [emailError, setEmailError] = useState("");
  const ndaSigned = ndaAccepted && !!ndaSignedFile;

  useEffect(() => { if (emailVerified) setEmail(verificationEmail); }, [emailVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateEmail = (val: string) => {
    if (!val.trim()) { setEmailError("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setEmailError("Enter a valid email address"); return false; }
    setEmailError(""); return true;
  };

  const handleNdaFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5MB"); return; }
    setNdaSignedFile(file);
  };

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full mb-3">
          Step 3 of 4
        </span>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">Identity Verification</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Sign the NDA and verify your phone and email to continue.
        </p>
      </div>

      <div className="space-y-5">
        {/* ── NDA ── */}
        <div className={`rounded-xl border overflow-hidden transition-all ${ndaSigned ? "border-teal-300" : "border-gray-200"}`}>
          {/* Doc header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ndaSigned ? "bg-teal-500" : "bg-gray-100"}`}>
                <FileText className={`w-4 h-4 ${ndaSigned ? "text-white" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">Non-Disclosure Agreement</p>
                <p className="text-xs text-gray-400 mt-0.5">Glimmora International · 3 pages</p>
              </div>
            </div>
            {ndaSigned
              ? <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" /> Signed
                </span>
              : <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  Required
                </span>
            }
          </div>

          {/* Download + upload */}
          <div className="px-4 py-4 bg-gray-50 space-y-3">
            <p className="text-sm text-gray-600">Download, sign, and upload the signed copy below.</p>
            <a href="/Glimmora International Product-Development-Non-Disclosure-Agreement.pdf" download
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brown-600 text-white text-sm font-medium hover:bg-brown-700 transition-colors">
              <Download className="w-4 h-4" /> Download NDA
            </a>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Upload signed copy <span className="text-red-500">*</span></p>
              <label
                className={`flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  ndaSignedFile ? "border-teal-400 bg-teal-50" : "border-gray-300 bg-white hover:border-gray-400"
                }`}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); handleNdaFile(e.dataTransfer.files?.[0] ?? null); }}
              >
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleNdaFile(e.target.files?.[0] ?? null)} />
                {ndaSignedFile ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    <p className="text-sm font-medium text-teal-700">{ndaSignedFile.name}</p>
                    <p className="text-xs text-teal-500">{(ndaSignedFile.size / 1024).toFixed(0)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-500">Click or drag to upload</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG — max 5 MB</p>
                  </>
                )}
              </label>
              {ndaSignedFile && (
                <button type="button" onClick={() => setNdaSignedFile(null)} className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
              )}
            </div>
          </div>

          {/* Agreement checkbox */}
          <div className="px-4 py-3 bg-white border-t border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setNdaAccepted(!ndaAccepted)}
                className={`mt-0.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  ndaAccepted ? "bg-teal-500 border-teal-500" : "bg-white border-gray-300 hover:border-teal-400"
                }`}
              >
                {ndaAccepted && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-gray-600 leading-relaxed">
                I have read and agree to be legally bound by the{" "}
                <span className="font-semibold text-gray-900">Glimmora International NDA</span>,
                governed by the Indian Contract Act 1872. <span className="text-red-500">*</span>
              </span>
            </label>
            {ndaSigned && (
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-teal-50 border border-teal-100">
                <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                <p className="text-xs text-teal-700">Signed &amp; uploaded · {today}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Phone ── */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Phone Verification</span>
            </div>
            {phoneVerified && <VerifiedBadge />}
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-gray-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/15 transition-all">
                <CountryDialPicker
                  value={phoneCountry}
                  onChange={name => {
                    const c = COUNTRIES_DATA.find(x => x.name === name)!;
                    setPhoneCountry(c.name);
                    setPhone(c.code + " ");
                  }}
                  disabled={phoneVerified}
                />
                <input
                  type="tel"
                  placeholder={`Number (${phoneMaxLen} digits)`}
                  value={phone.replace(/^\+\d+\s?/, "")}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, phoneMaxLen);
                    setPhone((selectedCountry?.code ?? "") + " " + digits);
                  }}
                  maxLength={phoneMaxLen}
                  disabled={phoneVerified}
                  className="flex-1 h-10 px-3 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-50"
                />
              </div>
              <Button type="button" size="sm"
                variant={phoneVerified ? "ghost" : "primary"}
                onClick={() => { if (!phoneVerified) { if (!otpSent) onSendOTP(); else document.getElementById("phone-otp")?.focus(); } }}
                disabled={phoneOtpLoading || phoneVerified}
                className={`shrink-0 ${phoneVerified ? "text-teal-600 border border-teal-200 bg-teal-50 cursor-default" : ""}`}>
                {phoneVerified ? <><CheckCircle className="w-4 h-4 text-teal-500" /> Verified</>
                  : phoneOtpLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                  : otpSent ? "Verify OTP" : "Send OTP"}
              </Button>
            </div>

            {otpSent && !phoneVerified && (
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 space-y-2.5">
                <p className="text-xs text-teal-700">Code sent to <strong>{phone}</strong> · valid 5 min</p>
                <div className="flex gap-2">
                  <Input id="phone-otp" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code"
                    className="text-center tracking-[0.5em] font-mono flex-1" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} autoFocus />
                  <Button type="button" size="sm" variant="primary" className="shrink-0"
                    onClick={onVerifyOTP} disabled={phoneOtpLoading || otp.length < 6}>
                    {phoneOtpLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Verify <ArrowRight className="w-3.5 h-3.5" /></>}
                  </Button>
                </div>
                <button type="button" onClick={onSendOTP} disabled={cooldown > 0 || phoneOtpLoading}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Email ── */}
        {!hideEmailVerification && <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Email Verification</span>
            </div>
            {emailVerified && <VerifiedBadge />}
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex gap-2">
              <Input type="email" placeholder="Enter your email"
                value={verificationEmail}
                onChange={e => { setVerificationEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={() => validateEmail(verificationEmail)}
                className="flex-1" disabled={emailVerified} />
              <Button type="button" size="sm"
                variant={emailVerified ? "ghost" : "primary"}
                onClick={() => { if (!emailVerified) { if (!emailOtpSent) { if (validateEmail(verificationEmail)) onSendEmailOTP(); } else document.getElementById("email-otp")?.focus(); } }}
                disabled={emailOtpLoading || emailVerified}
                className={`shrink-0 ${emailVerified ? "text-teal-600 border border-teal-200 bg-teal-50 cursor-default" : ""}`}>
                {emailVerified ? <><CheckCircle className="w-4 h-4 text-teal-500" /> Verified</>
                  : emailOtpLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                  : emailOtpSent ? "Verify OTP" : "Send OTP"}
              </Button>
            </div>
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            {verificationEmail.trim() && registrationEmail.trim() && verificationEmail.trim().toLowerCase() !== registrationEmail.trim().toLowerCase() && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  This differs from your registration email — it will become your primary contact if verified.
                </p>
              </div>
            )}

            {emailOtpSent && !emailVerified && (
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 space-y-2.5">
                <p className="text-xs text-teal-700">Code sent to <strong>{verificationEmail}</strong> · valid 5 min</p>
                <div className="flex gap-2">
                  <Input id="email-otp" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code"
                    className="text-center tracking-[0.5em] font-mono flex-1" value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                  <Button type="button" size="sm" variant="primary" className="shrink-0"
                    onClick={onVerifyEmailOTP} disabled={emailOtpLoading || emailOtp.length < 6}>
                    {emailOtpLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Verify <ArrowRight className="w-3.5 h-3.5" /></>}
                  </Button>
                </div>
                <button type="button" onClick={onSendEmailOTP} disabled={emailCooldown > 0 || emailOtpLoading}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </div>
        </div>}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onContinue}>
            Continue to Consent <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
