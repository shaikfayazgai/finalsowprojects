"use client";

import {
  AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle, RefreshCw, Smartphone, Mail, FileText,
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
  ndaAccepted: boolean;
  setNdaAccepted: (v: boolean) => void;
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
  ndaAccepted, setNdaAccepted,
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

          {/* ── NDA & Disclosure Agreement ── */}
          <div className={`space-y-3 p-4 rounded-xl border-2 transition-colors ${ndaAccepted ? "bg-teal-50/60 border-teal-200" : "bg-amber-50/60 border-amber-200"}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${ndaAccepted ? "bg-teal-100" : "bg-amber-100"}`}>
                <FileText className={`w-3 h-3 ${ndaAccepted ? "text-teal-600" : "text-amber-600"}`} />
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${ndaAccepted ? "text-teal-700" : "text-amber-700"}`}>
                NDA &amp; Disclosure Agreement
              </p>
              <span className="ml-auto text-[10px] font-semibold text-red-500 uppercase tracking-wide">Required</span>
            </div>

            <div className="h-36 overflow-y-auto rounded-lg bg-white border border-beige-200 p-3 text-[11px] text-beige-600 leading-relaxed space-y-2 scroll-smooth">
              <p className="font-semibold text-brown-800 text-xs">Non-Disclosure &amp; Confidentiality Agreement</p>
              <p>
                By registering as a Contributor on the GlimmoraTeam platform, you acknowledge and agree to the following terms
                regarding confidentiality, intellectual property, and professional conduct.
              </p>
              <p className="font-medium text-brown-700">1. Confidentiality Obligations</p>
              <p>
                You agree to keep strictly confidential all non-public information, trade secrets, client data, project details,
                and proprietary materials disclosed to you through the platform or any associated project engagement.
                This obligation survives the termination of your account.
              </p>
              <p className="font-medium text-brown-700">2. Intellectual Property</p>
              <p>
                All deliverables, work product, code, designs, and materials you produce during a project engagement are the
                sole property of the client or GlimmoraTeam, as specified in the applicable project agreement. You hereby assign
                all rights, title, and interest in such work product upon creation.
              </p>
              <p className="font-medium text-brown-700">3. Non-Solicitation</p>
              <p>
                During your engagement and for a period of twelve (12) months thereafter, you agree not to directly solicit,
                recruit, or engage any client, enterprise, or contributor you were introduced to through the GlimmoraTeam
                platform for business outside the platform.
              </p>
              <p className="font-medium text-brown-700">4. Data Protection</p>
              <p>
                You agree to handle all personal data in compliance with applicable data protection laws (including GDPR and
                equivalent regulations) and GlimmoraTeam&apos;s Privacy Policy. You must not store, copy, or transmit personal
                data beyond what is strictly necessary to fulfil your project obligations.
              </p>
              <p className="font-medium text-brown-700">5. Disclosure of Conflicts</p>
              <p>
                You agree to proactively disclose any actual or potential conflicts of interest — including competing employment,
                financial interests, or personal relationships — that may affect your ability to perform project duties impartially.
              </p>
              <p className="font-medium text-brown-700">6. Breach &amp; Remedies</p>
              <p>
                Any breach of this agreement may result in immediate account suspension, forfeiture of pending earnings, and
                legal action. GlimmoraTeam reserves the right to seek injunctive relief and recover damages without the
                requirement of posting a bond.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={ndaAccepted}
                  onChange={e => setNdaAccepted(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                  ${ndaAccepted
                    ? "bg-teal-500 border-teal-500"
                    : "bg-white border-beige-300 group-hover:border-amber-400"}`}>
                  {ndaAccepted && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-xs text-brown-700 leading-relaxed">
                I have read, understood, and agree to the{" "}
                <span className="font-semibold text-brown-900">NDA &amp; Disclosure Agreement</span>.
                I understand this is a legally binding obligation.{" "}
                <span className="text-red-500 font-semibold">*</span>
              </span>
            </label>
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
            onClick={onContinue} disabled={!ndaAccepted || !phoneVerified || !emailVerified}>
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
