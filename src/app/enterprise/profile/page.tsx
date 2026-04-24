"use client";

import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { fetchInternal } from "@/lib/api/client";
import { sowApi } from "@/lib/api/sow";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import {
  User,
  Camera,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Mail,
  Smartphone,
  Check,
  X,
  Copy,
  Download,
  AlertTriangle,
  QrCode,
  KeyRound,
  Info,



  
  Pencil,
} from "lucide-react";
import {
  GlassCard,
  GlassCardContent,
  Button,
  Input,
  Label,
  Badge,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

/* ─────────────────────── Password Strength ─────────────────────── */

function getPasswordStrength(password: string): {
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { label: "", color: "", width: "w-0" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  if (score <= 3)
    return { label: "Fair", color: "bg-gold-500", width: "w-2/4" };
  if (score <= 4)
    return { label: "Strong", color: "bg-forest-500", width: "w-3/4" };
  return { label: "Very Strong", color: "bg-teal-500", width: "w-full" };
}

/* ─────────────────────── Password Validation ─────────────────────── */

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 12)
    errors.push("Must be at least 12 characters");
  if (!/[A-Z]/.test(password))
    errors.push("Must contain at least 1 uppercase letter");
  if (!/[a-z]/.test(password))
    errors.push("Must contain at least 1 lowercase letter");
  if (!/[0-9]/.test(password))
    errors.push("Must contain at least 1 digit");
  if (!/[^A-Za-z0-9]/.test(password))
    errors.push("Must contain at least 1 special character");
  return errors;
}

/* ─────────────────────── Mock Recovery Codes ─────────────────────── */

const MOCK_RECOVERY_CODES: string[] = [];

