"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Briefcase, Shield, ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui";

import { useRegistration } from "./hooks/useRegistration";
import { StepProgress } from "./components/StepProgress";
import { Step1Identity } from "./components/Step1Identity";
import { Step2Verification } from "./components/Step2Verification";
import { Step3Profile } from "./components/Step3Profile";
import { Step4Consent } from "./components/Step4Consent";
import { ReviewPreviewModal } from "./components/ReviewPreviewModal";
import type { RegistrationRole } from "./types";

function RoleBar({
  role,
  onChange,
}: {
  role: Exclude<RegistrationRole, "">;
  onChange: () => void;
}) {
  const config = {
    contributor: { label: "Contributor Account", Icon: Sparkles, color: "bg-teal-500" },
    enterprise:  { label: "Enterprise Account", Icon: Briefcase, color: "bg-brown-500" },
    reviewer:    { label: "Reviewer Account", Icon: Shield, color: "bg-forest-500" },
  } as const;
  const { label, Icon, color } = config[role];

  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-brown-950">{label}</span>
        {role === "contributor" && <CheckCircle className="w-3.5 h-3.5 text-teal-500" />}
      </div>
      <button
        type="button"
        onClick={onChange}
        className="flex items-center gap-1 text-xs text-beige-500 hover:text-brown-700 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Change
      </button>
    </div>
  );
}

