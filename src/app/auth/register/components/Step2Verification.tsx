"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle, RefreshCw, Smartphone, Mail, FileText, ShieldCheck,
  Download, Upload,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
} from "@/components/ui";
import { COUNTRIES_DATA } from "../data";
import { CountryDialPicker } from "./CountryDialPicker";

interface Props {
  registrationEmail: string;
  setEmail?: (v: string) => void;
  phoneCountry: string;
  setPhoneCountry: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  otpSent: boolean;
  otp: string;
  setOtp: (v: string) => void;
  cooldown: number;
  phoneVerified: boolean;
  phoneOtpLoading: boolean;
  /** Local dev only: shown when SMS gateway is skipped or fails. */
  phoneOtpDevHint?: string;
  verificationEmail: string;
  setVerificationEmail: (v: string) => void;
  emailOtpSent: boolean;
  emailOtp: string;
  setEmailOtp: (v: string) => void;
  emailCooldown: number;
  emailVerified: boolean;
  emailOtpLoading: boolean;
  /** Local dev only: shown when SMTP fails but API returns a fallback OTP. */
  emailOtpDevHint?: string;
  ndaAccepted: boolean;
  setNdaAccepted: (v: boolean) => void;
  ndaSignature: string;
  setNdaSignature: (v: string) => void;
  ndaSignedFile?: File | null;
  setNdaSignedFile?: (v: File | null) => void;
  error: string;
  onSendOTP: () => void;
  onVerifyOTP: () => void;
  onSendEmailOTP: () => void;
  onVerifyEmailOTP: () => void;
  onContinue: () => void;
  onBack: () => void;
}

