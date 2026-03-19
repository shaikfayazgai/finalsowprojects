"use client";

import { Briefcase, Sparkles } from "lucide-react";

import { useOnboardingWizard } from "../hooks/useOnboardingWizard";
import { OnboardingStepProgress } from "./OnboardingStepProgress";
import { WelcomeScreen } from "./WelcomeScreen";
import { Step1CompanyVerification } from "./Step1CompanyVerification";
import { Step2BillingLegal } from "./Step2BillingLegal";
import { Step3TeamSetup } from "./Step3TeamSetup";
import { Step4UploadSOW } from "./Step4UploadSOW";

export default function OnboardingModal() {
  const wiz = useOnboardingWizard();

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-beige-200 shadow-[0_24px_80px_rgba(0,0,0,0.12),0_8px_32px_rgba(0,0,0,0.08)] mx-4">
        {/* Fixed Header */}
        <div className="shrink-0 px-8 pt-8 pb-4 border-b border-beige-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-semibold text-brown-950">
                GlimmoraTeam
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brown-600 ring-2 ring-brown-200 flex items-center justify-center shadow-sm">
                <Briefcase className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-brown-950">Enterprise Onboarding</span>
            </div>
          </div>

          {wiz.step > 0 && <OnboardingStepProgress step={wiz.step} />}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {wiz.step === 0 ? (
            <WelcomeScreen onBegin={wiz.goToStep1} />
          ) : (
            <div className="space-y-4">
              {wiz.step === 1 && (
                <Step1CompanyVerification
                  companyName={wiz.companyName}
                  countryOfIncorporation={wiz.countryOfIncorporation}
                  incorporationFile={wiz.incorporationFile} setIncorporationFile={wiz.setIncorporationFile}
                  incorporationDrag={wiz.incorporationDrag} setIncorporationDrag={wiz.setIncorporationDrag}
                  taxId={wiz.taxId} setTaxId={wiz.setTaxId}
                  taxIdConfig={wiz.taxIdConfig}
                  addressLine1={wiz.addressLine1} setAddressLine1={wiz.setAddressLine1}
                  addressLine2={wiz.addressLine2} setAddressLine2={wiz.setAddressLine2}
                  city={wiz.city} setCity={wiz.setCity}
                  stateProvince={wiz.stateProvince} setStateProvince={wiz.setStateProvince}
                  postalCode={wiz.postalCode} setPostalCode={wiz.setPostalCode}
                  verificationStatus={wiz.verificationStatus}
                  error={wiz.error}
                  onContinue={wiz.goToStep2}
                />
              )}

              {wiz.step === 2 && (
                <Step2BillingLegal
                  billingCurrency={wiz.billingCurrency} setBillingCurrency={wiz.setBillingCurrency}
                  billingContactEmail={wiz.billingContactEmail} setBillingContactEmail={wiz.setBillingContactEmail}
                  billingContactName={wiz.billingContactName} setBillingContactName={wiz.setBillingContactName}
                  ndaFile={wiz.ndaFile} setNdaFile={wiz.setNdaFile}
                  ndaDrag={wiz.ndaDrag} setNdaDrag={wiz.setNdaDrag}
                  acceptTos={wiz.acceptTos} setAcceptTos={wiz.setAcceptTos}
                  acceptDpa={wiz.acceptDpa} setAcceptDpa={wiz.setAcceptDpa}
                  esigOtpSent={wiz.esigOtpSent}
                  esigOtp={wiz.esigOtp} setEsigOtp={wiz.setEsigOtp}
                  esigCooldown={wiz.esigCooldown}
                  esigVerified={wiz.esigVerified}
                  esigOtpLoading={wiz.esigOtpLoading}
                  onSendOTP={wiz.sendEsigOTP}
                  onVerifyOTP={wiz.verifyEsigOTP}
                  error={wiz.error}
                  onContinue={wiz.goToStep3}
                  onBack={() => { wiz.setStep(1); wiz.setError(""); }}
                />
              )}

              {wiz.step === 3 && (
                <Step3TeamSetup
                  teamInvites={wiz.teamInvites}
                  addInviteRow={wiz.addInviteRow}
                  removeInviteRow={wiz.removeInviteRow}
                  updateInvite={wiz.updateInvite}
                  error={wiz.error}
                  onContinue={wiz.goToStep4}
                  onSkip={wiz.skipStep3}
                  onBack={() => { wiz.setStep(2); wiz.setError(""); }}
                />
              )}

              {wiz.step === 4 && (
                <Step4UploadSOW
                  sowFile={wiz.sowFile} setSowFile={wiz.setSowFile}
                  sowDrag={wiz.sowDrag} setSowDrag={wiz.setSowDrag}
                  projectTitle={wiz.projectTitle} setProjectTitle={wiz.setProjectTitle}
                  isLoading={wiz.isLoading}
                  error={wiz.error}
                  onComplete={wiz.handleComplete}
                  onSkip={wiz.skipStep4}
                  onBack={() => { wiz.setStep(3); wiz.setError(""); }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