function InviteOnlyCard({ role }: { role: "enterprise" | "reviewer" }) {
  const config = {
    enterprise: {
      Icon: Mail,
      gradient: "from-brown-500 to-brown-700",
      shadow: "shadow-brown-200",
      body: "Enterprise accounts are provisioned by a GlimmoraTeam Admin and created via a secure email invitation. Please check your inbox for your account creation link.",
    },
    reviewer: {
      Icon: Shield,
      gradient: "from-forest-500 to-forest-700",
      shadow: "shadow-forest-200",
      body: "Reviewer accounts are assigned by a GlimmoraTeam Admin and created via a secure email invitation. Please check your inbox for your account creation link.",
    },
  };
  const { Icon, gradient, shadow, body } = config[role];

  return (
    <GlassCard variant="heavy" padding="lg" className="mb-4">
      <GlassCardContent>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg ${shadow}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-brown-950 mb-1">Invitation Required</p>
            <p className="text-sm text-beige-600 leading-relaxed">{body}</p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-beige-100">
              <span className="text-xs text-beige-500">No invitation?</span>
              <Link href="/auth/login" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                Contact your Administrator
              </Link>
            </div>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

export default function ContributorRegisterPage() {
  const router = useRouter();
  const reg = useRegistration();

  const resetToRolePicker = () => {
    reg.setRegistrationRole("");
    reg.setStep(1);
    reg.setError("");
  };

  return (
    <div className="w-full max-w-xl py-8">
      <div className="text-center mb-7">
        <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-brown-950 group-hover:text-brown-700 transition-colors">
            GlimmoraTeam
          </span>
        </Link>
        <h1 className="font-heading text-2xl font-bold text-brown-950">Create Your Account</h1>
        <p className="text-sm text-beige-500 mt-1">Join the Global Workforce Intelligence Platform</p>
      </div>

      {!reg.registrationRole && (
        <>
          <GlassCard variant="heavy" padding="lg" className="mb-4">
            <GlassCardContent>
              <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest mb-3">
                Select account type
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { label: "Contributor", sub: "Find tasks & earn", Icon: Sparkles, hover: "hover:border-teal-300", action: () => { reg.setRegistrationRole("contributor"); reg.setStep(1); reg.setError(""); } },
                  { label: "Enterprise", sub: "Hire & manage teams", Icon: Briefcase, hover: "hover:border-brown-300", action: () => router.push("/auth/register/enterprise") },
                  { label: "Reviewer", sub: "Review & earn", Icon: Shield, hover: "hover:border-forest-300", action: () => { reg.setRegistrationRole("reviewer"); reg.setError(""); } },
                ] as const).map(({ label, sub, Icon, hover, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-beige-200 ${hover} bg-white transition-all text-center`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-beige-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-beige-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brown-900">{label}</p>
                      <p className="text-[10px] text-beige-400 mt-1 leading-tight">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
          <p className="text-center text-sm text-beige-600 mb-2">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-teal-600 hover:text-teal-700 font-medium">Sign in</Link>
          </p>
        </>
      )}

      {(reg.registrationRole === "enterprise" || reg.registrationRole === "reviewer") && (
        <>
          <RoleBar role={reg.registrationRole} onChange={resetToRolePicker} />
          <div className="mt-4">
            <InviteOnlyCard role={reg.registrationRole} />
          </div>
        </>
      )}

      {reg.registrationRole === "contributor" && (
        <div className="space-y-4 pb-2">
          <RoleBar role="contributor" onChange={resetToRolePicker} />

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-teal-800">Welcome to GlimmoraTeam</p>
              <p className="text-xs text-teal-700 mt-0.5 leading-relaxed">
                AI-matched tasks - global earnings - verified portfolio - set up in 4 quick steps.
              </p>
            </div>
          </div>

          <StepProgress step={reg.step} />

          {reg.step === 1 && (
            <Step1Identity
              firstName={reg.firstName} setFirstName={reg.setFirstName}
              lastName={reg.lastName} setLastName={reg.setLastName}
              email={reg.email} setEmail={reg.setEmail}
              password={reg.password} setPassword={reg.setPassword}
              confirm={reg.confirm} setConfirm={reg.setConfirm}
              showPw={reg.showPw} setShowPw={reg.setShowPw}
              showCon={reg.showCon} setShowCon={reg.setShowCon}
              contribType={reg.contribType} setContribType={reg.setContribType}
              country={reg.country} setCountry={reg.setCountry}
              passwordStrength={reg.passwordStrength}
              error={reg.error}
              onContinue={reg.goToStep2}
            />
          )}

          {reg.step === 2 && (
            <Step3Profile
              contribType={reg.contribType}
              dob={reg.dob} setDob={reg.setDob}
              timezone={reg.timezone} setTimezone={reg.setTimezone}
              departmentCategory={reg.departmentCategory} setDepartmentCategory={reg.setDepartmentCategory}
              departmentOther={reg.departmentOther} setDepartmentOther={reg.setDepartmentOther}
              availability={reg.availability} setAvailability={reg.setAvailability}
              degree={reg.degree} setDegree={reg.setDegree}
              branch={reg.branch} setBranch={reg.setBranch}
              linkedin={reg.linkedin} setLinkedin={reg.setLinkedin}
              mentorAck={reg.mentorAck} setMentorAck={reg.setMentorAck}
              primarySkills={reg.primarySkills}
              skillInput={reg.skillInput} setSkillInput={reg.setSkillInput}
              addPrimarySkill={reg.addPrimarySkill} removePrimarySkill={reg.removePrimarySkill}
              secondarySkills={reg.secondarySkills}
              secondarySkillInput={reg.secondarySkillInput} setSecondarySkillInput={reg.setSecondarySkillInput}
              addSecondarySkill={reg.addSecondarySkill} removeSecondarySkill={reg.removeSecondarySkill}
              otherSkills={reg.otherSkills}
              otherSkillInput={reg.otherSkillInput} setOtherSkillInput={reg.setOtherSkillInput}
              addOtherSkill={reg.addOtherSkill} removeOtherSkill={reg.removeOtherSkill}
              workStart={reg.workStart} setWorkStart={reg.setWorkStart}
              workEnd={reg.workEnd} setWorkEnd={reg.setWorkEnd}
              careerStage={reg.careerStage} setCareerStage={reg.setCareerStage}
              yearsExperience={reg.yearsExperience} setYearsExperience={reg.setYearsExperience}
              error={reg.error}
              onContinue={reg.goToStep3}
              onBack={() => { reg.setStep(1); reg.setError(""); }}
            />
          )}

          {reg.step === 3 && (
            <Step2Verification
              phoneCountry={reg.phoneCountry} setPhoneCountry={reg.setPhoneCountry}
              phone={reg.phone} setPhone={reg.setPhone}
              otpSent={reg.otpSent}
              otp={reg.otp} setOtp={reg.setOtp}
              cooldown={reg.cooldown}
              phoneVerified={reg.phoneVerified}
              phoneOtpLoading={reg.phoneOtpLoading}
              verificationEmail={reg.verificationEmail} setVerificationEmail={reg.setVerificationEmail}
              emailOtpSent={reg.emailOtpSent}
              emailOtp={reg.emailOtp} setEmailOtp={reg.setEmailOtp}
              emailCooldown={reg.emailCooldown}
              emailVerified={reg.emailVerified}
              emailOtpLoading={reg.emailOtpLoading}
              error={reg.error}
              onSendOTP={reg.sendOTP}
              onVerifyOTP={reg.verifyOTP}
              onSendEmailOTP={reg.sendEmailOTP}
              onVerifyEmailOTP={reg.verifyEmailOTP}
              onContinue={reg.goToStep4}
              onBack={() => { reg.setStep(2); reg.setError(""); }}
            />
          )}

          {reg.step === 4 && (
            <Step4Consent
              resumeFile={reg.resumeFile} setResumeFile={reg.setResumeFile}
              resumeDrag={reg.resumeDrag} setResumeDrag={reg.setResumeDrag}
              acceptTos={reg.acceptTos} setAcceptTos={reg.setAcceptTos}
              acceptCoc={reg.acceptCoc} setAcceptCoc={reg.setAcceptCoc}
              acceptPrivacy={reg.acceptPrivacy} setAcceptPrivacy={reg.setAcceptPrivacy}
              acceptFee={reg.acceptFee} setAcceptFee={reg.setAcceptFee}
              acceptAhp={reg.acceptAhp} setAcceptAhp={reg.setAcceptAhp}
              marketingOptIn={reg.marketingOptIn} setMarketingOptIn={reg.setMarketingOptIn}
              isLoading={reg.isLoading}
              error={reg.error}
              onPreview={() => reg.setPreviewOpen(true)}
              onSubmit={reg.handleFinalSubmit}
              onBack={() => { reg.setStep(3); reg.setError(""); }}
            />
          )}
        </div>
      )}

      {reg.previewOpen && (
        <ReviewPreviewModal
          onClose={() => reg.setPreviewOpen(false)}
          onEditStep={step => { reg.setStep(step); reg.setError(""); }}
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
    </div>
  );
}
