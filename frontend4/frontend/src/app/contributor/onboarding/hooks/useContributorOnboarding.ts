"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePricingConfig } from "@/lib/hooks/usePricingConfig";
import { useContributorTrack, useInvalidateContributorTrack } from "@/lib/hooks/use-contributor-track";
import { contribTypeToContributorType } from "@/lib/contributor/track";
import { readReferralContext } from "@/lib/referral/context";
import { onboardContributor } from "@/lib/actions/register";
import { COUNTRIES_DATA } from "@/app/auth/register/data";
import { getAgeFromDob } from "@/app/auth/register/helpers";
import type { ContributorType, SSOData } from "@/app/auth/register/types";

export type OnboardingStep = 1 | 2 | 3 | 4;

const SSO_STORAGE_KEY = "gt_sso_onboarding";

/* ─── Read SSO data: URL params first, sessionStorage fallback ─── */
function readSsoData(): SSOData | null {
  if (typeof window === "undefined") return null;

  // 1. URL params (fresh SSO redirect from auth.ts)
  const params  = new URLSearchParams(window.location.search);
  const email   = params.get("email");
  const provider = params.get("provider") as SSOData["provider"] | null;

  if (email && provider) {
    const data: SSOData = {
      firstName: params.get("firstName") ?? "",
      lastName:  params.get("lastName")  ?? "",
      email,
      provider,
      image: params.get("image") ?? undefined,
    };
    try { sessionStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
    return data;
  }

  // 2. sessionStorage (page refresh)
  try {
    const raw = sessionStorage.getItem(SSO_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SSOData;
  } catch { /* noop */ }

  return null;
}

export function useContributorOnboarding() {
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const invalidateTrack = useInvalidateContributorTrack();
  const { data: session } = useSession();
  const { data: trackStatus } = useContributorTrack();

  /* ─── SSO data: URL params → sessionStorage → session (fallback chain) ─── */
  const [ssoData]   = useState<SSOData | null>(() => readSsoData());
  const ssoProvider = (ssoData?.provider ?? (session?.user as { provider?: string } | undefined)?.provider ?? null) as SSOData["provider"] | null;
  const ssoImage    = ssoData?.image ?? (session?.user as { image?: string } | undefined)?.image ?? undefined;

  /* ─── Navigation ─── */
  const [step,      setStep]      = useState<OnboardingStep>(1);
  const [error,     setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ─── Step 1: Identity — seeded from SSO data, topped up from session ─── */
  const [firstName,   setFirstName]   = useState(ssoData?.firstName ?? "");
  const [lastName,    setLastName]    = useState(ssoData?.lastName  ?? "");
  const [email,       setEmail]       = useState(ssoData?.email     ?? "");

  // Once session loads, fill any fields that URL params didn't provide
  const sessionSynced = useRef(false);
  useEffect(() => {
    if (sessionSynced.current || !session?.user?.email) return;
    sessionSynced.current = true;
    const u = session.user as { name?: string; email?: string; image?: string };
    if (!email && u.email)  setEmail(u.email);
    if (!firstName && u.name) {
      const [first = "", ...rest] = u.name.split(" ");
      setFirstName(first);
      if (!lastName && rest.length > 0) setLastName(rest.join(" "));
    }
    // Also persist to sessionStorage so refresh still works
    if (u.email) {
      try {
        const existing = sessionStorage.getItem(SSO_STORAGE_KEY);
        if (!existing) {
          const provider = (session.user as { provider?: string }).provider ?? "";
          const [first = "", ...rest] = (u.name ?? "").split(" ");
          const data: SSOData = {
            firstName: first,
            lastName:  rest.join(" "),
            email:     u.email,
            provider:  provider as SSOData["provider"],
            image:     u.image ?? undefined,
          };
          sessionStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(data));
        }
      } catch { /* noop */ }
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  const [contribType, setContribType] = useState<ContributorType>("");
  const [country,     setCountry]     = useState("");

  // Pre-select track from DB stub, referral context, or partner invite.
  const trackSeeded = useRef(false);
  useEffect(() => {
    if (trackSeeded.current || contribType) return;
    if (trackStatus?.contribType) {
      const mapped = contribTypeToContributorType(trackStatus.contribType);
      if (mapped) {
        trackSeeded.current = true;
        setContribType(mapped);
        return;
      }
    }
    const referral = readReferralContext();
    if (referral?.track === "student") {
      trackSeeded.current = true;
      setContribType("student");
    } else if (referral?.track === "women_wf") {
      trackSeeded.current = true;
      setContribType("women_workforce");
    }
  }, [trackStatus, contribType]);

  const referralForLock = readReferralContext();
  const lockedContribType: ContributorType | undefined =
    referralForLock?.track === "student"
      ? "student"
      : referralForLock?.track === "women_wf"
        ? "women_workforce"
        : undefined;

  /* ─── Step 2: Profile ─── */
  const [dob,                 setDob]                 = useState("");
  const [timezone,            setTimezone]            = useState("");
  const [departmentCategory,  setDepartmentCategory]  = useState("");
  const [departmentOther,     setDepartmentOther]     = useState("");
  const [availability,        setAvailability]        = useState("");
  const [degree,              setDegree]              = useState("");
  const [branch,              setBranch]              = useState("");
  const [educationFile,       setEducationFile]       = useState<File | null>(null);
  const [linkedin,            setLinkedin]            = useState("");
  const [primarySkills,       setPrimarySkills]       = useState<string[]>([]);
  const [skillInput,          setSkillInput]          = useState("");
  const [secondarySkills,     setSecondarySkills]     = useState<string[]>([]);
  const [secondarySkillInput, setSecondarySkillInput] = useState("");
  const [otherSkills,         setOtherSkills]         = useState<string[]>([]);
  const [otherSkillInput,     setOtherSkillInput]     = useState("");
  const [workStart,           setWorkStart]           = useState("");
  const [workEnd,             setWorkEnd]             = useState("");
  const [jobTitle,            setJobTitle]            = useState("");
  const [careerStage,         setCareerStage]         = useState("");
  const [yearsExperience,     setYearsExperience]     = useState("");
  const {
    studentCurrency,
    studentHourlyRate,
    womenRateCurrency,
    womenRateTable,
    generalRateCurrency,
    generalRateTable,
  } = usePricingConfig();

  /* ─── Step 3: Verification ─── */
  const [phoneCountry,      setPhoneCountry]      = useState("India");
  const [phone,             setPhone]             = useState("");
  const [otpSent,           setOtpSent]           = useState(false);
  const [otp,               setOtp]               = useState("");
  const [cooldown,          setCooldown]          = useState(0);
  const [phoneVerified,     setPhoneVerified]     = useState(false);
  const [phoneOtpLoading,   setPhoneOtpLoading]   = useState(false);

  // Email already verified by OAuth — pre-set to true
  const [verificationEmail, setVerificationEmail] = useState(ssoData?.email ?? "");
  const [emailOtpSent,      setEmailOtpSent]      = useState(false);
  const [emailOtp,          setEmailOtp]          = useState("");
  const [emailCooldown,     setEmailCooldown]     = useState(0);
  const [emailVerified,     setEmailVerified]     = useState(true); // SSO = already verified
  const [emailOtpLoading,   setEmailOtpLoading]   = useState(false);

  const [ndaAccepted,   setNdaAccepted]   = useState(false);
  const [ndaSignature,  setNdaSignature]  = useState("");
  const [ndaSignedFile, setNdaSignedFile] = useState<File | null>(null);

  /* ─── Step 4: Consent ─── */
  const [resumeFile,     setResumeFile]     = useState<File | null>(null);
  const [resumeDrag,     setResumeDrag]     = useState(false);
  const [acceptTos,      setAcceptTos]      = useState(false);
  const [acceptCoc,      setAcceptCoc]      = useState(false);
  const [acceptPrivacy,  setAcceptPrivacy]  = useState(false);
  const [acceptFee,      setAcceptFee]      = useState(false);
  const [acceptAhp,      setAcceptAhp]      = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [previewOpen,    setPreviewOpen]    = useState(false);

  /* ─── Auto-set phone country from country ─── */
  useEffect(() => {
    if (step !== 3 || !country) return;
    const match = COUNTRIES_DATA.find((c) => c.name === country);
    if (match) {
      setPhoneCountry(match.name);
      setPhone((prev) => (prev.startsWith(match.code) ? prev : match.code + " "));
    }
  }, [step, country]);

  /* ─── Skill helpers ─── */
  const addPrimarySkill    = (s: string) => { if (primarySkills.length   < 20) setPrimarySkills(  (p) => [...p, s]); setSkillInput("");          };
  const removePrimarySkill = (s: string) => setPrimarySkills(  (p) => p.filter((x) => x !== s));
  const addSecondarySkill    = (s: string) => { if (secondarySkills.length < 20) setSecondarySkills((p) => [...p, s]); setSecondarySkillInput(""); };
  const removeSecondarySkill = (s: string) => setSecondarySkills((p) => p.filter((x) => x !== s));
  const addOtherSkill    = (s: string) => { if (otherSkills.length    < 20) setOtherSkills(    (p) => [...p, s]); setOtherSkillInput("");     };
  const removeOtherSkill = (s: string) => setOtherSkills(    (p) => p.filter((x) => x !== s));

  /* ─── OTP helpers ─── */
  function startCooldown() {
    setCooldown(30);
    const iv = setInterval(() => setCooldown((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
  }
  function startEmailCooldown() {
    setEmailCooldown(30);
    const iv = setInterval(() => setEmailCooldown((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
  }

  async function sendOTP() {
    if (!phone || phone.replace(/\D/g, "").length < 7) { setError("Please enter a valid phone number"); return; }
    setError(""); setPhoneOtpLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setPhoneOtpLoading(false); setOtpSent(true); startCooldown();
  }
  async function verifyOTP() {
    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setError(""); setPhoneOtpLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setPhoneOtpLoading(false); setPhoneVerified(true);
  }
  async function sendEmailOTP() {
    if (!verificationEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationEmail)) { setError("Please enter a valid email address"); return; }
    setError(""); setEmailOtpLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setEmailOtpLoading(false); setEmailOtpSent(true); startEmailCooldown();
  }
  async function verifyEmailOTP() {
    if (emailOtp.length !== 6) { setError("Please enter the 6-digit email code"); return; }
    setError(""); setEmailOtpLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setEmailOtpLoading(false); setEmailVerified(true);
  }

  /* ─── Step navigation ─── */
  function goToStep2() {
    if (!firstName.trim()) { setError("Please enter your first name"); return; }
    if (!lastName.trim())  { setError("Please enter your last name"); return; }
    if (!contribType)      { setError("Please select your contributor type"); return; }
    if (!country)          { setError("Please select your country of residence"); return; }
    setError(""); setStep(2);
  }

  function goToStep3() {
    if (!dob)                { setError("Please enter your date of birth"); return; }
    if (getAgeFromDob(dob) < 18) { setError("You must be 18 or older to register"); return; }
    if (!timezone)           { setError("Please select your working time zone"); return; }
    if (!departmentCategory) { setError("Please select your department category"); return; }
    if (departmentCategory === "other" && !departmentOther.trim()) { setError("Please specify your department name"); return; }
    if (primarySkills.length < 1) { setError("Please add at least one primary skill"); return; }
    if (!availability)       { setError("Please enter your weekly availability"); return; }
    if ((contribType === "women_workforce" || contribType === "general_workforce") && !yearsExperience) {
      setError("Please select your years of experience");
      return;
    }
    setError(""); setStep(3);
  }

  function goToStep4() {
    if (!ndaAccepted)    { setError("Please check the NDA agreement checkbox to continue"); return; }
    if (!ndaSignedFile)  { setError("Please upload your signed NDA document to continue"); return; }
    if (!phoneVerified)  { setError("Please verify your phone number to continue"); return; }
    setError(""); setStep(4);
  }

  /* ─── Final submit ─── */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTos || !acceptCoc || !acceptPrivacy || !acceptAhp || !acceptFee) {
      setError("Please accept all required agreements");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const result = await onboardContributor({
        firstName,
        lastName:           lastName  || undefined,
        email,
        provider:           ssoProvider ?? undefined,
        contribType,
        country,
        dob,
        timezone,
        departmentCategory,
        departmentOther:    departmentCategory === "other" ? departmentOther : undefined,
        primarySkills,
        secondarySkills,
        otherSkills,
        availability,
        degree:             degree        || undefined,
        branch:             branch        || undefined,
        linkedin:           linkedin      || undefined,
        careerStage:        careerStage   || undefined,
        yearsExperience:    yearsExperience || undefined,
        workStart:          workStart     || undefined,
        workEnd:            workEnd       || undefined,
        phone:              phone         || undefined,
        ndaAccepted,
        ndaSignature:       ndaSignature  || undefined,
        acceptTos,
        acceptCoc,
        acceptPrivacy,
        acceptFee,
        acceptAhp,
        marketingOptIn,
      });
      if (!result.success) { setError(result.error); return; }
      try { sessionStorage.removeItem(SSO_STORAGE_KEY); } catch { /* noop */ }
      setOnboardingComplete(true);
      invalidateTrack();
      router.push("/contributor/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    firstName, lastName, email, contribType, country, dob, timezone,
    departmentCategory, departmentOther, primarySkills, secondarySkills,
    otherSkills, availability, degree, branch, linkedin, careerStage,
    yearsExperience, workStart, workEnd, phone, ndaAccepted, ndaSignature,
    acceptTos, acceptCoc, acceptPrivacy, acceptFee, acceptAhp, marketingOptIn,
    setOnboardingComplete, invalidateTrack, router,
  ]);

  return {
    ssoData, ssoProvider, ssoImage,
    step, setStep, error, setError, isLoading,
    previewOpen, setPreviewOpen,

    // Step 1
    firstName, setFirstName,
    lastName, setLastName,
    email, setEmail,
    contribType, setContribType,
    lockedContribType,
    country, setCountry,

    // Step 2
    dob, setDob,
    timezone, setTimezone,
    departmentCategory, setDepartmentCategory,
    departmentOther, setDepartmentOther,
    availability, setAvailability,
    degree, setDegree,
    branch, setBranch,
    educationFile, setEducationFile,
    linkedin, setLinkedin,
    primarySkills, skillInput, setSkillInput, addPrimarySkill, removePrimarySkill,
    secondarySkills, secondarySkillInput, setSecondarySkillInput, addSecondarySkill, removeSecondarySkill,
    otherSkills, otherSkillInput, setOtherSkillInput, addOtherSkill, removeOtherSkill,
    workStart, setWorkStart,
    workEnd, setWorkEnd,
    jobTitle, setJobTitle,
    careerStage, setCareerStage,
    yearsExperience, setYearsExperience,
    studentCurrency,
    studentHourlyRate,
    womenRateCurrency,
    womenRateTable,
    generalRateCurrency,
    generalRateTable,

    // Step 3
    phoneCountry, setPhoneCountry,
    phone, setPhone,
    otpSent, otp, setOtp, cooldown, phoneVerified, phoneOtpLoading,
    verificationEmail, setVerificationEmail,
    emailOtpSent, emailOtp, setEmailOtp, emailCooldown, emailVerified, emailOtpLoading,
    ndaAccepted, setNdaAccepted,
    ndaSignature, setNdaSignature,
    ndaSignedFile, setNdaSignedFile,
    sendOTP, verifyOTP, sendEmailOTP, verifyEmailOTP,

    // Step 4
    resumeFile, setResumeFile,
    resumeDrag, setResumeDrag,
    acceptTos, setAcceptTos,
    acceptCoc, setAcceptCoc,
    acceptPrivacy, setAcceptPrivacy,
    acceptFee, setAcceptFee,
    acceptAhp, setAcceptAhp,
    marketingOptIn, setMarketingOptIn,

    // Navigation
    goToStep2, goToStep3, goToStep4, handleSubmit,
  };
}

export type ContributorOnboardingState = ReturnType<typeof useContributorOnboarding>;
