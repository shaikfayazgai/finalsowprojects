"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { COUNTRIES_DATA } from "../data";
import { getPasswordStrength, getAgeFromDob } from "../helpers";
import { registerContributor } from "@/lib/actions/register";
import { usePricingConfig } from "@/lib/hooks/usePricingConfig";
import { authApi } from "@/lib/api/auth";
import { ApiError, fetchInternal } from "@/lib/api/client";
import type { RegistrationRole, ContributorType, SSOData } from "../types";

function pickBoolean(source: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

function getEmailExists(raw: unknown): boolean | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const direct = pickBoolean(data, [
    "exists",
    "emailExists",
    "email_exists",
    "registered",
    "isRegistered",
    "is_registered",
    "userExists",
    "user_exists",
  ]);
  if (direct !== null) return direct;

  const available = pickBoolean(data, ["available", "emailAvailable", "email_available"]);
  if (available !== null) return !available;

  const nested = data.data ?? data.result;
  if (nested && typeof nested === "object") return getEmailExists(nested);

  return null;
}

export function useRegistration(ssoData?: SSOData | null) {
  const [isSsoUser] = useState(() => !!ssoData);
  const [ssoProvider] = useState(() => ssoData?.provider ?? null);

  const [registrationRole, setRegistrationRole] =
    useState<RegistrationRole>("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [firstName, setFirstName] = useState(ssoData?.firstName ?? "");
  const [lastName, setLastName] = useState(ssoData?.lastName ?? "");
  const [email, setEmail] = useState(ssoData?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [contribType, setContribType] = useState<ContributorType>("");
  const [country, setCountry] = useState("");

  const [dob, setDob] = useState("");
  const [timezone, setTimezone] = useState("");
  const [departmentCategory, setDepartmentCategory] = useState("");
  const [departmentOther, setDepartmentOther] = useState("");
  const [availability, setAvailability] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [mentorAck, setMentorAck] = useState(false);
  const [primarySkills, setPrimarySkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [secondarySkills, setSecondarySkills] = useState<string[]>([]);
  const [secondarySkillInput, setSecondarySkillInput] = useState("");
  const [otherSkills, setOtherSkills] = useState<string[]>([]);
  const [otherSkillInput, setOtherSkillInput] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [careerStage, setCareerStage] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const {
    studentCurrency,
    studentHourlyRate,
    womenRateCurrency,
    womenRateTable,
    generalRateCurrency,
    generalRateTable,
  } = usePricingConfig();
  const [phoneCountry, setPhoneCountry] = useState("India");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [ndaSignature, setNdaSignature] = useState("");
  const [ndaSignedFile, setNdaSignedFile] = useState<File | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDrag, setResumeDrag] = useState(false);
  const [acceptTos, setAcceptTos] = useState(false);
  const [acceptCoc, setAcceptCoc] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptFee, setAcceptFee] = useState(false);
  const [acceptAhp, setAcceptAhp] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);

  useEffect(() => {
    if (step !== 3 || !country) return;
    const match = COUNTRIES_DATA.find((c) => c.name === country);
    if (match) {
      setPhoneCountry(match.name);
      setPhone((prev) =>
        prev.startsWith(match.code) ? prev : match.code + " ",
      );
    }
  }, [step, country]);

  function startCooldown() {
    setCooldown(30);
    const iv = setInterval(() => {
      setCooldown((p) => {
        if (p <= 1) {
          clearInterval(iv);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }

  function startEmailCooldown() {
    setEmailCooldown(30);
    const iv = setInterval(() => {
      setEmailCooldown((p) => {
        if (p <= 1) {
          clearInterval(iv);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }

  const addPrimarySkill = (skill: string) => {
    if (primarySkills.length < 20) setPrimarySkills((prev) => [...prev, skill]);
    setSkillInput("");
  };
  const removePrimarySkill = (skill: string) =>
    setPrimarySkills((prev) => prev.filter((item) => item !== skill));

  const addSecondarySkill = (skill: string) => {
    if (secondarySkills.length < 20)
      setSecondarySkills((prev) => [...prev, skill]);
    setSecondarySkillInput("");
  };
  const removeSecondarySkill = (skill: string) =>
    setSecondarySkills((prev) => prev.filter((item) => item !== skill));

  const addOtherSkill = (skill: string) => {
    if (otherSkills.length < 20) setOtherSkills((prev) => [...prev, skill]);
    setOtherSkillInput("");
  };
  const removeOtherSkill = (skill: string) =>
    setOtherSkills((prev) => prev.filter((item) => item !== skill));

  async function sendOTP() {
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setPhoneOtpLoading(true);
    try {
      const res = await fetchInternal("/api/auth/otp/send-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          (data as { message?: string }).message ??
            "Could not send OTP. Please try again.",
        );
        return;
      }
      setOtpSent(true);
      startCooldown();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPhoneOtpLoading(false);
    }
  }

  async function verifyOTP() {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setError("");
    setPhoneOtpLoading(true);
    try {
      const res = await fetchInternal("/api/auth/otp/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          (data as { message?: string }).message ??
            "Invalid or expired code. Please try again.",
        );
        return;
      }
      setPhoneVerified(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPhoneOtpLoading(false);
    }
  }

  async function sendEmailOTP() {
    if (
      !verificationEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationEmail)
    ) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setEmailOtpLoading(true);
    try {
      const res = await fetchInternal("/api/auth/otp/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          (data as { message?: string }).message ??
            "Could not send email OTP. Please try again.",
        );
        return;
      }
      setEmailOtpSent(true);
      startEmailCooldown();
    } catch {
      setError(
        "Failed to send email. Please check your connection and try again.",
      );
    } finally {
      setEmailOtpLoading(false);
    }
  }

  async function verifyEmailOTP() {
    if (emailOtp.length !== 6) {
      setError("Please enter the 6-digit email code");
      return;
    }
    setError("");
    setEmailOtpLoading(true);
    try {
      const res = await fetchInternal("/api/auth/otp/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code: emailOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          (data as { message?: string }).message ??
            "Invalid or expired code. Please try again.",
        );
        return;
      }
      setEmailVerified(true);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setEmailOtpLoading(false);
    }
  }

  async function checkEmailExists(
    value: string,
    updateState = true,
  ): Promise<boolean | null> {
    const normalizedEmail = value.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      if (updateState) setEmailExists(null);
      return null;
    }

    try {
      const raw = await authApi.validateEmail(normalizedEmail);
      const exists = getEmailExists(raw);
      if (exists === null) {
        if (updateState) setEmailExists(null);
        return null;
      }

      if (updateState) setEmailExists(exists);
      return exists;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          if (updateState) setEmailExists(true);
          return true;
        }

        if (err.status === 401 || err.status === 404) {
          if (updateState) setEmailExists(false);
          return false;
        }
      }

      if (updateState) setEmailExists(null);
      return null;
    }
  }

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    setEmailExists(null);
    if (!validEmail) {
      setEmailChecking(false);
      return;
    }

    let active = true;
    setEmailChecking(true);

    const timer = window.setTimeout(() => {
      void checkEmailExists(normalizedEmail, false)
        .then((exists) => {
          if (active) setEmailExists(exists);
        })
        .finally(() => {
          if (active) setEmailChecking(false);
        });
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [email]);

  async function goToStep2() {
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address (e.g. name@company.com)");
      return;
    }

    setIsLoading(true);
    const existingEmail = await checkEmailExists(email);
    setIsLoading(false);
    if (existingEmail === true) {
      setError("This email is already registered. Please sign in instead.");
      return;
    }
    if (existingEmail === null) {
      setError("Could not validate email availability. Please try again.");
      return;
    }

    if (!isSsoUser) {
      if (password.length < 8) {
        setError(
          "Password must be at least 8 characters with a number and mixed case",
        );
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match - please re-enter");
        return;
      }
    }
    if (!contribType) {
      setError("Please select your contributor type");
      return;
    }
    if (!country) {
      setError("Please select your country of residence");
      return;
    }
    setError("");
    setStep(2);
  }

  function goToStep3() {
    if (!dob) {
      setError("Please enter your date of birth");
      return;
    }
    if (getAgeFromDob(dob) < 18) {
      setError("You must be 18 or older to register");
      return;
    }
    if (!timezone) {
      setError("Please select your working time zone");
      return;
    }
    if (!departmentCategory) {
      setError("Please select your department category");
      return;
    }
    if (departmentCategory === "other" && !departmentOther.trim()) {
      setError("Please specify your department name");
      return;
    }
    if (primarySkills.length < 1) {
      setError("Please add at least one primary skill");
      return;
    }
    if (!availability) {
      setError("Please enter your weekly availability (hours)");
      return;
    }
    if (
      (contribType === "women_workforce" ||
        contribType === "general_workforce") &&
      !yearsExperience
    ) {
      setError("Please select your years of experience");
      return;
    }
    setError("");
    if (!verificationEmail) setVerificationEmail(email);
    setStep(3);
  }

  function goToStep4() {
    if (!ndaSignedFile) {
      setError("Please upload the signed NDA document to continue");
      return;
    }
    if (!ndaSignature.trim()) {
      setError("Please enter your full legal name as a digital signature");
      return;
    }
    if (!ndaAccepted) {
      setError(
        "You must read and accept the NDA & Disclosure Agreement to continue",
      );
      return;
    }
    if (!phoneVerified || !emailVerified) {
      setError(
        "Please verify both your phone number and email address to continue",
      );
      return;
    }
    setError("");
    setStep(4);
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTos) {
      setError("You must accept the Terms of Use to proceed");
      return;
    }
    if (!acceptCoc) {
      setError("You must accept the Code of Conduct to proceed");
      return;
    }
    if (!acceptPrivacy) {
      setError("You must accept the Privacy Policy to proceed");
      return;
    }
    if (!acceptAhp) {
      setError("You must accept the Anti-Harassment Policy to proceed");
      return;
    }
    if (!acceptFee) {
      setError("You must acknowledge the platform service fee to proceed");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const result = await registerContributor({
        firstName,
        lastName,
        email,
        password,
        contribType,
        country,
        dob,
        timezone,
        departmentCategory,
        departmentOther:
          departmentCategory === "other" ? departmentOther : undefined,
        primarySkills,
        secondarySkills,
        otherSkills,
        availability,
        degree: degree || undefined,
        branch: branch || undefined,
        linkedin: linkedin || undefined,
        careerStage: careerStage || undefined,
        yearsExperience: yearsExperience || undefined,
        workStart: workStart || undefined,
        workEnd: workEnd || undefined,
        phone: phone || undefined,
        ndaSignature,
        acceptTos,
        acceptCoc,
        acceptPrivacy,
        acceptFee,
        acceptAhp,
        marketingOptIn,
      });

      if (!result.success) {
        // Show friendly message for duplicate email
        if (
          result.error?.toLowerCase().includes("already") ||
          result.error?.toLowerCase().includes("exists") ||
          result.error?.toLowerCase().includes("duplicate")
        ) {
          setError("This email is already registered. Please sign in instead.");
        } else {
          setError(result.error);
        }
        setIsLoading(false);
        return;
      }

      if (result.emailWarning) {
        console.warn(
          "[registration] welcome email failed:",
          result.emailWarning,
        );
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        const role = (session?.user as { role?: string })?.role;
        window.location.href =
          role === "enterprise"
            ? "/enterprise/dashboard"
            : role === "mentor"
              ? "/mentor/dashboard"
              : "/contributor/dashboard";
      } else {
        window.location.href = "/auth/login";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  const passwordStrength = getPasswordStrength(password);

  return {
    isSsoUser,
    ssoProvider,
    registrationRole,
    setRegistrationRole,
    step,
    setStep,
    error,
    setError,
    isLoading,
    previewOpen,
    setPreviewOpen,

    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    emailExists,
    emailChecking,
    password,
    setPassword,
    confirm,
    setConfirm,
    showPw,
    setShowPw,
    showCon,
    setShowCon,
    contribType,
    setContribType,
    country,
    setCountry,
    passwordStrength,

    dob,
    setDob,
    timezone,
    setTimezone,
    departmentCategory,
    setDepartmentCategory,
    departmentOther,
    setDepartmentOther,
    availability,
    setAvailability,
    degree,
    setDegree,
    branch,
    setBranch,
    linkedin,
    setLinkedin,
    mentorAck,
    setMentorAck,
    primarySkills,
    skillInput,
    setSkillInput,
    addPrimarySkill,
    removePrimarySkill,
    secondarySkills,
    secondarySkillInput,
    setSecondarySkillInput,
    addSecondarySkill,
    removeSecondarySkill,
    otherSkills,
    otherSkillInput,
    setOtherSkillInput,
    addOtherSkill,
    removeOtherSkill,
    workStart,
    setWorkStart,
    workEnd,
    setWorkEnd,
    jobTitle,
    setJobTitle,
    careerStage,
    setCareerStage,
    yearsExperience,
    setYearsExperience,
    studentCurrency,
    studentHourlyRate,
    womenRateCurrency,
    womenRateTable,
    generalRateCurrency,
    generalRateTable,

    phoneCountry,
    setPhoneCountry,
    phone,
    setPhone,
    otpSent,
    otp,
    setOtp,
    cooldown,
    phoneVerified,
    phoneOtpLoading,
    verificationEmail,
    setVerificationEmail,
    emailOtpSent,
    emailOtp,
    setEmailOtp,
    emailCooldown,
    emailVerified,
    emailOtpLoading,
    sendOTP,
    verifyOTP,
    sendEmailOTP,
    verifyEmailOTP,

    ndaAccepted,
    setNdaAccepted,
    ndaSignature,
    setNdaSignature,
    ndaSignedFile,
    setNdaSignedFile,

    resumeFile,
    setResumeFile,
    resumeDrag,
    setResumeDrag,
    acceptTos,
    setAcceptTos,
    acceptCoc,
    setAcceptCoc,
    acceptPrivacy,
    setAcceptPrivacy,
    acceptFee,
    setAcceptFee,
    acceptAhp,
    setAcceptAhp,
    marketingOptIn,
    setMarketingOptIn,

    goToStep2,
    goToStep3,
    goToStep4,
    handleFinalSubmit,
  };
}

export type RegistrationState = ReturnType<typeof useRegistration>;
