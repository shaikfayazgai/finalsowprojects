"use client";

import * as React from "react";
import {
  Building2,
  Users,
  Globe,
  FileText,
  Rocket,
  Building,
  Heart,
  Landmark,
  GraduationCap,
  MoreHorizontal,
  Link2,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Check,
  Mail,
  Phone,
  User,
  Shield,
  Briefcase,
  Info,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import {
  Input,
  Label,
  Separator,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { SelectDropdown, CountrySelect } from "@/components/ui/select-dropdown";
import type { SelectOption } from "@/components/ui/select-dropdown";

/* ══════════════════════════════════════════
   Organisation Type Options
   ══════════════════════════════════════════ */
const ORG_TYPE_OPTIONS = [
  { value: "Startup", label: "Startup", subtitle: "Early-stage venture", icon: Rocket },
  { value: "SME", label: "SME", subtitle: "Small-to-mid size", icon: Building },
  { value: "Enterprise", label: "Enterprise", subtitle: "1,000+ employees", icon: Building2 },
  { value: "MNC", label: "MNC", subtitle: "Multinational corp.", icon: Globe },
  { value: "NGO", label: "NGO / Non-profit", subtitle: "Charity / foundation", icon: Heart },
  { value: "Government", label: "Government", subtitle: "Public sector body", icon: Landmark },
  { value: "Educational", label: "Educational", subtitle: "University / institute", icon: GraduationCap },
  { value: "Agency", label: "Agency", subtitle: "Consulting / staffing", icon: Users },
  { value: "Other", label: "Other", subtitle: "Custom organisation type", icon: MoreHorizontal },
] as const;

const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1 - 10", subtitle: "Solo / micro team" },
  { value: "11-50", label: "11 - 50", subtitle: "Small team" },
  { value: "51-200", label: "51 - 200", subtitle: "Growing team" },
  { value: "201-1000", label: "201 - 1,000", subtitle: "Mid-size company" },
  { value: "1001-5000", label: "1,001 - 5,000", subtitle: "Large company" },
  { value: "5001-10000", label: "5,001 - 10,000", subtitle: "Very large" },
  { value: "10000+", label: "10,000+", subtitle: "Global enterprise" },
] as const;

const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: "software-saas", label: "Software & SaaS" },
  { value: "fintech", label: "FinTech" },
  { value: "healthcare", label: "Healthcare & Life Sciences" },
  { value: "ecommerce", label: "E-Commerce & Retail" },
  { value: "edtech", label: "EdTech" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting & Professional Services" },
  { value: "media-entertainment", label: "Media & Entertainment" },
  { value: "real-estate", label: "Real Estate & Construction" },
  { value: "logistics", label: "Logistics & Supply Chain" },
  { value: "government", label: "Government & Public Sector" },
  { value: "non-profit", label: "Non-Profit & Social Impact" },
  { value: "other", label: "Other" },
];

const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "legal", label: "Legal" },
  { value: "executive", label: "Executive / C-Suite" },
  { value: "other", label: "Other" },
];

/* ══════════════════════════════════════════
   Section Header
   ══════════════════════════════════════════ */
