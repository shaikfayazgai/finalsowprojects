"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useEnterpriseRegistration } from "./hooks/useEnterpriseRegistration";
import { EnterpriseStepProgress } from "./components/EnterpriseStepProgress";
import { Step1Organization } from "./components/Step1Organization";
import { Step2AdminContact } from "./components/Step2AdminContact";
import { Step3Security } from "./components/Step3Security";
import { Step4Agreements } from "./components/Step4Agreements";

const stepAnim = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

export default function EnterpriseRegisterPage() {
  const reg = useEnterpriseRegistration();

  return (
    <div className="w-full max-w-[750px] mx-auto py-8 px-4">

      {/* ── Page title + badge ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-[22px] font-bold text-brown-950">Register your organisation</h1>
          <p className="text-sm text-beige-500 mt-1">4 quick steps to get started</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brown-100 border border-brown-200 shrink-0">
          <Briefcase className="w-3.5 h-3.5 text-brown-600" />
          <span className="text-xs font-semibold text-brown-700">Enterprise Account</span>
        </div>
      </div>

      {/* ── Step progress ── */}
      <div className="mb-6">
        <EnterpriseStepProgress step={reg.step} />
      </div>

      <AnimatePresence mode="wait">
        {reg.step === 1 && (
          <motion.div key="step-1" {...stepAnim}>
            <Step1Organization
              orgName={reg.orgName}
              setOrgName={reg.setOrgName}
              orgType={reg.orgType}
              setOrgType={reg.setOrgType}
              orgTypeOther={reg.orgTypeOther}
              setOrgTypeOther={reg.setOrgTypeOther}
              industry={reg.industry}
              setIndustry={reg.setIndustry}
              industryOther={reg.industryOther}
              setIndustryOther={reg.setIndustryOther}
              companySize={reg.companySize}
              setCompanySize={reg.setCompanySize}
              website={reg.website}
              setWebsite={reg.setWebsite}
              incorporationCountry={reg.incorporationCountry}
              setIncorporationCountry={reg.setIncorporationCountry}
              incorporationFile={reg.incorporationFile}
              setIncorporationFile={reg.setIncorporationFile}
              incorporationDrag={reg.incorporationDrag}
              setIncorporationDrag={reg.setIncorporationDrag}
              error={reg.error}
              onContinue={reg.goToStep2}
            />
          </motion.div>
        )}

        {reg.step === 2 && (
          <motion.div key="step-2" {...stepAnim}>
            <Step2AdminContact
              adminFirstName={reg.adminFirstName}
              setAdminFirstName={reg.setAdminFirstName}
              adminLastName={reg.adminLastName}
              setAdminLastName={reg.setAdminLastName}
              adminTitle={reg.adminTitle}
              setAdminTitle={reg.setAdminTitle}
              adminEmail={reg.adminEmail}
              setAdminEmail={reg.setAdminEmail}
              adminDept={reg.adminDept}
              setAdminDept={reg.setAdminDept}
              phoneCountry={reg.phoneCountry}
              setPhoneCountry={reg.setPhoneCountry}
              phone={reg.phone}
              setPhone={reg.setPhone}
              error={reg.error}
              onContinue={reg.goToStep3}
              onBack={() => { reg.setStep(1); reg.setError(""); }}
            />
          </motion.div>
        )}

        {reg.step === 3 && (
          <motion.div key="step-3" {...stepAnim}>
            <Step3Security
              password={reg.password}
              setPassword={reg.setPassword}
              confirm={reg.confirm}
              setConfirm={reg.setConfirm}
              phoneCountry={reg.phoneCountry}
              setPhoneCountry={reg.setPhoneCountry}
              phone={reg.phone}
              setPhone={reg.setPhone}
              otpSent={reg.otpSent}
              otp={reg.otp}
              setOtp={reg.setOtp}
              cooldown={reg.cooldown}
              phoneVerified={reg.phoneVerified}
              phoneOtpLoading={reg.phoneOtpLoading}
              phoneOtpDevHint={reg.phoneOtpDevHint}
              adminEmail={reg.adminEmail}
              setAdminEmail={reg.setAdminEmail}
              initialAdminEmail={reg.initialAdminEmail}
              emailOtpSent={reg.emailOtpSent}
              emailOtp={reg.emailOtp}
              setEmailOtp={reg.setEmailOtp}
              emailCooldown={reg.emailCooldown}
              emailVerified={reg.emailVerified}
              emailOtpLoading={reg.emailOtpLoading}
              emailOtpDevHint={reg.emailOtpDevHint}
              error={reg.error}
              onSendOTP={reg.sendOTP}
              onVerifyOTP={reg.verifyOTP}
              onSendEmailOTP={reg.sendEmailOTP}
              onVerifyEmailOTP={reg.verifyEmailOTP}
              onContinue={reg.goToStep4}
              onBack={() => { reg.setStep(2); reg.setError(""); }}
            />
          </motion.div>
        )}

        {reg.step === 4 && (
          <motion.div key="step-4" {...stepAnim}>
            <Step4Agreements
              acceptTos={reg.acceptTos}
              setAcceptTos={reg.setAcceptTos}
              acceptPp={reg.acceptPp}
              setAcceptPp={reg.setAcceptPp}
              acceptEsa={reg.acceptEsa}
              setAcceptEsa={reg.setAcceptEsa}
              acceptAhp={reg.acceptAhp}
              setAcceptAhp={reg.setAcceptAhp}
              marketingOptIn={reg.marketingOptIn}
              setMarketingOptIn={reg.setMarketingOptIn}
              isLoading={reg.isLoading}
              error={reg.error}
              onSubmit={reg.handleFinalSubmit}
              onBack={() => { reg.setStep(3); reg.setError(""); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-sm text-beige-600 mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-teal-600 hover:text-teal-700 font-medium">
          Sign in
        </Link>
        {" · "}
        <Link href="/auth/register" className="text-teal-600 hover:text-teal-700 font-medium">
          Not an enterprise?
        </Link>
      </p>
    </div>
  );
}
