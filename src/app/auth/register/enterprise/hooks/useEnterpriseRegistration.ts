"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { COUNTRIES_DATA } from "../../data";
import { getPasswordStrength } from "../../helpers";
import { useAuthStore } from "@/lib/stores/auth-store";
import { registerEnterprise } from "@/lib/actions/register";
import { fetchInternal } from "@/lib/api/client";

export type OrgType =
  | ""
  | "startup"
  | "sme"
  | "large-enterprise"
  | "mnc"
  | "ngo"
  | "government"
  | "educational"
  | "agency"
  | "other";

export function useEnterpriseRegistration() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("");
  const [orgTypeOther, setOrgTypeOther] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryOther, setIndustryOther] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [hqCountry, setHqCountry] = useState("");
  const [hqCity, setHqCity] = useState("");

  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminTitle, setAdminTitle] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [initialAdminEmail, setInitialAdminEmail] = useState("");
  const [adminDept, setAdminDept] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("India");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpDevHint, setPhoneOtpDevHint] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpDevHint, setEmailOtpDevHint] = useState("");

  const [incorporationCountry, setIncorporationCountry] = useState("");
  const [incorporationFile, setIncorporationFile] = useState<File | null>(null);
  const [incorporationDrag, setIncorporationDrag] = useState(false);
  const [acceptTos, setAcceptTos] = useState(false);
  const [acceptPp, setAcceptPp] = useState(false);
  const [acceptEsa, setAcceptEsa] = useState(false);
  const [acceptAhp, setAcceptAhp] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    setPhoneVerified(false);
    setOtpSent(false);
    setOtp("");
    setPhoneOtpDevHint("");
  }, [phoneCountry, phone]);

  useEffect(() => {
    setEmailVerified(false);
    setEmailOtpSent(false);
    setEmailOtp("");
    setEmailOtpDevHint("");
  }, [adminEmail]);

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

  async function sendOTP() {
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setPhoneOtpDevHint("");
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
            "Could not send SMS OTP. Use a 10-digit Indian number or check your connection.",
        );
        return;
      }
      setOtpSent(true);
      startCooldown();
      const d = data as { devFallback?: boolean; devOtp?: string };
      if (d.devFallback === true && typeof d.devOtp === "string" && d.devOtp.length === 6) {
        setPhoneOtpDevHint(
          `Development mode: SMS was not delivered. Use this code: ${d.devOtp}`,
        );
      }
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
            "Invalid or expired code. Request a new OTP and try again.",
        );
        return;
      }
      setPhoneOtpDevHint("");
      setPhoneVerified(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPhoneOtpLoading(false);
    }
  }

  async function sendEmailOTP() {
    if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      setError("Please enter a valid business email address");
      return;
    }
    setError("");
    setEmailOtpDevHint("");
    setEmailOtpLoading(true);
    try {
      const res = await fetchInternal("/api/auth/otp/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ? `${data.message} — ${data.detail}` : data.message);
        return;
      }
      setEmailOtpSent(true);
      startEmailCooldown();
      if (data.devFallback === true && typeof data.devOtp === "string" && data.devOtp.length === 6) {
        setEmailOtpDevHint(
          `Development mode: email was not delivered (SMTP). Use this code: ${data.devOtp}`,
        );
      }
    } catch {
      setError("Failed to send email. Please check your connection and try again.");
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
        body: JSON.stringify({ email: adminEmail, code: emailOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setEmailOtpDevHint("");
      setEmailVerified(true);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setEmailOtpLoading(false);
    }
  }

  function goToStep2() {
    if (!orgName.trim()) {
      setError("Please enter your organisation name");
      return;
    }
    if (!orgType) {
      setError("Please select your organisation type");
      return;
    }
    if (orgType === "other" && !orgTypeOther.trim()) {
      setError("Please enter your organisation type");
      return;
    }
    if (!industry) {
      setError("Please select your industry / sector");
      return;
    }
    if (industry === "other" && !industryOther.trim()) {
      setError("Please enter your industry / sector");
      return;
    }
    if (!companySize) {
      setError("Please select your company size");
      return;
    }
    if (!incorporationCountry) {
      setError("Please select your country of incorporation");
      return;
    }
    setError("");
    setStep(2);
  }

  function goToStep3() {
    if (!adminFirstName.trim()) {
      setError("Please enter the administrator's first name");
      return;
    }
    if (!adminLastName.trim()) {
      setError("Please enter the administrator's last name");
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes("@")) {
      setError("Please enter a valid business email address");
      return;
    }
    if (!adminTitle.trim()) {
      setError("Please enter the administrator's job title");
      return;
    }
    setError("");
    setInitialAdminEmail(adminEmail);
    setStep(3);
  }

  function goToStep4() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match - please re-enter");
      return;
    }
    if (!phoneVerified || !emailVerified) {
      setError(
        "Please verify both the phone number and email address to continue",
      );
      return;
    }
    setError("");
    setStep(4);
  }

  const setRegistrationData = useAuthStore((s) => s.setRegistrationData);

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTos) {
      setError("You must accept the Terms of Use to proceed");
      return;
    }
    if (!acceptPp) {
      setError("You must accept the Privacy Policy to proceed");
      return;
    }
    if (!acceptEsa) {
      setError("You must accept the Enterprise Service Agreement to proceed");
      return;
    }
    if (!acceptAhp) {
      setError("You must accept the Anti-Harassment Policy to proceed");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const result = await registerEnterprise({
        orgName,
        orgType: orgType === "other" ? orgTypeOther : orgType,
        orgTypeOther: orgType === "other" ? orgTypeOther : undefined,
        industry: industry === "other" ? industryOther : industry,
        industryOther: industry === "other" ? industryOther : undefined,
        companySize,
        website: website || undefined,
        hqCountry: hqCountry || undefined,
        hqCity: hqCity || undefined,
        adminFirstName,
        adminLastName,
        adminTitle,
        adminEmail,
        adminDept: adminDept || undefined,
        phone: phone || undefined,
        password,
        incorporationCountry: incorporationCountry,
        acceptTos,
        acceptPp,
        acceptEsa,
        acceptAhp,
        marketingOptIn,
      });

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.emailWarning) {
        console.warn("[enterprise-registration] welcome email failed:", result.emailWarning);
      }

      // Save registration data for onboarding wizard
      setRegistrationData({
        companyName: orgName,
        countryOfIncorporation: incorporationCountry,
        adminEmail: adminEmail,
      });

      const signInResult = await signIn("credentials", {
        email: adminEmail,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        const role = (session?.user as { role?: string })?.role;
        window.location.href =
          role === "contributor" ? "/contributor/dashboard" :
          role === "mentor"      ? "/mentor/dashboard" :
                                   "/enterprise/dashboard";
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
    step,
    setStep,
    error,
    setError,
    isLoading,

    orgName,
    setOrgName,
    orgType,
    setOrgType,
    orgTypeOther,
    setOrgTypeOther,
    industry,
    setIndustry,
    industryOther,
    setIndustryOther,
    companySize,
    setCompanySize,
    website,
    setWebsite,
    hqCountry,
    setHqCountry,
    hqCity,
    setHqCity,

    adminFirstName,
    setAdminFirstName,
    adminLastName,
    setAdminLastName,
    adminTitle,
    setAdminTitle,
    adminEmail,
    setAdminEmail,
    initialAdminEmail,
    adminDept,
    setAdminDept,
    phoneCountry,
    setPhoneCountry,
    phone,
    setPhone,

    password,
    setPassword,
    confirm,
    setConfirm,
    passwordStrength,
    otpSent,
    otp,
    setOtp,
    cooldown,
    phoneVerified,
    phoneOtpLoading,
    phoneOtpDevHint,
    emailOtpSent,
    emailOtp,
    setEmailOtp,
    emailCooldown,
    emailVerified,
    emailOtpLoading,
    emailOtpDevHint,
    sendOTP,
    verifyOTP,
    sendEmailOTP,
    verifyEmailOTP,

    incorporationCountry,
    setIncorporationCountry,
    incorporationFile,
    setIncorporationFile,
    incorporationDrag,
    setIncorporationDrag,
    acceptTos,
    setAcceptTos,
    acceptPp,
    setAcceptPp,
    acceptEsa,
    setAcceptEsa,
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

export type EnterpriseRegistrationState = ReturnType<
  typeof useEnterpriseRegistration
>;