function SectionHeader({
  icon: Icon,
  title,
  optional,
}: {
  icon: React.ElementType;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Icon style={{ width: 15, height: 15, color: "var(--ink-muted)" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {title}
      </span>
      {optional && (
        <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-faint)" }}>(optional · PDF · max 10 MB)</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Read-only field display
   ══════════════════════════════════════════ */
function ViewField({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="space-y-1">
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon style={{ width: 14, height: 14, color: "var(--ink-muted)" }} />}
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Form Data Interfaces
   ══════════════════════════════════════════ */
interface OrgProfileFormData {
  orgName: string;
  orgType: string;
  industry: string;
  companySize: string;
  websiteUrl: string;
  incorporationCountry: string;
  incorporationFile: File | null;
}

interface AdminFormData {
  firstName: string;
  lastName: string;
  phoneCode: string;
  phoneNumber: string;
  businessEmail: string;
  department: string;
  jobTitle: string;
}

interface SecurityFormData {
  password: string;
  confirmPassword: string;
  verifyPhoneCode: string;
  verifyPhone: string;
  phoneOtp: string;
  verifyEmail: string;
  emailOtp: string;
}

type FormErrors = Partial<Record<keyof OrgProfileFormData | keyof AdminFormData | keyof SecurityFormData, string>>;

/* ══════════════════════════════════════════
   Helper: get label from value
   ══════════════════════════════════════════ */
function getLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label || value || "—";
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */
export default function OrganizationProfilePage() {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  // Edit mode step tracking
  const [currentStep, _setCurrentStep] = React.useState(1);
  const [highestStep, setHighestStep] = React.useState(1);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const setCurrentStep = React.useCallback((step: number) => {
    _setCurrentStep(step);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Organisation data (simulated saved profile) ──
  const [formData, setFormData] = React.useState<OrgProfileFormData>({
    orgName: "Glimmora Technologies Pvt. Ltd.",
    orgType: "Startup",
    industry: "software-saas",
    companySize: "51-200",
    websiteUrl: "www.glimmora.com",
    incorporationCountry: "IN",
    incorporationFile: null,
  });

  // ── Admin data ──
  const [adminData, setAdminData] = React.useState<AdminFormData>({
    firstName: "Sai",
    lastName: "Kumar",
    phoneCode: "IN",
    phoneNumber: "9347623002",
    businessEmail: "sai@glimmora.com",
    department: "engineering",
    jobTitle: "CTO",
  });

  // ── Security data ──
  const [securityData, setSecurityData] = React.useState<SecurityFormData>({
    password: "",
    confirmPassword: "",
    verifyPhoneCode: "IN",
    verifyPhone: "9347623002",
    phoneOtp: "",
    verifyEmail: "sai@glimmora.com",
    emailOtp: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = React.useState(false);
  const [, setEmailOtpSent] = React.useState(false);
  const [phoneVerified, setPhoneVerified] = React.useState(true);
  const [emailVerified, setEmailVerified] = React.useState(true);
  const [phoneResendTimer, setPhoneResendTimer] = React.useState(0);
  const [emailResendTimer, setEmailResendTimer] = React.useState(0);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [dragActive, setDragActive] = React.useState(false);


  const updateField = <K extends keyof OrgProfileFormData>(key: K, value: OrgProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const updateAdminField = <K extends keyof AdminFormData>(key: K, value: AdminFormData[K]) => {
    setAdminData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const updateSecurityField = <K extends keyof SecurityFormData>(key: K, value: SecurityFormData[K]) => {
    setSecurityData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed"); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error("File size must be under 10 MB"); return; }
      updateField("incorporationFile", file);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed"); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error("File size must be under 10 MB"); return; }
      updateField("incorporationFile", file);
    }
  };

  const handleStep1Continue = () => {
    const errs: FormErrors = {};
    if (!formData.orgName.trim()) errs.orgName = "Organisation name is required";
    if (!formData.orgType) errs.orgType = "Select an organisation type";
    if (!formData.industry) errs.industry = "Select an industry";
    if (!formData.companySize) errs.companySize = "Select a company size";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setCurrentStep(2);
    setHighestStep((prev) => Math.max(prev, 2));
  };

  const handleStep2Continue = () => {
    const errs: FormErrors = {};
    if (!adminData.firstName.trim()) errs.firstName = "First name is required";
    if (!adminData.lastName.trim()) errs.lastName = "Last name is required";
    if (!adminData.phoneNumber.trim()) errs.phoneNumber = "Phone number is required";
    else if (adminData.phoneNumber.length !== 10) errs.phoneNumber = "Phone number must be exactly 10 digits";
    if (!adminData.businessEmail.trim()) errs.businessEmail = "Business email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.businessEmail)) errs.businessEmail = "Enter a valid email address";
    if (!adminData.jobTitle.trim()) errs.jobTitle = "Job title is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    toast.success("Administrator details saved!");
    setCurrentStep(3);
    setHighestStep((prev) => Math.max(prev, 3));
  };

  // Countdown timers for OTP resend
  React.useEffect(() => {
    if (phoneResendTimer <= 0) return;
    const interval = setInterval(() => setPhoneResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phoneResendTimer]);

  React.useEffect(() => {
    if (emailResendTimer <= 0) return;
    const interval = setInterval(() => setEmailResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailResendTimer]);

  const SAMPLE_PHONE_OTP = "123456";
  const SAMPLE_EMAIL_OTP = "654321";

  const handleSendPhoneOtp = () => {
    if (!securityData.verifyPhone.trim()) {
      setErrors((prev) => ({ ...prev, verifyPhone: "Enter a phone number" }));
      return;
    }
    if (securityData.verifyPhone.length !== 10) {
      setErrors((prev) => ({ ...prev, verifyPhone: "Phone number must be exactly 10 digits" }));
      return;
    }
    setPhoneOtpSent(true);
    setPhoneResendTimer(30);
    toast.success(`OTP sent! Use sample code: ${SAMPLE_PHONE_OTP}`);
  };

  const handleVerifyPhoneOtp = () => {
    if (!securityData.phoneOtp.trim() || securityData.phoneOtp.length < 6) {
      toast.error("Enter a valid 6-digit code");
      return;
    }
    if (securityData.phoneOtp !== SAMPLE_PHONE_OTP) {
      toast.error(`Invalid OTP. Try sample code: ${SAMPLE_PHONE_OTP}`);
      return;
    }
    setPhoneVerified(true);
    toast.success("Phone number verified!");
  };

  // Email OTP handlers removed — email is non-editable in edit mode
  void setEmailOtpSent; // suppress unused warning

  const passwordsMatch = securityData.password.length >= 8 && securityData.confirmPassword.length > 0 && securityData.password === securityData.confirmPassword;

  const handleStep3Continue = () => {
    const errs: FormErrors = {};
    if (!securityData.password.trim()) errs.password = "Password is required";
    else if (securityData.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!securityData.confirmPassword.trim()) errs.confirmPassword = "Please confirm your password";
    else if (securityData.password !== securityData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!securityData.verifyPhone.trim()) errs.verifyPhone = "Phone number is required";
    if (!securityData.verifyEmail.trim()) errs.verifyEmail = "Email is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    toast.success("Security setup complete!");
    setCurrentStep(4);
    setHighestStep((prev) => Math.max(prev, 4));
  };

  const handleEnterEditMode = () => {
    _setCurrentStep(1);
    setHighestStep(4);
    setErrors({});
    setEditDialogOpen(true);
  };

  const handleSaveAndExit = () => {
    toast.success("Profile updated successfully!");
    setEditDialogOpen(false);
  };

  // Org type display info
  const orgTypeOption = ORG_TYPE_OPTIONS.find((o) => o.value === formData.orgType);
  const OrgTypeIcon = orgTypeOption?.icon || Building2;

  /* ══════════════════════════════════════════════════════════════
     ████  VIEW MODE + EDIT DIALOG  ████
     ══════════════════════════════════════════════════════════════ */
  /* ── Card wrapper for view sections ── */
  const SectionCard = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-6" style={{ background: "var(--card-bg, #FFFFFF)", border: "1px solid var(--border-soft)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: "linear-gradient(135deg, rgba(166,119,99,0.12), rgba(136,97,81,0.08))" }}>
          <Icon style={{ width: 16, height: 16, color: "#A67763" }} />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.01em" }}>{title}</h2>
      </div>
      {children}
    </div>
  );

  /* ── Status badge ── */
  const VerifiedBadge = ({ verified }: { verified: boolean }) => (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 600, color: verified ? "#4D5741" : "#B45309", background: verified ? "rgba(77,87,65,0.08)" : "rgba(180,83,9,0.08)" }}>
      {verified ? <><Check style={{ width: 11, height: 11 }} /> Verified</> : "Not Verified"}
    </span>
  );

  return (
    <>
      <div className="min-h-full w-full" style={{ background: "var(--page-bg, #F6F1EF)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-8 lg:px-12 py-5">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "linear-gradient(145deg, #A67763, #886151)", border: "2px solid rgba(208,176,96,0.35)" }}
          >
            <User style={{ width: 20, height: 20, color: "#F4EFEB" }} />
          </div>
          <span className="font-heading" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
            User Profile
          </span>
        </div>

        <div className="w-full px-8 lg:px-12 py-6" style={{ maxWidth: 1400 }}>
          {/* Page heading + Edit button */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-heading" style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
                Organisation Profile
              </h1>
              <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>
                View your organisation, administrator, and security details
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnterEditMode}
              className="flex items-center gap-2 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] mt-1"
              style={{
                height: 36,
                paddingInline: 18,
                fontSize: 13,
                background: "linear-gradient(135deg, #A67763, #886151)",
                boxShadow: "0 1px 4px rgba(166,119,99,0.25)",
              }}
            >
              <Pencil style={{ width: 13, height: 13 }} />
              Edit Profile
            </button>
          </div>

          <div className="space-y-5">
            {/* ── ORGANISATION DETAILS CARD ── */}
            <SectionCard icon={Building2} title="Organisation Details">
              {/* Company Identity */}
              <div className="mb-5">
                <p className="flex items-center gap-1.5 mb-3" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  <Building2 style={{ width: 12, height: 12 }} /> Company Identity
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                  <ViewField label="Organisation Name" value={formData.orgName} icon={Building2} />
                  <ViewField label="Organisation Type" value={orgTypeOption?.label || "—"} icon={OrgTypeIcon} />
                  <ViewField label="Industry / Sector" value={getLabel(INDUSTRY_OPTIONS, formData.industry)} icon={Briefcase} />
                </div>
              </div>

              <Separator className="my-4 opacity-20" />

              {/* Scale & Reach */}
              <div className="mb-5 mt-4">
                <p className="flex items-center gap-1.5 mb-3" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  <Globe style={{ width: 12, height: 12 }} /> Scale & Reach
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                  <ViewField label="Company Size" value={getLabel(COMPANY_SIZE_OPTIONS, formData.companySize)} icon={Users} />
                  <ViewField label="Website URL" value={formData.websiteUrl || "—"} icon={Link2} />
                  <ViewField label="Country of Incorporation" value={formData.incorporationCountry === "IN" ? "India" : formData.incorporationCountry} icon={Globe} />
                </div>
              </div>

              <Separator className="my-4 opacity-20" />

              {/* Document */}
              <div className="mt-4">
                <p className="flex items-center gap-1.5 mb-3" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  <FileText style={{ width: 12, height: 12 }} /> Incorporation Document
                </p>
                {formData.incorporationFile ? (
                  <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-soft)", background: "rgba(166,119,99,0.04)", maxWidth: 400 }}>
                    <FileText style={{ width: 16, height: 16, color: "#A67763", flexShrink: 0 }} />
                    <span className="flex-1 truncate" style={{ fontSize: 13, color: "var(--ink)" }}>{formData.incorporationFile.name}</span>
                    <button type="button" className="flex items-center gap-1 text-[12px] font-semibold hover:underline" style={{ color: "#A67763" }}>
                      <Download style={{ width: 13, height: 13 }} /> Download
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic" }}>No document uploaded</p>
                )}
              </div>
            </SectionCard>

            {/* ── ADMINISTRATOR DETAILS CARD ── */}
            <SectionCard icon={User} title="Administrator Details">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <ViewField label="Full Name" value={`${adminData.firstName} ${adminData.lastName}`} icon={User} />
                <ViewField label="Phone Number" value={adminData.phoneNumber ? `+91 ${adminData.phoneNumber}` : "—"} icon={Phone} />
                <ViewField label="Business Email" value={adminData.businessEmail} icon={Mail} />
                <ViewField label="Department" value={getLabel(DEPARTMENT_OPTIONS, adminData.department)} icon={Briefcase} />
                <ViewField label="Job Title / Designation" value={adminData.jobTitle} icon={Shield} />
              </div>
            </SectionCard>

            {/* ── SECURITY CARD ── */}
            <SectionCard icon={Lock} title="Security">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <ViewField label="Password" value="••••••••" icon={Lock} />
                <div className="space-y-1">
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: "0.03em", textTransform: "uppercase" }}>Phone Verification</p>
                  <div className="flex items-center gap-2">
                    <Phone style={{ width: 14, height: 14, color: "var(--ink-muted)" }} />
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>+91 {securityData.verifyPhone}</p>
                    <VerifiedBadge verified={phoneVerified} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: "0.03em", textTransform: "uppercase" }}>Email Verification</p>
                  <div className="flex items-center gap-2">
                    <Mail style={{ width: 14, height: 14, color: "var(--ink-muted)" }} />
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{securityData.verifyEmail}</p>
                    <VerifiedBadge verified={emailVerified} />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         ████  EDIT PROFILE DIALOG  ████
         ══════════════════════════════════════════════════════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0" style={{ borderRadius: 16 }}>
          {/* Dialog Header */}
          <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--page-bg, #F6F1EF)" }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 36, height: 36, background: "linear-gradient(145deg, #A67763, #886151)", border: "2px solid rgba(208,176,96,0.35)" }}
              >
                <User style={{ width: 18, height: 18, color: "#F4EFEB" }} />
              </div>
              <span className="font-heading" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                Edit Profile
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditDialogOpen(false)}
              className="flex items-center gap-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
              style={{ height: 32, paddingInline: 14, fontSize: 12, color: "var(--ink-muted)", border: "1.5px solid var(--border-soft)" }}
            >
              <X style={{ width: 13, height: 13 }} /> Cancel
            </button>
          </div>

          {/* 4-step timeline */}
          <div className="flex items-center w-full px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div className="flex items-center w-full">
          {[
            { number: 1, label: "Organisation" },
            { number: 2, label: "Administrator" },
            { number: 3, label: "Security" },
            { number: 4, label: "Agreements" },
          ].map((step, idx, arr) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < highestStep || step.number < currentStep;
            return (
              <React.Fragment key={step.number}>
                <button
                  type="button"
                  onClick={() => {
                    if (step.number <= highestStep) {
                      setErrors({});
                      setCurrentStep(step.number);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all duration-200",
                    step.number <= highestStep ? "cursor-pointer hover:opacity-80" : "cursor-default"
                  )}
                >
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 14,
                      fontWeight: 700,
                      background: isActive || isCompleted ? "linear-gradient(135deg, #4D5741, #A67763)" : "rgba(166,119,99,0.08)",
                      color: isActive || isCompleted ? "#FFFFFF" : "var(--ink-faint)",
                      border: isActive || isCompleted ? "2px solid rgba(208,176,96,0.35)" : "2px solid transparent",
                    }}
                  >
                    {isCompleted && !isActive ? <Check style={{ width: 16, height: 16 }} /> : step.number}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: isActive || isCompleted ? 600 : 500, color: isActive || isCompleted ? "var(--ink)" : "var(--ink-faint)" }}>
                    {step.label}
                  </span>
                </button>
                {idx < arr.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: "0 12px", marginBottom: 22, background: isCompleted ? "linear-gradient(135deg, #4D5741, #A67763)" : "rgba(166,119,99,0.12)", borderRadius: 1 }} />
                )}
              </React.Fragment>
            );
          })}
            </div>
          </div>

          {/* Page content */}
          <div ref={contentRef} className="w-full px-6 py-6">

        {/* ═══════════════ STEP 1: Organisation Profile ═══════════════ */}
        {currentStep === 1 && (
          <>
            <div className="mb-2">
              <p style={{ fontSize: 11, fontWeight: 600, color: "#A67763", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>STEP 1 OF 4</p>
              <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Organisation Profile</h1>
              <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Tell us about your company so we can tailor the platform to your needs</p>
            </div>

            <div className="space-y-5 mt-5">
              <SectionHeader icon={Building2} title="Company Identity" />

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Organisation Name <span className="text-red-400">*</span></Label>
                <Input placeholder="Legal name of your organisation" value={formData.orgName} onChange={(e) => updateField("orgName", e.target.value)} error={errors.orgName} />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Organisation Type <span className="text-red-400">*</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  {ORG_TYPE_OPTIONS.map((opt) => {
                    const selected = formData.orgType === opt.value;
                    const OptIcon = opt.icon;
                    return (
                      <button key={opt.value} type="button" onClick={() => updateField("orgType", opt.value)}
                        className={cn("flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 transition-all duration-200 cursor-pointer text-center", selected ? "border-brown-400 bg-brown-50/50" : "border-transparent bg-beige-50/60 hover:border-beige-300")}
                        style={{ border: selected ? "2px solid #A67763" : "2px solid var(--border-soft)" }}
                      >
                        <OptIcon style={{ width: 20, height: 20, color: selected ? "#A67763" : "var(--ink-muted)" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>{opt.label}</span>
                        <span style={{ fontSize: 9, color: "var(--ink-faint)", lineHeight: 1.2 }}>{opt.subtitle}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.orgType && <p className="text-[11px] text-red-500 font-medium">{errors.orgType}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Industry / Sector <span className="text-red-400">*</span></Label>
                <SelectDropdown options={INDUSTRY_OPTIONS} value={formData.industry} onChange={(v) => updateField("industry", v)} placeholder="Select your industry" error={!!errors.industry} searchable={false} />
                {errors.industry && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.industry}</p>}
              </div>

              <SectionHeader icon={Globe} title="Scale & Reach" />

              <div className="space-y-2">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Company Size <span className="text-red-400">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_SIZE_OPTIONS.map((opt) => {
                    const selected = formData.companySize === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => updateField("companySize", opt.value)}
                        className={cn("flex items-center justify-between rounded-xl border-2 px-3 py-2.5 transition-all duration-200 cursor-pointer text-left", selected ? "border-brown-400 bg-brown-50/50" : "border-transparent bg-beige-50/60 hover:border-beige-300")}
                        style={{ border: selected ? "2px solid #A67763" : "2px solid var(--border-soft)" }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{opt.label}</span>
                        <span style={{ fontSize: 10, color: "var(--ink-faint)" }}>{opt.subtitle}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.companySize && <p className="text-[11px] text-red-500 font-medium">{errors.companySize}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Website URL</Label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 15, height: 15, color: "var(--ink-faint)" }} />
                  <Input placeholder="www.company.com" value={formData.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} className="pl-10" />
                </div>
              </div>

              <SectionHeader icon={Upload} title="Certification of Incorporation" optional />

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Country of Incorporation</Label>
                <CountrySelect value={formData.incorporationCountry} onChange={(v) => updateField("incorporationCountry", v)} />
              </div>

              <div className="space-y-1.5">
                {formData.incorporationFile ? (
                  <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-soft)", background: "rgba(166,119,99,0.04)" }}>
                    <FileText style={{ width: 16, height: 16, color: "#A67763", flexShrink: 0 }} />
                    <span className="flex-1 truncate" style={{ fontSize: 13, color: "var(--ink)" }}>{formData.incorporationFile.name}</span>
                    <button type="button" onClick={() => updateField("incorporationFile", null)} className="rounded-md p-1 hover:bg-beige-100 transition-colors">
                      <X style={{ width: 14, height: 14, color: "var(--ink-muted)" }} />
                    </button>
                  </div>
                ) : (
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all duration-200"
                    style={{ borderColor: dragActive ? "#A67763" : "var(--border-soft)", background: dragActive ? "rgba(166,119,99,0.04)" : "transparent" }}
                  >
                    <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
                    <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "rgba(166,119,99,0.08)", flexShrink: 0 }}>
                      <Upload style={{ width: 16, height: 16, color: "#A67763" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, color: "var(--ink)" }}>Drop here or <span style={{ color: "#A67763", fontWeight: 600, textDecoration: "underline" }}>browse files</span></p>
                      <p style={{ fontSize: 11, color: "var(--ink-faint)" }}>PDF only &middot; Max 10 MB</p>
                    </div>
                  </label>
                )}
              </div>

              <button type="button" onClick={handleStep1Continue}
                className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
                style={{ height: 48, fontSize: 15, background: "linear-gradient(135deg, #A67763, #886151)", boxShadow: "0 2px 8px rgba(166,119,99,0.25)", marginTop: 8 }}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ═══════════════ STEP 2: Primary Administrator ═══════════════ */}
        {currentStep === 2 && (
          <>
            <div className="mb-2">
              <p style={{ fontSize: 11, fontWeight: 600, color: "#A67763", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>STEP 2 OF 4</p>
              <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Primary Administrator</h1>
              <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Add the SPOC (Single Point of Contact) who will manage this enterprise account</p>
            </div>

            <div className="space-y-5 mt-5">
              <SectionHeader icon={User} title="Administrator Details" />

              {/* First + Last Name side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>First Name <span className="text-red-400">*</span></Label>
                  <Input placeholder="Enter first name" value={adminData.firstName} onChange={(e) => updateAdminField("firstName", e.target.value)} error={errors.firstName} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Last Name <span className="text-red-400">*</span></Label>
                  <Input placeholder="Enter last name" value={adminData.lastName} onChange={(e) => updateAdminField("lastName", e.target.value)} error={errors.lastName} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Phone Number <span className="text-red-400">*</span></Label>
                <div className="flex gap-3">
                  <div style={{ width: 110 }}>
                    <CountrySelect value={adminData.phoneCode} onChange={(v) => updateAdminField("phoneCode", v)} />
                  </div>
                  <div className="flex-1">
                    <Input placeholder="Work phone (with country code)" value={adminData.phoneNumber} onChange={(e) => updateAdminField("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} error={errors.phoneNumber} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Business Email <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 15, height: 15, color: "var(--ink-faint)" }} />
                  <Input type="email" value={adminData.businessEmail} disabled className="pl-10 opacity-70 cursor-not-allowed" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Lock style={{ width: 11, height: 11, color: "var(--ink-faint)" }} />
                  <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>Login email cannot be changed</p>
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 ml-auto" style={{ fontSize: 10, fontWeight: 600, color: "#4D5741", background: "rgba(77,87,65,0.08)" }}>
                    <Check style={{ width: 10, height: 10 }} /> Verified
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Department <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-faint)" }}>(optional)</span></Label>
                <SelectDropdown options={DEPARTMENT_OPTIONS} value={adminData.department} onChange={(v) => updateAdminField("department", v)} placeholder="Select your department" searchable={false} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Job Title / Designation <span className="text-red-400">*</span></Label>
                <Input placeholder="Job title or designation" value={adminData.jobTitle} onChange={(e) => updateAdminField("jobTitle", e.target.value)} error={errors.jobTitle} />
              </div>

              <div className="flex gap-3 rounded-xl p-4" style={{ background: "rgba(166,119,99,0.06)", border: "1px solid rgba(166,119,99,0.12)" }}>
                <Info style={{ width: 18, height: 18, color: "#A67763", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  The administrator account has full access to the enterprise dashboard, billing, team management, and task workflows. Additional sub-admins can be invited after setup.
                </p>
              </div>

              <button type="button" onClick={handleStep2Continue}
                className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
                style={{ height: 48, fontSize: 15, background: "linear-gradient(135deg, #A67763, #886151)", boxShadow: "0 2px 8px rgba(166,119,99,0.25)", marginTop: 8 }}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              <button type="button" onClick={() => { setErrors({}); setCurrentStep(1); }}
                className="w-full flex items-center justify-center gap-2 font-semibold transition-all duration-200 hover:opacity-80"
                style={{ fontSize: 14, color: "var(--ink-muted)" }}
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            </div>
          </>
        )}

        {/* ═══════════════ STEP 3: Account Security ═══════════════ */}
        {currentStep === 3 && (
          <>
            <div className="mb-2">
              <p style={{ fontSize: 11, fontWeight: 600, color: "#A67763", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>STEP 3 OF 4</p>
              <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Account Security</h1>
              <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Create a password and verify the administrator phone number and email address</p>
            </div>

            <div className="space-y-5 mt-5">
              <SectionHeader icon={Lock} title="Password" />

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  Password <span className="text-red-400">*</span> <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-faint)" }}>(min 8 characters)</span>
                </Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password (min 8 characters)" value={securityData.password} onChange={(e) => updateSecurityField("password", e.target.value)} error={errors.password} className="pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-beige-100 transition-colors">
                    {showPassword ? <EyeOff style={{ width: 16, height: 16, color: "var(--ink-faint)" }} /> : <Eye style={{ width: 16, height: 16, color: "var(--ink-faint)" }} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Confirm Password <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password to confirm" value={securityData.confirmPassword} onChange={(e) => updateSecurityField("confirmPassword", e.target.value)} error={errors.confirmPassword} className="pr-11" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-beige-100 transition-colors">
                    {showConfirmPassword ? <EyeOff style={{ width: 16, height: 16, color: "var(--ink-faint)" }} /> : <Eye style={{ width: 16, height: 16, color: "var(--ink-faint)" }} />}
                  </button>
                </div>
                {securityData.confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {passwordsMatch ? (
                      <><Check style={{ width: 14, height: 14, color: "#4D5741" }} /><span style={{ fontSize: 12, fontWeight: 500, color: "#4D5741" }}>Passwords match</span></>
                    ) : (
                      <><X style={{ width: 14, height: 14, color: "#c0392b" }} /><span style={{ fontSize: 12, fontWeight: 500, color: "#c0392b" }}>Passwords do not match</span></>
                    )}
                  </div>
                )}
              </div>

              {/* Phone Number — bordered card */}
              <div className="rounded-xl p-4 space-y-3" style={{ border: "1px solid var(--border-soft)" }}>
                <SectionHeader icon={Smartphone} title="Phone Number" />
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Mobile Number <span className="text-red-400">*</span></Label>
                  <div className="flex gap-2">
                    <div style={{ width: 100 }}><CountrySelect value={securityData.verifyPhoneCode} onChange={(v) => updateSecurityField("verifyPhoneCode", v)} /></div>
                    <div className="flex-1"><Input placeholder="Work phone (with country code)" value={securityData.verifyPhone} onChange={(e) => updateSecurityField("verifyPhone", e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} error={errors.verifyPhone} /></div>
                    <button type="button" onClick={handleSendPhoneOtp} disabled={phoneResendTimer > 0}
                      className="flex items-center justify-center rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shrink-0 disabled:opacity-60"
                      style={{ height: 42, paddingInline: 14, fontSize: 12, background: "linear-gradient(135deg, #A67763, #886151)", boxShadow: "0 1px 4px rgba(166,119,99,0.25)" }}
                    >
                      Send OTP
                    </button>
                  </div>
                </div>
                {phoneOtpSent && !phoneVerified && (
                  <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(166,119,99,0.04)", border: "1px solid rgba(166,119,99,0.10)" }}>
                    <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>A 6-digit code was sent to <span style={{ fontWeight: 600, color: "var(--ink)" }}>+91{securityData.verifyPhone}</span>. Valid for 5 minutes.</p>
                    <div className="flex gap-2">
                      <Input placeholder="Enter 6-digit code" value={securityData.phoneOtp} onChange={(e) => updateSecurityField("phoneOtp", e.target.value.replace(/\D/g, "").slice(0, 6))} className="font-mono tracking-widest" />
                      <button type="button" onClick={handleVerifyPhoneOtp} className="flex items-center justify-center gap-1 rounded-lg font-semibold text-white shrink-0" style={{ height: 42, paddingInline: 14, fontSize: 12, background: "linear-gradient(135deg, #A67763, #886151)" }}>
                        Verify <ArrowRight style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: phoneResendTimer > 0 ? "var(--ink-faint)" : "#A67763", fontWeight: 500 }}>
                      {phoneResendTimer > 0 ? `Resend in ${phoneResendTimer}s` : <button type="button" onClick={handleSendPhoneOtp} className="hover:underline" style={{ color: "#A67763" }}>Resend code</button>}
                    </p>
                  </div>
                )}
                {phoneVerified && <div className="flex items-center gap-2"><Check style={{ width: 14, height: 14, color: "#4D5741" }} /><span style={{ fontSize: 12, fontWeight: 500, color: "#4D5741" }}>Phone verified</span></div>}
              </div>

              {/* Email — read-only */}
              <div className="rounded-xl p-4 space-y-3" style={{ border: "1px solid var(--border-soft)" }}>
                <SectionHeader icon={Mail} title="Email Address" />
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Login Email</Label>
                  <Input type="email" value={securityData.verifyEmail} disabled className="opacity-70 cursor-not-allowed" />
                  <div className="flex items-center gap-2 mt-1">
                    <Lock style={{ width: 11, height: 11, color: "var(--ink-faint)" }} />
                    <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>Login email cannot be changed</p>
                    <span className="flex items-center gap-1 rounded-full px-2 py-0.5 ml-auto" style={{ fontSize: 10, fontWeight: 600, color: "#4D5741", background: "rgba(77,87,65,0.08)" }}>
                      <Check style={{ width: 10, height: 10 }} /> Verified
                    </span>
                  </div>
                </div>
              </div>

              <button type="button" onClick={handleStep3Continue}
                className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
                style={{ height: 48, fontSize: 15, background: "linear-gradient(135deg, #A67763, #886151)", boxShadow: "0 2px 8px rgba(166,119,99,0.25)", marginTop: 8 }}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              <button type="button" onClick={() => { setErrors({}); setCurrentStep(2); }}
                className="w-full flex items-center justify-center gap-2 font-semibold transition-all duration-200 hover:opacity-80"
                style={{ fontSize: 14, color: "var(--ink-muted)" }}
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            </div>
          </>
        )}

        {/* ═══════════════ STEP 4: Agreements ═══════════════ */}
        {currentStep === 4 && (
          <>
            <div className="mb-2">
              <p style={{ fontSize: 11, fontWeight: 600, color: "#A67763", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>STEP 4 OF 4</p>
              <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Agreements</h1>
              <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Review and accept the terms to complete your registration</p>
            </div>

            <div className="space-y-5 mt-5">
              <SectionHeader icon={FileText} title="Legal Agreements" />

              <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(166,119,99,0.04)", border: "1px solid rgba(166,119,99,0.10)" }}>
                <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                  By saving your changes, you agree to the following:
                </p>
                <div className="space-y-2.5">
                  <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 group" style={{ fontSize: 13, color: "#A67763", fontWeight: 600 }}>
                    <FileText style={{ width: 14, height: 14 }} />
                    <span className="group-hover:underline">Terms & Conditions</span>
                    <ArrowRight style={{ width: 12, height: 12, opacity: 0.6 }} />
                  </a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 group" style={{ fontSize: 13, color: "#A67763", fontWeight: 600 }}>
                    <Shield style={{ width: 14, height: 14 }} />
                    <span className="group-hover:underline">Privacy Policy</span>
                    <ArrowRight style={{ width: 12, height: 12, opacity: 0.6 }} />
                  </a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 group" style={{ fontSize: 13, color: "#A67763", fontWeight: 600 }}>
                    <Users style={{ width: 14, height: 14 }} />
                    <span className="group-hover:underline">Anti-Harassment Policy</span>
                    <ArrowRight style={{ width: 12, height: 12, opacity: 0.6 }} />
                  </a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 group" style={{ fontSize: 13, color: "#A67763", fontWeight: 600 }}>
                    <FileText style={{ width: 14, height: 14 }} />
                    <span className="group-hover:underline">Data Processing Agreement</span>
                    <ArrowRight style={{ width: 12, height: 12, opacity: 0.6 }} />
                  </a>
                </div>
              </div>

              <button type="button" onClick={handleSaveAndExit}
                className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
                style={{ height: 48, fontSize: 15, background: "linear-gradient(135deg, #4D5741, #A67763)", boxShadow: "0 2px 8px rgba(77,87,65,0.25)", marginTop: 8 }}
              >
                <Check className="w-4 h-4" /> Save Changes
              </button>

              <button type="button" onClick={() => { setErrors({}); setCurrentStep(3); }}
                className="w-full flex items-center justify-center gap-2 font-semibold transition-all duration-200 hover:opacity-80"
                style={{ fontSize: 14, color: "var(--ink-muted)" }}
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            </div>
          </>
        )}

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
