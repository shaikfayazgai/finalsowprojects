"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { CheckCircle, Sparkles, Shield } from "lucide-react";

import { useRegistration } from "@/app/auth/register/hooks/useRegistration";
import { onboardContributor } from "@/lib/actions/register";
import { ReviewPreviewModal } from "@/app/auth/register/components/ReviewPreviewModal";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { SSOData } from "@/app/auth/register/types";

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

function getSsoDataFromStorage(): SSOData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("sso_data");
    if (!raw) return null;
    return JSON.parse(raw) as SSOData;
  } catch { return null; }
}

export default function OnboardingModal() {
  const { data: session } = useSession();

  const [ssoData] = React.useState<SSOData | null>(() => getSsoDataFromStorage());

  const reg = useRegistration(ssoData);
  const [started, setStarted] = React.useState(false);

  // Sync from session once it loads (covers SSO users with no sessionStorage data)
  const synced = React.useRef(false);
  React.useEffect(() => {
    if (synced.current) return;
    const user = session?.user as { name?: string; email?: string; image?: string; provider?: string } | undefined;
    if (!user?.email) return;
    synced.current = true;
    const [first = "", last = ""] = (user.name ?? "").split(" ");
    if (!reg.firstName && first) reg.setFirstName(first);
    if (!reg.lastName && last) reg.setLastName(last);
    if (!reg.email && user.email) reg.setEmail(user.email);
  }, [session, reg]);

  // Derive SSO image and provider from session
  const ssoImage = ssoData?.image ?? (session?.user as { image?: string } | undefined)?.image ?? undefined;
  const ssoProvider = ssoData?.provider ?? ((session?.user as { provider?: string } | undefined)?.provider as SSOData["provider"] | undefined) ?? null;
  const { setOnboardingComplete } = useAuthStore.getState();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [reg.step, started]);

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reg.acceptTos || !reg.acceptCoc || !reg.acceptPrivacy || !reg.acceptAhp || !reg.acceptFee) {
      reg.setError("Please accept all required agreements");
      return;
    }
    reg.setError("");

    try {
      const result = await onboardContributor({
        firstName: reg.firstName,
        lastName: reg.lastName || undefined,
        email: reg.email,
        contribType: reg.contribType,
        country: reg.country,
        dob: reg.dob,
        timezone: reg.timezone,
        departmentCategory: reg.departmentCategory,
        departmentOther: reg.departmentCategory === "other" ? reg.departmentOther : undefined,
        primarySkills: reg.primarySkills,
        secondarySkills: reg.secondarySkills,
        otherSkills: reg.otherSkills,
        availability: reg.availability,
        degree: reg.degree || undefined,
        branch: reg.branch || undefined,
        linkedin: reg.linkedin || undefined,
        careerStage: reg.careerStage || undefined,
        yearsExperience: reg.yearsExperience || undefined,
        workStart: reg.workStart || undefined,
        workEnd: reg.workEnd || undefined,
        phone: reg.phone || undefined,
        ndaAccepted: reg.ndaAccepted,
        ndaSignature: reg.ndaSignature || undefined,
        acceptTos: reg.acceptTos,
        acceptCoc: reg.acceptCoc,
        acceptPrivacy: reg.acceptPrivacy,
        acceptFee: reg.acceptFee,
        acceptAhp: reg.acceptAhp,
        marketingOptIn: reg.marketingOptIn,
      });

      if (!result.success) {
        reg.setError(result.error);
        return;
      }
      setOnboardingComplete(true);
    } catch (err) {
      reg.setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }, [reg, setOnboardingComplete]);

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
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white">GlimmoraTeam</span>
            </div>

            {/* Steps — only show when inside the form */}
            {started ? (
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-5">
                  Setup Progress
                </p>
                <div className="space-y-0">
                  {STEPS.map((s, i) => (
                    <div key={s.n}>
                      <SidebarStep step={s} current={reg.step} />
                      {i < STEPS.length - 1 && (
                        <div className={`ml-4 w-px h-7 my-0.5 transition-colors duration-300 ${reg.step > s.n ? "bg-teal-500/50" : "bg-white/10"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Welcome state: show SSO avatar + name in sidebar */
              <div className="flex-1 flex flex-col gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Signed in as
                </p>
                {ssoImage ? (
                  <img src={ssoImage} alt="" className="w-12 h-12 rounded-full ring-2 ring-white/20 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-white/60">
                      {reg.firstName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{reg.firstName} {reg.lastName}</p>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{reg.email}</p>
                </div>
                <div className="space-y-1 mt-2">
                  {STEPS.map(s => (
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

            {/* Trust */}
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
                key={started ? `step-${reg.step}` : "welcome"}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="min-h-full p-10"
              >
                {/* Welcome screen */}
                {!started && (
                  <WelcomeScreen
                    firstName={reg.firstName}
                    lastName={reg.lastName}
                    email={reg.email}
                    image={ssoImage}
                    provider={ssoProvider}
                    onBegin={() => setStarted(true)}
                    // videoSrc="/videos/contributor-intro.mp4"
                  />
                )}

                {started && reg.step === 1 && (
                  <Step1Identity
                    firstName={reg.firstName}   setFirstName={reg.setFirstName}
                    lastName={reg.lastName}     setLastName={reg.setLastName}
                    email={reg.email}           setEmail={reg.setEmail}
                    contribType={reg.contribType} setContribType={reg.setContribType}
                    country={reg.country}       setCountry={reg.setCountry}
                    image={ssoImage}
                    error={reg.error}
                    onContinue={reg.goToStep2}
                    ssoProvider={ssoProvider}
                  />
                )}

                {started && reg.step === 2 && (
                  <Step2Profile
                    contribType={reg.contribType}
                    dob={reg.dob}                         setDob={reg.setDob}
                    timezone={reg.timezone}               setTimezone={reg.setTimezone}
                    departmentCategory={reg.departmentCategory} setDepartmentCategory={reg.setDepartmentCategory}
                    departmentOther={reg.departmentOther} setDepartmentOther={reg.setDepartmentOther}
                    availability={reg.availability}       setAvailability={reg.setAvailability}
                    degree={reg.degree}                   setDegree={reg.setDegree}
                    branch={reg.branch}                   setBranch={reg.setBranch}
                    linkedin={reg.linkedin}               setLinkedin={reg.setLinkedin}
                    primarySkills={reg.primarySkills}
                    skillInput={reg.skillInput}           setSkillInput={reg.setSkillInput}
                    addPrimarySkill={reg.addPrimarySkill} removePrimarySkill={reg.removePrimarySkill}
                    secondarySkills={reg.secondarySkills}
                    secondarySkillInput={reg.secondarySkillInput} setSecondarySkillInput={reg.setSecondarySkillInput}
                    addSecondarySkill={reg.addSecondarySkill}     removeSecondarySkill={reg.removeSecondarySkill}
                    otherSkills={reg.otherSkills}
                    otherSkillInput={reg.otherSkillInput} setOtherSkillInput={reg.setOtherSkillInput}
                    addOtherSkill={reg.addOtherSkill}     removeOtherSkill={reg.removeOtherSkill}
                    workStart={reg.workStart}             setWorkStart={reg.setWorkStart}
                    workEnd={reg.workEnd}                 setWorkEnd={reg.setWorkEnd}
                    careerStage={reg.careerStage}         setCareerStage={reg.setCareerStage}
                    yearsExperience={reg.yearsExperience} setYearsExperience={reg.setYearsExperience}
                    error={reg.error}
                    onContinue={reg.goToStep3}
                    onBack={() => { reg.setStep(1); reg.setError(""); }}
                  />
                )}

                {started && reg.step === 3 && (
                  <Step3Verification
                    registrationEmail={reg.email}
                    setEmail={reg.setEmail}
                    phoneCountry={reg.phoneCountry}       setPhoneCountry={reg.setPhoneCountry}
                    phone={reg.phone}                     setPhone={reg.setPhone}
                    otpSent={reg.otpSent}
                    otp={reg.otp}                         setOtp={reg.setOtp}
                    cooldown={reg.cooldown}
                    phoneVerified={reg.phoneVerified}
                    phoneOtpLoading={reg.phoneOtpLoading}
                    verificationEmail={reg.verificationEmail} setVerificationEmail={reg.setVerificationEmail}
                    emailOtpSent={reg.emailOtpSent}
                    emailOtp={reg.emailOtp}               setEmailOtp={reg.setEmailOtp}
                    emailCooldown={reg.emailCooldown}
                    emailVerified={reg.emailVerified}
                    emailOtpLoading={reg.emailOtpLoading}
                    ndaAccepted={reg.ndaAccepted}         setNdaAccepted={reg.setNdaAccepted}
                    ndaSignature={reg.ndaSignature}       setNdaSignature={reg.setNdaSignature}
                    ndaSignedFile={reg.ndaSignedFile}     setNdaSignedFile={reg.setNdaSignedFile}
                    error={reg.error}
                    onSendOTP={reg.sendOTP}
                    onVerifyOTP={reg.verifyOTP}
                    onSendEmailOTP={reg.sendEmailOTP}
                    onVerifyEmailOTP={reg.verifyEmailOTP}
                    onContinue={reg.goToStep4}
                    onBack={() => { reg.setStep(2); reg.setError(""); }}
                  />
                )}

                {started && reg.step === 4 && (
                  <Step4Consent
                    resumeFile={reg.resumeFile}     setResumeFile={reg.setResumeFile}
                    resumeDrag={reg.resumeDrag}     setResumeDrag={reg.setResumeDrag}
                    acceptTos={reg.acceptTos}       setAcceptTos={reg.setAcceptTos}
                    acceptCoc={reg.acceptCoc}       setAcceptCoc={reg.setAcceptCoc}
                    acceptPrivacy={reg.acceptPrivacy} setAcceptPrivacy={reg.setAcceptPrivacy}
                    acceptFee={reg.acceptFee}       setAcceptFee={reg.setAcceptFee}
                    acceptAhp={reg.acceptAhp}       setAcceptAhp={reg.setAcceptAhp}
                    marketingOptIn={reg.marketingOptIn} setMarketingOptIn={reg.setMarketingOptIn}
                    isLoading={reg.isLoading}
                    error={reg.error}
                    onPreview={() => reg.setPreviewOpen(true)}
                    onSubmit={handleSubmit}
                    onBack={() => { reg.setStep(3); reg.setError(""); }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {reg.previewOpen && (
        <ReviewPreviewModal
          onClose={() => reg.setPreviewOpen(false)}
          onEditStep={(step) => { reg.setStep(step); reg.setError(""); }}
          firstName={reg.firstName}
          lastName={reg.lastName}
          email={reg.email}
          contribType={reg.contribType}
          dob={reg.dob}
          country={reg.country}
          phone={reg.phone}
          verificationEmail={reg.verificationEmail}
          timezone={reg.timezone}
          departmentCategory={reg.departmentCategory}
          departmentOther={reg.departmentOther}
          degree={reg.degree}
          branch={reg.branch}
          availability={reg.availability}
          linkedin={reg.linkedin}
          primarySkills={reg.primarySkills}
          secondarySkills={reg.secondarySkills}
          otherSkills={reg.otherSkills}
          yearsExperience={reg.yearsExperience}
          careerStage={reg.careerStage}
          workStart={reg.workStart}
          workEnd={reg.workEnd}
        />
      )}
    </>
  );
}