export function Step2Verification({
  registrationEmail,
  setEmail,
  phoneCountry, setPhoneCountry,
  phone, setPhone,
  otpSent, otp, setOtp, cooldown, phoneVerified, phoneOtpLoading,
  phoneOtpDevHint = "",
  verificationEmail, setVerificationEmail,
  emailOtpSent, emailOtp, setEmailOtp,   emailCooldown, emailVerified, emailOtpLoading,
  emailOtpDevHint = "",
  ndaAccepted, setNdaAccepted,
  ndaSignature, setNdaSignature,
  ndaSignedFile, setNdaSignedFile,
  error,
  onSendOTP, onVerifyOTP, onSendEmailOTP, onVerifyEmailOTP,
  onContinue, onBack,
}: Props) {
  const selectedCountry = COUNTRIES_DATA.find(c => c.name === phoneCountry);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const phoneMaxLen = selectedCountry?.phoneMaxLength ?? 12;

  const [emailError, setEmailError] = useState("");

  // Sync verified email back to Step 1 only after successful verification
  useEffect(() => {
    if (emailVerified) setEmail?.(verificationEmail);
  }, [emailVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError("Enter a valid email address (e.g. name@company.com)");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handlePhoneAction = () => {
    if (phoneVerified) return;
    if (!otpSent) onSendOTP();
    else document.getElementById("otp")?.focus();
  };

  const handleEmailAction = () => {
    if (emailVerified) return;
    if (!emailOtpSent) {
      if (!validateEmail(verificationEmail)) return;
      onSendEmailOTP();
    } else {
      document.getElementById("email-otp")?.focus();
    }
  };

  const handleNdaFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB");
      return;
    }
    setNdaSignedFile?.(file);
  };

  const ndaSigned = ndaAccepted && !!ndaSignedFile;

  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 3 of 4</p>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Identity Verification</p>
          <p className="text-xs text-beige-500 mt-0.5">Review and accept the NDA, then verify your contact details</p>
        </div>

        <div className="space-y-5">

          {/* ── NDA Document ── */}
          <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${ndaAccepted && !!ndaSignedFile ? "ring-2 ring-teal-300 shadow-lg shadow-teal-50" : "ring-1 ring-beige-200 shadow-md"}`}>

            {/* Doc top bar */}
            <div className="bg-white px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ndaAccepted && !!ndaSignedFile ? "bg-teal-500" : "bg-brown-600"}`}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">Product Development Non-Disclosure Agreement</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Glimmora International, UAE · 3 pages · Review before signing</p>
                </div>
              </div>
              {ndaAccepted && !!ndaSignedFile
                ? <span className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" /> Signed
                  </span>
                : <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
                    Signature required
                  </span>
              }
            </div>

            {/* Download + Upload area */}
            <div className="bg-gray-50 px-5 py-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Please download the NDA document, review it carefully, then sign and upload the signed copy below.
              </p>

              {/* Download button */}
              <a
                href="/Glimmora International Product-Development-Non-Disclosure-Agreement.pdf"
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brown-600 text-white text-sm font-medium hover:bg-brown-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download NDA Document
              </a>

              {/* Upload area */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  <Upload className="w-3 h-3 inline mr-1" />
                  Upload Signed Document <span className="text-red-500">*</span>
                </label>
                <label
                  className={`flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    ndaSignedFile
                      ? "border-teal-400 bg-teal-50"
                      : "border-gray-300 bg-white hover:border-brown-400 hover:bg-brown-50"
                  }`}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); handleNdaFileChange(e.dataTransfer.files?.[0] ?? null); }}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => handleNdaFileChange(e.target.files?.[0] ?? null)}
                  />
                  {ndaSignedFile ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-teal-500" />
                      <p className="text-sm text-teal-700 font-medium">{ndaSignedFile.name}</p>
                      <p className="text-[10px] text-teal-600">{(ndaSignedFile.size / 1024).toFixed(0)} KB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      <p className="text-sm text-gray-500">Click or drag to upload signed NDA</p>
                      <p className="text-[10px] text-gray-400">PDF, JPG, or PNG (max 5MB)</p>
                    </>
                  )}
                </label>
                {ndaSignedFile && (
                  <button type="button" onClick={() => setNdaSignedFile?.(null)}
                    className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-medium">
                    Remove file
                  </button>
                )}
              </div>
            </div>

            {/* Sign panel */}
            <div className="bg-white border-t border-gray-100 px-5 py-4 space-y-4">

              {/* Digital signature */}
              <div className="space-y-1.5">
                <label htmlFor="nda-signature" className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                  Legal Full Name (Digital Signature) <span className="text-red-500">*</span>
                </label>
                <input
                  id="nda-signature"
                  type="text"
                  placeholder="Type your full legal name to sign"
                  value={ndaSignature}
                  onChange={e => setNdaSignature(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-beige-200 bg-white text-sm text-brown-950 font-serif italic placeholder:text-gray-300 focus:outline-none focus:border-brown-500 focus:ring-2 focus:ring-brown-500/20 transition-all"
                />
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 transition-colors -mx-1">
                <div className="mt-0.5 shrink-0">
                  <div
                    onClick={() => setNdaAccepted(!ndaAccepted)}
                    className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all cursor-pointer
                      ${ndaAccepted ? "bg-teal-500 border-teal-500" : "bg-white border-gray-300 group-hover:border-brown-400"}`}
                  >
                    {ndaAccepted && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-[12px] text-gray-600 leading-relaxed">
                  I have read, understood, and agree to be legally bound by the{" "}
                  <span className="font-semibold text-gray-900">Glimmora International Product Development Non-Disclosure Agreement</span>,
                  governed by the Indian Contract Act 1872.{" "}
                  <span className="text-red-500 font-semibold">*</span>
                </span>
              </label>

              {/* Signed confirmation */}
              {ndaAccepted && !!ndaSignedFile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
                  <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-teal-800">Agreement signed &amp; uploaded</p>
                    <p className="text-[11px] text-teal-600 mt-0.5">Uploaded &amp; accepted · {today}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Phone Verification ── */}
          <div className="space-y-3 p-4 rounded-xl bg-beige-50 border border-beige-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-brown-100 flex items-center justify-center shrink-0">
                <Smartphone className="w-3 h-3 text-brown-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Phone Number</p>
              {phoneVerified && (
                <span className="ml-auto flex items-center gap-1 text-xs text-teal-600 font-medium">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <div className="flex flex-1 items-center rounded-xl border border-beige-200 bg-white shadow-sm transition-all focus-within:border-brown-500 focus-within:ring-2 focus-within:ring-brown-500/20">
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
                    id="phone"
                    type="tel"
                    placeholder={`Phone number (${phoneMaxLen} digits)`}
                    value={phone.replace(/^\+\d+\s?/, "")}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, phoneMaxLen);
                      const cc = selectedCountry?.code ?? "";
                      setPhone(cc + " " + digits);
                    }}
                    maxLength={phoneMaxLen}
                    disabled={phoneVerified}
                    className="flex-1 h-11 px-3 text-sm text-brown-950 bg-transparent outline-none placeholder:text-beige-400 disabled:opacity-60"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={phoneVerified ? "ghost" : "primary"}
                  onClick={handlePhoneAction}
                  disabled={phoneOtpLoading || phoneVerified}
                  className={`shrink-0 ${phoneVerified ? "text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-50 gap-1.5 cursor-default" : ""}`}
                >
                  {phoneVerified ? (
                    <><CheckCircle className="w-4 h-4 text-teal-500" /> Verified</>
                  ) : phoneOtpLoading ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                  ) : otpSent ? "Verify OTP" : "Send OTP"}
                </Button>
              </div>
            </div>

            {otpSent && !phoneVerified && (
              <div className="space-y-3 p-3 rounded-xl bg-teal-50/60 border border-teal-100">
                {phoneOtpDevHint ? (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">{phoneOtpDevHint}</p>
                  </div>
                ) : (
                  <p className="text-xs text-teal-700">
                    A 6-digit code was sent to <strong>{phone}</strong>. Valid for 5 minutes.
                  </p>
                )}
                <div className="flex gap-2 items-center">
                  <Input id="otp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="text-center tracking-[0.5em] font-mono flex-1" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} autoFocus />
                  <Button type="button" size="sm" variant="primary" className="shrink-0"
                    onClick={onVerifyOTP} disabled={phoneOtpLoading || otp.length < 6}>
                    {phoneOtpLoading
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <>Verify <ArrowRight className="w-3.5 h-3.5" /></>}
                  </Button>
                </div>
                <button type="button" onClick={onSendOTP}
                  disabled={cooldown > 0 || phoneOtpLoading}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </div>

          {/* ── Email Verification ── */}
          <div className="space-y-3 p-4 rounded-xl bg-beige-50 border border-beige-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center shrink-0">
                <Mail className="w-3 h-3 text-teal-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Email Address</p>
              {emailVerified && (
                <span className="ml-auto flex items-center gap-1 text-xs text-teal-600 font-medium">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Input id="verify-email" type="email" placeholder="Enter your email for verification"
                  value={verificationEmail}
                  onChange={e => {
                    setVerificationEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(verificationEmail)}
                  className="flex-1" disabled={emailVerified} />
                <Button type="button" size="sm"
                  variant={emailVerified ? "ghost" : "primary"}
                  onClick={handleEmailAction}
                  disabled={emailOtpLoading || emailVerified}
                  className={`shrink-0 ${emailVerified ? "text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-50 gap-1.5 cursor-default" : ""}`}>
                  {emailVerified ? (
                    <><CheckCircle className="w-4 h-4 text-teal-500" /> Verified</>
                  ) : emailOtpLoading ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                  ) : emailOtpSent ? "Verify OTP" : "Send OTP"}
                </Button>
              </div>
              {emailError && (
                <p className="text-xs text-red-500">{emailError}</p>
              )}
              {verificationEmail.trim() !== "" && registrationEmail.trim() !== "" && verificationEmail.trim().toLowerCase() !== registrationEmail.trim().toLowerCase() && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    This email differs from the one provided during registration. If you proceed, the verification email will be used as your primary contact for all account-related communications.
                  </p>
                </div>
              )}
            </div>

            {emailOtpSent && !emailVerified && (
              <div className="space-y-3 p-3 rounded-xl bg-teal-50/60 border border-teal-100">
                {emailOtpDevHint ? (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">{emailOtpDevHint}</p>
                  </div>
                ) : (
                  <p className="text-xs text-teal-700">
                    A 6-digit code was sent to <strong>{verificationEmail}</strong>. Valid for 5 minutes.
                  </p>
                )}
                <div className="flex gap-2 items-center">
                  <Input id="email-otp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="text-center tracking-[0.5em] font-mono flex-1" value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                  <Button type="button" size="sm" variant="primary" className="shrink-0"
                    onClick={onVerifyEmailOTP} disabled={emailOtpLoading || emailOtp.length < 6}>
                    {emailOtpLoading
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <>Verify <ArrowRight className="w-3.5 h-3.5" /></>}
                  </Button>
                </div>
                <button type="button" onClick={onSendEmailOTP}
                  disabled={emailCooldown > 0 || emailOtpLoading}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                key="step2-error"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="button" variant="primary" size="lg" className="w-full"
            onClick={onContinue}>
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