/* ═══════════════════════════════════════════════════════════════════ */
/*  Profile Page                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  /* ── Personal Information State ── */
  const { data: session } = useSession();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const sessionUser = session?.user as any;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  // Derive email from API first, then session (avoids the useState-async-session trap)
  const email = currentUser?.email ?? session?.user?.email ?? "";

  // Populate fields from API response
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName ?? "");
      setLastName(currentUser.lastName ?? "");
      setDisplayName(`${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim());
      setJobTitle(currentUser.role ?? "");
      setPhone(currentUser.phone ?? "");
    } else {
      const u = session?.user as any;
      // Try firstName/lastName directly first
      if (u?.firstName) setFirstName(u.firstName);
      if (u?.lastName) setLastName(u.lastName);
      if (u?.firstName || u?.lastName) {
        setDisplayName(`${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim());
      } else if (u?.name) {
      // Fallback to name split
      const parts = u.name.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
      setDisplayName(u.name);
    }
    if (u?.role) setJobTitle(u.role);
    if (u?.adminDept) setDepartment(u.adminDept);
  }
}, [currentUser, session?.user]);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [displayNameCustomized, setDisplayNameCustomized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Password State ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );

  /* ── MFA State ── */
  const mfaEnabled = currentUser?.mfaEnabled ?? true;
  const [mfaMethod, setMfaMethod] = useState("totp");
  const [verificationCode, setVerificationCode] = useState("");
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  /* ── Notification Preferences State ── */
  const [notifications, setNotifications] = useState({
    newSubmission: { email: true, inApp: true },
    slaApproaching: { email: true, inApp: true },
    reworkResubmission: { email: true, inApp: true },
    contributorQuestion: { email: true, inApp: true },
    blueprintPublished: { email: false, inApp: true },
  });

  /* ── Derived ── */
  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  /* ── Handlers ── */

  const handlePhotoUpload = useCallback(
  async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Invalid file type", "Please upload a PNG or JPG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", "Maximum file size is 2MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setProfilePhoto(url);
    try {
      await sowApi.uploadProfilePicture(file);
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Failed to upload photo.");
    }
  }, []
);

  const handleFirstNameChange = useCallback(
    (value: string) => {
      setFirstName(value);
      if (!displayNameCustomized) {
        setDisplayName(`${value} ${lastName}`.trim());
      }
    },
    [lastName, displayNameCustomized]
  );

  const handleLastNameChange = useCallback(
    (value: string) => {
      setLastName(value);
      if (!displayNameCustomized) {
        setDisplayName(`${firstName} ${value}`.trim());
      }
    },
    [firstName, displayNameCustomized]
  );

  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value);
    setDisplayNameCustomized(true);
  }, []);

  const validatePersonalInfo = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const nameRegex = /^[A-Za-z\s\-]+$/;

    if (!firstName || firstName.length < 2)
      errors.firstName = "First name must be at least 2 characters.";
    else if (firstName.length > 50)
      errors.firstName = "First name must be under 50 characters.";
    else if (!nameRegex.test(firstName))
      errors.firstName = "Only letters, spaces, and hyphens are allowed.";

    if (!lastName || lastName.length < 1)
      errors.lastName = "Last name must be at least 2 characters.";
    else if (lastName.length > 50)
      errors.lastName = "Last name must be under 50 characters.";
    else if (!nameRegex.test(lastName))
      errors.lastName = "Only letters, spaces, and hyphens are allowed.";

    if (displayName && displayName.length > 100)
      errors.displayName = "Display name must be under 100 characters.";

    if (jobTitle && jobTitle.length > 100)
      errors.jobTitle = "Job title must be under 100 characters.";

    setPersonalErrors(errors);
    return Object.keys(errors).length === 0;
  }, [firstName, lastName, displayName, jobTitle]);

  const handleSavePersonalInfo = useCallback(async (): Promise<boolean> => {
    if (!validatePersonalInfo()) return false;
    try {
      await sowApi.updateProfile({ firstName, lastName, phone, adminTitle: jobTitle, adminDept: department });
      toast.success("Personal information updated.");
      return true;
    } catch {
      toast.error("Failed to save. Please try again.");
      return false;
    }
  }, [validatePersonalInfo, firstName, lastName, phone, jobTitle, department]);

  const handleUpdatePassword = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!currentPassword)
      errors.currentPassword = "Current password is required.";

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else {
      const validationErrors = validatePassword(newPassword);
      if (validationErrors.length > 0)
        errors.newPassword = validationErrors[0];
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    // Mock: PWD-003 check
    if (
      newPassword &&
      ["Password123!", "OldPass2024#"].includes(newPassword)
    ) {
      errors.newPassword =
        "This password was recently used. Choose a different one.";
    }

    // Mock: PWD-005 check
    if (
      newPassword &&
      ["password123!", "qwerty12345!"].includes(newPassword.toLowerCase())
    ) {
      errors.newPassword = "This is a commonly breached password.";
    }

    // Mock: PWD-004 check
    if (currentPassword && currentPassword !== "CurrentPass1!") {
      errors.currentPassword = "Current password is incorrect.";
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length === 0) {
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleCopyRecoveryCodes = useCallback(() => {
    navigator.clipboard.writeText(MOCK_RECOVERY_CODES.join("\n"));
    toast.success("Recovery codes copied to clipboard.");
  }, []);

  const handleDownloadRecoveryCodes = useCallback(() => {
    const content = MOCK_RECOVERY_CODES.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded.");
  }, []);

  const handleSaveNotifications = useCallback(() => {
    toast.success("Notification preferences saved.");
  }, []);

  const toggleNotification = useCallback(
    (
      key: keyof typeof notifications,
      channel: "email" | "inApp"
    ) => {
      setNotifications((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [channel]: !prev[key][channel],
        },
      }));
    },
    []
  );

  /* ═══════════════════════════════════════════════════════════════ */
  /*  Render                                                        */
  /* ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">
          My Profile
        </h1>
        <p className="text-sm text-beige-600 mt-1">
          Manage your personal information, security settings, and notification
          preferences.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 1: Personal Information                           */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <GlassCard variant="heavy" padding="lg">
        <GlassCardContent>
          {/* Section Header */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-brown-950">
                  Personal Information
                </h2>
                <p className="text-sm text-beige-600">
                  Your account details. Contact support to change name or email.
                </p>
              </div>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setPersonalErrors({}); }}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={async () => { const ok = await handleSavePersonalInfo(); if (ok) setIsEditing(false); }}>
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Profile Photo */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full bg-beige-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : isUserLoading ? (
                  <div className="h-10 w-10 rounded-full bg-beige-300 animate-pulse" />
                ) : (
                  <span className="text-3xl font-heading font-semibold text-brown-400">
                    {firstName[0]}
                    {lastName[0]}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-brown-950/0 group-hover:bg-brown-950/40 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* First Name + Last Name — readonly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                {isUserLoading ? (
                  <div className="h-10 rounded-xl bg-beige-200 animate-pulse" />
                ) : (
                  <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">
                    {firstName || "—"}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                {isUserLoading ? (
                  <div className="h-10 rounded-xl bg-beige-200 animate-pulse" />
                ) : (
                  <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">
                    {lastName || "—"}
                  </div>
                )}
              </div>
            </div>

            {/* Username — readonly */}
            <div className="space-y-1.5">
              <Label>Username</Label>
              {isUserLoading ? (
                <div className="h-10 rounded-xl bg-beige-200 animate-pulse" />
              ) : (
                <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">
                  {displayName || "—"}
                </div>
              )}
            </div>

            {/* Work Email — readonly */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Work Email</Label>
                {!isUserLoading && currentUser && (
                  <Badge variant={currentUser.emailVerified ? "teal" : "gold"} size="sm" dot>
                    {currentUser.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                )}
              </div>
              <Input
                id="email"
                value={email}
                readOnly
                className="bg-beige-100/50 text-beige-600 cursor-not-allowed"
              />
              <p className="text-xs text-beige-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                To change your email, please raise a support request.
              </p>
            </div>

            {/* Job Title / Role — editable */}
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job Title / Role</Label>
              {isEditing ? (
                <>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Engineering Manager"
                    maxLength={100}
                  />
                  {personalErrors.jobTitle && (
                    <p className="text-xs text-red-500">{personalErrors.jobTitle}</p>
                  )}
                </>
              ) : (
                <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">
                  {jobTitle || "—"}
                </div>
              )}
            </div>

            {/* Phone Number — editable */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone">Phone Number</Label>
                {!isUserLoading && currentUser && (
                  <Badge variant={currentUser.phoneVerified ? "teal" : "gold"} size="sm" dot>
                    {currentUser.phoneVerified ? "Verified" : "Unverified"}
                  </Badge>
                )}
              </div>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              ) : (
                <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">
                  {phone || "—"}
                </div>
              )}
            </div>
            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              {isEditing ? (
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                />
              ) : (
                <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">
                  {department || "—"}
                </div>
              )}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 2: Security                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <GlassCard variant="heavy" padding="lg">
        <GlassCardContent>
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-brown-950">
                Security
              </h2>
              <p className="text-sm text-beige-600">
                Manage your password and multi-factor authentication settings.
              </p>
            </div>
          </div>

          {/* ── Password Change ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-brown-500" />
              <h3 className="font-heading text-sm font-semibold text-brown-800">
                Change Password
              </h3>
            </div>

            {/* Current Password */}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-500 hover:text-brown-600 transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-red-500">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-500 hover:text-brown-600 transition-colors cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500">
                  {passwordErrors.newPassword}
                </p>
              )}

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-full rounded-full bg-beige-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
                    />
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      passwordStrength.label === "Weak"
                        ? "text-red-500"
                        : passwordStrength.label === "Fair"
                        ? "text-gold-600"
                        : passwordStrength.label === "Strong"
                        ? "text-forest-600"
                        : "text-teal-600"
                    }`}
                  >
                    {passwordStrength.label}
                  </p>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                    {[
                      {
                        label: "12+ characters",
                        met: newPassword.length >= 12,
                      },
                      {
                        label: "1 uppercase letter",
                        met: /[A-Z]/.test(newPassword),
                      },
                      {
                        label: "1 lowercase letter",
                        met: /[a-z]/.test(newPassword),
                      },
                      { label: "1 digit", met: /[0-9]/.test(newPassword) },
                      {
                        label: "1 special character",
                        met: /[^A-Za-z0-9]/.test(newPassword),
                      },
                    ].map((req) => (
                      <div
                        key={req.label}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        {req.met ? (
                          <Check className="h-3 w-3 text-forest-500" />
                        ) : (
                          <X className="h-3 w-3 text-beige-400" />
                        )}
                        <span
                          className={
                            req.met ? "text-forest-600" : "text-beige-500"
                          }
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-500 hover:text-brown-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                {/* Match indicator */}
                {passwordsMatch && (
                  <span className="absolute right-10 top-1/2 -translate-y-1/2 text-forest-500">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Update Password Button */}
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleUpdatePassword}>
                Update Password
              </Button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-beige-200/60 my-8" />

          {/* ── MFA Settings ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-4 w-4 text-brown-500" />
              <h3 className="font-heading text-sm font-semibold text-brown-800">
                Multi-Factor Authentication (MFA)
              </h3>
            </div>

            {/* MFA Status Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-beige-100/40 border border-beige-200/50">
              <div className="flex items-center gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-brown-800">
                    MFA Status
                  </p>
                  <p className="text-xs text-beige-500">
                    {currentUser?.mfaEnrollmentRequired
                      ? "Enrollment required. Please set up MFA to secure your account."
                      : "Required by your organization. MFA cannot be disabled."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={mfaEnabled ? "teal" : "gold"} size="sm" dot>
                  {mfaEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch checked={mfaEnabled} disabled />
              </div>
            </div>

            {/* MFA Enrollment Required Warning */}
            {currentUser?.mfaEnrollmentRequired && !mfaEnabled && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-gold-50 border border-gold-200 text-gold-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed">
                  Your organization requires MFA. Complete setup below to avoid losing access.
                </p>
              </div>
            )}

            {/* MFA Method */}
            <div className="space-y-1.5">
              <Label>MFA Method</Label>
              <Select value={mfaMethod} onValueChange={setMfaMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select MFA method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totp">
                    Authenticator App (TOTP)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Authenticator App Setup (shown when TOTP selected) */}
            {mfaMethod === "totp" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* QR Code Placeholder */}
                  <div className="flex-shrink-0 h-36 w-36 rounded-xl bg-white border-2 border-dashed border-beige-300 flex flex-col items-center justify-center gap-2">
                    <QrCode className="h-12 w-12 text-beige-400" />
                    <span className="text-[10px] text-beige-400 font-medium">
                      QR Code
                    </span>
                  </div>

                  {/* Manual Key */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-brown-700 mb-1">
                        Manual Setup Key
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-beige-100 text-brown-700 px-3 py-1.5 rounded-lg font-mono tracking-wider border border-beige-200">
                          JBSW Y3DP EHPK 3PXP
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("JBSWY3DPEHPK3PXP");
                            toast.success("Key copied to clipboard.");
                          }}
                          className="text-beige-500 hover:text-brown-600 transition-colors cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-beige-500 leading-relaxed">
                      Scan the QR code with your authenticator app (Google
                      Authenticator, Authy, etc.) or enter the manual key above.
                    </p>
                  </div>
                </div>

                {/* Verification Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="verificationCode">
                    Verification Code
                  </Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerificationCode(val);
                    }}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    inputMode="numeric"
                    className="max-w-[200px] tracking-[0.3em] font-mono"
                  />
                  <p className="text-xs text-beige-500">
                    Enter the code from your authenticator app to verify setup.
                  </p>
                </div>
              </div>
            )}

            {/* Recovery Codes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brown-800">
                    Recovery Codes
                  </p>
                  <p className="text-xs text-beige-500">
                    Use these codes if you lose access to your authenticator.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                >
                  {showRecoveryCodes ? "Hide Codes" : "Show Codes"}
                </Button>
              </div>

              {showRecoveryCodes && (
                <div className="space-y-3">
                  {/* Warning Banner */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gold-50 border border-gold-200">
                    <AlertTriangle className="h-5 w-5 text-gold-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gold-800 leading-relaxed">
                      Store these codes safely. Each code can only be used once.
                      If you lose all recovery codes and your authenticator
                      device, you will need to contact support to regain access.
                    </p>
                  </div>

                  {/* Codes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MOCK_RECOVERY_CODES.map((code) => (
                      <div
                        key={code}
                        className="text-center py-2 px-3 rounded-lg bg-beige-100/60 border border-beige-200/50 font-mono text-xs text-brown-700 tracking-wider"
                      >
                        {code}
                      </div>
                    ))}
                  </div>

                  {/* Copy + Download */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyRecoveryCodes}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadRecoveryCodes}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 3: Notification Preferences                       */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <GlassCard variant="heavy" padding="lg">
        <GlassCardContent>
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-brown-950">
                Notification Preferences
              </h2>
              <p className="text-sm text-beige-600">
                Choose how you want to be notified about review activities.
              </p>
            </div>
          </div>

          {/* Column Headers */}
          <div className="flex items-center gap-3 mb-3 px-4">
            <div className="flex-1">
              <span className="text-xs font-semibold text-beige-500 uppercase tracking-wider">
                Event
              </span>
            </div>
            <div className="w-20 flex justify-center">
              <span className="text-xs font-semibold text-beige-500 uppercase tracking-wider flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </span>
            </div>
            <div className="w-20 flex justify-center">
              <span className="text-xs font-semibold text-beige-500 uppercase tracking-wider flex items-center gap-1">
                <Bell className="h-3 w-3" />
                In-App
              </span>
            </div>
          </div>

          {/* Notification Rows */}
          <div className="space-y-0 divide-y divide-beige-200/40">
            {/* New submission assigned for review */}
            <div className="flex items-center gap-3 py-3.5 px-4 rounded-lg hover:bg-beige-100/30 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-brown-800">
                  New submission assigned for review
                </p>
                <p className="text-xs text-beige-500 mt-0.5">
                  When a new deliverable is assigned to you for review.
                </p>
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.newSubmission.email}
                  onCheckedChange={() =>
                    toggleNotification("newSubmission", "email")
                  }
                />
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.newSubmission.inApp}
                  onCheckedChange={() =>
                    toggleNotification("newSubmission", "inApp")
                  }
                />
              </div>
            </div>

            {/* Review SLA approaching */}
            <div className="flex items-center gap-3 py-3.5 px-4 rounded-lg hover:bg-beige-100/30 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-brown-800">
                  Review SLA approaching (T-24h)
                </p>
                <p className="text-xs text-beige-500 mt-0.5">
                  Reminder 24 hours before the review deadline.
                </p>
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.slaApproaching.email}
                  onCheckedChange={() =>
                    toggleNotification("slaApproaching", "email")
                  }
                />
              </div>
              <div className="w-20 flex justify-center">
                <div className="relative">
                  <Switch checked={notifications.slaApproaching.inApp} disabled />
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-beige-400 whitespace-nowrap">
                    Required
                  </span>
                </div>
              </div>
            </div>

            {/* Rework resubmission received */}
            <div className="flex items-center gap-3 py-3.5 px-4 rounded-lg hover:bg-beige-100/30 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-brown-800">
                  Rework resubmission received
                </p>
                <p className="text-xs text-beige-500 mt-0.5">
                  When a contributor resubmits a deliverable after rework.
                </p>
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.reworkResubmission.email}
                  onCheckedChange={() =>
                    toggleNotification("reworkResubmission", "email")
                  }
                />
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.reworkResubmission.inApp}
                  onCheckedChange={() =>
                    toggleNotification("reworkResubmission", "inApp")
                  }
                />
              </div>
            </div>

            {/* Contributor question in Workroom Q&A */}
            <div className="flex items-center gap-3 py-3.5 px-4 rounded-lg hover:bg-beige-100/30 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-brown-800">
                  Contributor question in Workroom Q&A
                </p>
                <p className="text-xs text-beige-500 mt-0.5">
                  When a contributor asks a question in the project workroom.
                </p>
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.contributorQuestion.email}
                  onCheckedChange={() =>
                    toggleNotification("contributorQuestion", "email")
                  }
                />
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.contributorQuestion.inApp}
                  onCheckedChange={() =>
                    toggleNotification("contributorQuestion", "inApp")
                  }
                />
              </div>
            </div>

            {/* Project blueprint published */}
            <div className="flex items-center gap-3 py-3.5 px-4 rounded-lg hover:bg-beige-100/30 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-brown-800">
                  Project blueprint published (FYI)
                </p>
                <p className="text-xs text-beige-500 mt-0.5">
                  Informational alert when a new blueprint is published.
                </p>
              </div>
              <div className="w-20 flex justify-center">
                <div className="text-xs text-beige-400 italic">N/A</div>
              </div>
              <div className="w-20 flex justify-center">
                <Switch
                  checked={notifications.blueprintPublished.inApp}
                  onCheckedChange={() =>
                    toggleNotification("blueprintPublished", "inApp")
                  }
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button variant="primary" onClick={handleSaveNotifications}>
              Save Notification Preferences
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
