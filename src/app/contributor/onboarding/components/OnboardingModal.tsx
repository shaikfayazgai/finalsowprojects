"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Sparkles, Shield } from "lucide-react";

import { useContributorOnboarding } from "../hooks/useContributorOnboarding";
import { ReviewPreviewModal } from "@/app/auth/register/components/ReviewPreviewModal";

import { WelcomeScreen } from "./WelcomeScreen";
import { Step1Identity } from "./Step1Identity";
import { Step2Profile } from "./Step2Profile";
import { Step3Verification } from "./Step3Verification";
import { Step4Consent } from "./Step4Consent";

const STEPS = [
  { n: 1, title: "Identity",     sub: "Basic info & role" },
  { n: 2, title: "Profile",      sub: "Skills & availability" },
  { n: 3, title: "Verification", sub: "NDA & contact" },
  { n: 4, title: "Consent",      sub: "Resume & agreements" },
];

function SidebarStep({ step, current }: { step: typeof STEPS[0]; current: number }) {
  const done   = current > step.n;
  const active = current === step.n;
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-300
        ${done   ? "bg-teal-500 text-white" :
          active ? "bg-white text-brown-950 shadow-md" :
                   "border-2 border-white/20 text-white/30"}`}
      >
        {done ? <CheckCircle className="w-4 h-4" /> : step.n}
      </div>
      <div className="pt-1">
        <p className={`text-sm font-semibold leading-none transition-colors ${active ? "text-white" : done ? "text-white/60" : "text-white/30"}`}>
          {step.title}
        </p>
        <p className={`text-xs mt-1 transition-colors ${active ? "text-white/60" : "text-white/25"}`}>
          {step.sub}
        </p>
      </div>
    </div>
  );
}

export default function OnboardingModal() {
  const ob = useContributorOnboarding();
  const [started, setStarted] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [ob.step, started]);

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          className="w-full max-w-5xl max-h-[92vh] flex rounded-2xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── Sidebar ── */}
          <div className="w-64 shrink-0 bg-brown-950 flex flex-col p-7 overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white">GlimmoraTeam</span>
            </div>

            {started ? (
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-5">
                  Setup Progress
                </p>
                <div className="space-y-0">
                  {STEPS.map((s, i) => (
                    <div key={s.n}>
                      <SidebarStep step={s} current={ob.step} />
                      {i < STEPS.length - 1 && (
                        <div className={`ml-4 w-px h-7 my-0.5 transition-colors duration-300 ${ob.step > s.n ? "bg-teal-500/50" : "bg-white/10"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Signed in as
                </p>
                {mounted && ob.ssoImage ? (
                  <img src={ob.ssoImage} alt="" className="w-12 h-12 rounded-full ring-2 ring-white/20 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-white/60">
                      {ob.firstName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{ob.firstName} {ob.lastName}</p>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{ob.email}</p>
                </div>
                <div className="space-y-1 mt-2">
                  {STEPS.map((s) => (
                    <div key={s.n} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-white/30 font-bold">{s.n}</span>
                      </div>
                      <span className="text-xs text-white/30">{s.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-white/35 text-xs">
                <Shield className="w-3 h-3 shrink-0" />
                <span>256-bit SSL encryption</span>
              </div>
              <div className="flex items-center gap-2 text-white/35 text-xs">
                <CheckCircle className="w-3 h-3 shrink-0" />
                <span>Secure profile storage</span>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div ref={contentRef} className="flex-1 bg-white overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={started ? `step-${ob.step}` : "welcome"}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="min-h-full p-10"
              >
                {!started && (
                  <WelcomeScreen
                    firstName={ob.firstName}
                    lastName={ob.lastName}
                    email={ob.email}
                    image={ob.ssoImage}
                    provider={ob.ssoProvider}
                    onBegin={() => setStarted(true)}
                  />
                )}

                {started && ob.step === 1 && (
                  <Step1Identity
                    firstName={ob.firstName}     setFirstName={ob.setFirstName}
                    lastName={ob.lastName}       setLastName={ob.setLastName}
                    email={ob.email}             setEmail={ob.setEmail}
                    contribType={ob.contribType} setContribType={ob.setContribType}
                    country={ob.country}         setCountry={ob.setCountry}
                    image={ob.ssoImage}
                    error={ob.error}
                    onContinue={ob.goToStep2}
                    ssoProvider={ob.ssoProvider}
                  />
                )}

                {started && ob.step === 2 && (
                  <Step2Profile
                    contribType={ob.contribType}
                    dob={ob.dob}                             setDob={ob.setDob}
                    timezone={ob.timezone}                   setTimezone={ob.setTimezone}
                    departmentCategory={ob.departmentCategory} setDepartmentCategory={ob.setDepartmentCategory}
                    departmentOther={ob.departmentOther}     setDepartmentOther={ob.setDepartmentOther}
                    availability={ob.availability}           setAvailability={ob.setAvailability}
                    degree={ob.degree}                       setDegree={ob.setDegree}
                    branch={ob.branch}                       setBranch={ob.setBranch}
                    linkedin={ob.linkedin}                   setLinkedin={ob.setLinkedin}
                    primarySkills={ob.primarySkills}
                    skillInput={ob.skillInput}               setSkillInput={ob.setSkillInput}
                    addPrimarySkill={ob.addPrimarySkill}     removePrimarySkill={ob.removePrimarySkill}
                    secondarySkills={ob.secondarySkills}
                    secondarySkillInput={ob.secondarySkillInput} setSecondarySkillInput={ob.setSecondarySkillInput}
                    addSecondarySkill={ob.addSecondarySkill} removeSecondarySkill={ob.removeSecondarySkill}
                    otherSkills={ob.otherSkills}
                    otherSkillInput={ob.otherSkillInput}     setOtherSkillInput={ob.setOtherSkillInput}
                    addOtherSkill={ob.addOtherSkill}         removeOtherSkill={ob.removeOtherSkill}
                    workStart={ob.workStart}                 setWorkStart={ob.setWorkStart}
                    workEnd={ob.workEnd}                     setWorkEnd={ob.setWorkEnd}
                    careerStage={ob.careerStage}             setCareerStage={ob.setCareerStage}
                    yearsExperience={ob.yearsExperience}     setYearsExperience={ob.setYearsExperience}
                    error={ob.error}
                    onContinue={ob.goToStep3}
                    onBack={() => { ob.setStep(1); ob.setError(""); }}
                  />
                )}

                {started && ob.step === 3 && (
                  <Step3Verification
                    registrationEmail={ob.email}
                    setEmail={ob.setEmail}
                    phoneCountry={ob.phoneCountry}           setPhoneCountry={ob.setPhoneCountry}
                    phone={ob.phone}                         setPhone={ob.setPhone}
                    otpSent={ob.otpSent}
                    otp={ob.otp}                             setOtp={ob.setOtp}
                    cooldown={ob.cooldown}
                    phoneVerified={ob.phoneVerified}
                    phoneOtpLoading={ob.phoneOtpLoading}
                    verificationEmail={ob.verificationEmail} setVerificationEmail={ob.setVerificationEmail}
                    emailOtpSent={ob.emailOtpSent}
                    emailOtp={ob.emailOtp}                   setEmailOtp={ob.setEmailOtp}
                    emailCooldown={ob.emailCooldown}
                    emailVerified={ob.emailVerified}
                    emailOtpLoading={ob.emailOtpLoading}
                    ndaAccepted={ob.ndaAccepted}             setNdaAccepted={ob.setNdaAccepted}
                    ndaSignature={ob.ndaSignature}           setNdaSignature={ob.setNdaSignature}
                    ndaSignedFile={ob.ndaSignedFile}         setNdaSignedFile={ob.setNdaSignedFile}
                    error={ob.error}
                    onSendOTP={ob.sendOTP}
                    onVerifyOTP={ob.verifyOTP}
                    onSendEmailOTP={ob.sendEmailOTP}
                    onVerifyEmailOTP={ob.verifyEmailOTP}
                    onContinue={ob.goToStep4}
                    onBack={() => { ob.setStep(2); ob.setError(""); }}
                  />
                )}

                {started && ob.step === 4 && (
                  <Step4Consent
                    resumeFile={ob.resumeFile}         setResumeFile={ob.setResumeFile}
                    resumeDrag={ob.resumeDrag}         setResumeDrag={ob.setResumeDrag}
                    acceptTos={ob.acceptTos}           setAcceptTos={ob.setAcceptTos}
                    acceptCoc={ob.acceptCoc}           setAcceptCoc={ob.setAcceptCoc}
                    acceptPrivacy={ob.acceptPrivacy}   setAcceptPrivacy={ob.setAcceptPrivacy}
                    acceptFee={ob.acceptFee}           setAcceptFee={ob.setAcceptFee}
                    acceptAhp={ob.acceptAhp}           setAcceptAhp={ob.setAcceptAhp}
                    marketingOptIn={ob.marketingOptIn} setMarketingOptIn={ob.setMarketingOptIn}
                    isLoading={ob.isLoading}
                    error={ob.error}
                    onPreview={() => ob.setPreviewOpen(true)}
                    onSubmit={ob.handleSubmit}
                    onBack={() => { ob.setStep(3); ob.setError(""); }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {ob.previewOpen && (
        <ReviewPreviewModal
          onClose={() => ob.setPreviewOpen(false)}
          onEditStep={(step) => { ob.setStep(step); ob.setError(""); }}
          firstName={ob.firstName}
          lastName={ob.lastName}
          email={ob.email}
          contribType={ob.contribType}
          dob={ob.dob}
          country={ob.country}
          phone={ob.phone}
          verificationEmail={ob.verificationEmail}
          timezone={ob.timezone}
          departmentCategory={ob.departmentCategory}
          departmentOther={ob.departmentOther}
          degree={ob.degree}
          branch={ob.branch}
          availability={ob.availability}
          linkedin={ob.linkedin}
          primarySkills={ob.primarySkills}
          secondarySkills={ob.secondarySkills}
          otherSkills={ob.otherSkills}
          yearsExperience={ob.yearsExperience}
          careerStage={ob.careerStage}
          workStart={ob.workStart}
          workEnd={ob.workEnd}
        />
      )}
    </>
  );
}
