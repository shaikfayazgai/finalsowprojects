"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Upload, ChevronDown, ArrowLeft, ArrowRight,
  ShieldCheck, Mail, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { useContributorPhonePrefill } from "@/lib/stores/contributor-phone-store";

const countryCodes = [
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+91", label: "IN +91" },
  { code: "+92", label: "PK +92" },
  { code: "+63", label: "PH +63" },
  { code: "+60", label: "MY +60" },
  { code: "+65", label: "SG +65" },
  { code: "+234", label: "NG +234" },
  { code: "+27", label: "ZA +27" },
  { code: "+971", label: "AE +971" },
];

const inputBase =
  "text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400";

export default function OnboardingVerifyPage() {
  const router = useRouter();

  /* Email state */
  const [email, setEmail] = React.useState("");
  const [emailCodeSent, setEmailCodeSent] = React.useState(false);
  const [emailCode, setEmailCode] = React.useState("");
  const [emailVerified, setEmailVerified] = React.useState(false);

  /* Phone state */
  const [countryCode, setCountryCode] = React.useState("+91");
  const [phone, setPhone] = React.useState("");
  const [phoneCodeSent, setPhoneCodeSent] = React.useState(false);
  const [phoneCode, setPhoneCode] = React.useState("");
  const [phoneVerified, setPhoneVerified] = React.useState(false);

  /* One-time hydrate from contributor registration (localStorage via zustand) */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const { phone: stored } = useContributorPhonePrefill.getState();
    if (!stored || stored.replace(/\D/g, "").length < 7) return;
    const m = stored.trim().match(/^(\+\d{1,4})\s*(.*)$/);
    if (!m) return;
    const dial = m[1];
    const localDigits = m[2].replace(/\D/g, "");
    if (localDigits.length < 7) return;
    if (countryCodes.some((c) => c.code === dial)) setCountryCode(dial);
    setPhone((prev) => (prev.replace(/\D/g, "").length >= 7 ? prev : localDigits));
  }, []);

  /* ID upload state */
  const [idFile, setIdFile] = React.useState<File | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const handleSendEmailCode = () => {
    if (email) setEmailCodeSent(true);
  };
  const handleVerifyEmail = () => {
    if (emailCode.length >= 4) setEmailVerified(true);
  };

  const handleSendPhoneCode = () => {
    if (phone) setPhoneCodeSent(true);
  };
  const handleVerifyPhone = () => {
    if (phoneCode.length >= 4) setPhoneVerified(true);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setIdFile(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setIdFile(file);
  };

  const canContinue = emailVerified && phoneVerified;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ── Page Header with Icon Block ── */}
      <motion.div variants={fadeUp} className="mb-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
            Verify your identity
          </h1>
          <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">
            Quick verification to protect your account and earnings
          </p>
        </div>
      </motion.div>

      {/* ══════════ Single Card with 3 Sections ══════════ */}
      <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-8">

        {/* ── Section 1: Email Verification ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-semibold text-gray-800">Email Verification</span>
          </div>
          {emailVerified && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-forest-600 bg-forest-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., arjun@university.edu.in"
              disabled={emailVerified}
              className={cn(inputBase, "flex-1 disabled:opacity-50")}
            />
            {!emailVerified && (
              <button
                onClick={handleSendEmailCode}
                disabled={!email || emailCodeSent}
                className={cn(
                  "text-[12px] font-semibold px-5 py-3 rounded-xl transition-all shrink-0",
                  email && !emailCodeSent
                    ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                )}
              >
                {emailCodeSent ? "Sent" : "Send Code"}
              </button>
            )}
          </div>

          {/* Verification code row */}
          <AnimatePresence>
            {emailCodeSent && !emailVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    placeholder="e.g., 482951"
                    maxLength={6}
                    className={cn(inputBase, "flex-1 font-mono tracking-[0.2em]")}
                  />
                  <button
                    onClick={handleVerifyEmail}
                    disabled={emailCode.length < 4}
                    className={cn(
                      "text-[12px] font-semibold px-5 py-3 rounded-xl transition-all shrink-0",
                      emailCode.length >= 4
                        ? "text-white bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700"
                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                    )}
                  >
                    Verify
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  A 6-digit code has been sent to your email
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section 2: Phone Verification ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-semibold text-gray-800">Phone Verification</span>
          </div>
          {phoneVerified && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-forest-600 bg-forest-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex gap-2">
            <div className="relative shrink-0">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={phoneVerified}
                className={cn(
                  "appearance-none text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 pl-3.5 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all disabled:opacity-50"
                )}
              >
                {countryCodes.map((cc) => (
                  <option key={cc.code} value={cc.code}>{cc.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 9876543210"
              disabled={phoneVerified}
              className={cn(inputBase, "flex-1 disabled:opacity-50")}
            />
            {!phoneVerified && (
              <button
                onClick={handleSendPhoneCode}
                disabled={!phone || phoneCodeSent}
                className={cn(
                  "text-[12px] font-semibold px-5 py-3 rounded-xl transition-all shrink-0",
                  phone && !phoneCodeSent
                    ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                )}
              >
                {phoneCodeSent ? "Sent" : "Send SMS"}
              </button>
            )}
          </div>

          {/* SMS verification code row */}
          <AnimatePresence>
            {phoneCodeSent && !phoneVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    placeholder="e.g., 482951"
                    maxLength={6}
                    className={cn(inputBase, "flex-1 font-mono tracking-[0.2em]")}
                  />
                  <button
                    onClick={handleVerifyPhone}
                    disabled={phoneCode.length < 4}
                    className={cn(
                      "text-[12px] font-semibold px-5 py-3 rounded-xl transition-all shrink-0",
                      phoneCode.length >= 4
                        ? "text-white bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700"
                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                    )}
                  >
                    Verify
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  A 6-digit code has been sent via SMS
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section 3: Government ID ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <div className="flex items-center gap-2.5">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-semibold text-gray-800">Government ID</span>
            <span className="text-[11px] text-gray-400">(optional)</span>
          </div>
          {idFile && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-forest-600 bg-forest-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
            </span>
          )}
        </div>
        <div className="px-5 py-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl px-5 py-6 text-center transition-all cursor-pointer",
              dragActive
                ? "border-brown-400 bg-brown-50/30"
                : idFile
                  ? "border-forest-300 bg-forest-50/20"
                  : "border-gray-200 bg-gray-50/30 hover:border-gray-300"
            )}
          >
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {idFile ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-forest-500 shrink-0" />
                <div className="text-left">
                  <span className="text-[13px] font-medium text-gray-700 block">{idFile.name}</span>
                  <span className="text-[11px] text-gray-400">{(idFile.size / 1024).toFixed(0)} KB — click or drag to replace</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-5 h-5 text-gray-300" />
                <span className="text-[12px] text-gray-500">
                  Drop your ID here or <span className="text-brown-500 font-medium">browse</span>
                </span>
                <span className="text-[11px] text-gray-400">PNG, JPG, PDF up to 10MB</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══════════ Navigation ══════════ */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mt-5">
        <Link
          href="/onboarding"
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <button
          onClick={() => canContinue && router.push("/onboarding/consent")}
          disabled={!canContinue}
          className={cn(
            "flex items-center gap-1.5 text-[12px] font-medium px-6 py-2.5 rounded-xl transition-all",
            canContinue
              ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
              : "text-gray-400 bg-gray-100 cursor-not-allowed"
          )}
        >
          Continue <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
