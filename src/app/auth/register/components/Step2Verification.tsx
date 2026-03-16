"use client";

import {
  AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle, RefreshCw, Smartphone, Mail,
} from "lucide-react";
import { ChevronDown } from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
} from "@/components/ui";
import { COUNTRIES_DATA } from "../data";

interface Props {
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
  verificationEmail: string;
  setVerificationEmail: (v: string) => void;
  emailOtpSent: boolean;
  emailOtp: string;
  setEmailOtp: (v: string) => void;
  emailCooldown: number;
  emailVerified: boolean;
  emailOtpLoading: boolean;
  error: string;
  onSendOTP: () => void;
  onVerifyOTP: () => void;
  onSendEmailOTP: () => void;
  onVerifyEmailOTP: () => void;
  onContinue: () => void;
  onBack: () => void;
}

export function Step2Verification({
  phoneCountry, setPhoneCountry,
  phone, setPhone,
  otpSent, otp, setOtp, cooldown, phoneVerified, phoneOtpLoading,
  verificationEmail, setVerificationEmail,
  emailOtpSent, emailOtp, setEmailOtp, emailCooldown, emailVerified, emailOtpLoading,
  error,
  onSendOTP, onVerifyOTP, onSendEmailOTP, onVerifyEmailOTP,
  onContinue, onBack,
}: Props) {
  const selectedCountry = COUNTRIES_DATA.find(c => c.name === phoneCountry);

  const handlePhoneAction = () => {
    if (phoneVerified) return;
    if (!otpSent) onSendOTP();
    else document.getElementById("otp")?.focus();
  };

  const handleEmailAction = () => {
    if (emailVerified) return;
    if (!emailOtpSent) onSendEmailOTP();
    else document.getElementById("email-otp")?.focus();
  };

  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 3 of 4</p>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Identity Verification</p>
          <p className="text-xs text-beige-500 mt-0.5">Verify your phone number and email address</p>
        </div>

        <div className="space-y-5">

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
              <Label htmlFor="phone">Mobile Number <span className="text-red-400">*</span></Label>
              <div className="flex gap-2">
                {/* Country + dial-code selector */}
                <div className="flex flex-1 h-11 rounded-xl border border-beige-200 bg-white shadow-sm overflow-hidden transition-all focus-within:border-brown-500 focus-within:ring-2 focus-within:ring-brown-500/20">
                  <div className="relative flex items-center border-r border-beige-200 shrink-0">
                    <select
                      value={phoneCountry}
                      onChange={e => {
                        const c = COUNTRIES_DATA.find(x => x.name === e.target.value)!;
                        setPhoneCountry(c.name);
                        setPhone(c.code + " ");
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      aria-label="Country dial code"
                    >
                      {COUNTRIES_DATA.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5 px-3 pointer-events-none select-none">
                      <span className={`fi fi-${selectedCountry?.iso} text-xl`} />
                      <span className="text-sm font-semibold text-brown-700">{selectedCountry?.code}</span>
                      <ChevronDown className="w-3 h-3 text-beige-400" />
                    </div>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Work phone (with country code)"
                    value={phone.replace(/^\+\d+\s?/, "")}
                    onChange={e => {
                      const cc = selectedCountry?.code ?? "";
                      setPhone(cc + " " + e.target.value);
                    }}
                    disabled={phoneVerified}
                    className="flex-1 px-3 text-sm text-brown-950 bg-transparent outline-none placeholder:text-beige-400 disabled:opacity-60"
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
                <p className="text-xs text-teal-700">
                  A 6-digit code was sent to <strong>{phone}</strong>. Valid for 5 minutes.
                </p>
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
              <Label htmlFor="verify-email">Email for Verification <span className="text-red-400">*</span></Label>
              <div className="flex gap-2">
                <Input id="verify-email" type="email" placeholder="Work email for verification"
                  value={verificationEmail} onChange={e => setVerificationEmail(e.target.value)}
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
            </div>

            {emailOtpSent && !emailVerified && (
              <div className="space-y-3 p-3 rounded-xl bg-teal-50/60 border border-teal-100">
                <p className="text-xs text-teal-700">
                  A 6-digit code was sent to <strong>{verificationEmail}</strong>. Valid for 5 minutes.
                </p>
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

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <Button type="button" variant="primary" size="lg" className="w-full"
            onClick={onContinue} disabled={!phoneVerified || !emailVerified}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>

          <button type="button" onClick={onBack}
            className="w-full text-sm text-beige-600 hover:text-beige-800 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
