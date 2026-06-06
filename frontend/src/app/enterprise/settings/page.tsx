"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  ShieldCheck,
  Bell,
  CreditCard,
  Upload,
  Globe,
  Mail,
  MapPin,
  Info,
  Plus,
  Download,
  Eye,
  FileSignature,
  Lock,
  Trash2,
  UserMinus,
  Settings2,
  CalendarDays,
  Crown,
  Phone,
  X,
  Check,
  AlertCircle,
  ChevronRight,
  Send,
  User,
  Pencil,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { sowApi } from "@/lib/api/sow";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEnterpriseCompanyStore } from "@/lib/stores/enterprise-company-store";
import { authApi } from "@/lib/api/auth";
import { ApiError, fetchInternal } from "@/lib/api/client";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import ProfilePage from "@/app/enterprise/profile/page";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Separator,
  Checkbox,
} from "@/components/ui";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

type TabId = "profile" | "company" | "team" | "compliance" | "notifications" | "billing";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Invited" | "Expired" | "Deactivated";
  lastActive: string;
  projectAccess: string[];
}

interface NotificationSetting {
  id: string;
  label: string;
  email: boolean;
  inApp: boolean;
  digest: "Real-time" | "Daily" | "Weekly";
  digestOptions: ("Real-time" | "Daily" | "Weekly")[];
  locked: boolean;
}

/* ══════════════════════════════════════════
   Mock Data
   ══════════════════════════════════════════ */

const mockProjects = ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"];

const initialTeamMembers: TeamMember[] = [
  { id: "1", name: "Rahul Sharma", email: "rahul@acmetech.in", role: "Reviewer", status: "Active", lastActive: "25 Mar 2026 09:15", projectAccess: ["Project Alpha", "Project Beta"] },
  { id: "2", name: "Sneha Patel", email: "sneha@acmetech.in", role: "Reviewer", status: "Active", lastActive: "24 Mar 2026 16:42", projectAccess: ["Project Alpha", "Project Gamma"] },
  { id: "3", name: "Amit Kumar", email: "amit@acmetech.in", role: "Reviewer", status: "Invited", lastActive: "Never", projectAccess: ["Project Beta"] },
  { id: "4", name: "Deepa Menon", email: "deepa@acmetech.in", role: "Reviewer", status: "Expired", lastActive: "Never", projectAccess: [] },
];

const initialNotifications: NotificationSetting[] = [
  { id: "n1", label: "Blueprint ready for review", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time", "Daily", "Weekly"], locked: false },
  { id: "n2", label: "Evidence pack submitted — action required", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time", "Daily"], locked: false },
  { id: "n3", label: "Payment auto-release warning", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time"], locked: true },
  { id: "n4", label: "Escalation response received", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time"], locked: true },
  { id: "n5", label: "Project milestone overdue", email: true, inApp: true, digest: "Daily", digestOptions: ["Daily", "Weekly"], locked: false },
  { id: "n6", label: "New Reviewer accepted invite", email: true, inApp: false, digest: "Real-time", digestOptions: ["Real-time", "Daily"], locked: false },
  { id: "n7", label: "Rework response submitted", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time", "Daily"], locked: false },
  { id: "n8", label: "Payment auto-released by APG", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time"], locked: true },
  { id: "n9", label: "Company verification status update", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time"], locked: true },
  { id: "n10", label: "SOW processing complete", email: true, inApp: true, digest: "Real-time", digestOptions: ["Real-time"], locked: true },
];

/* ══════════════════════════════════════════
   Tab config
   ══════════════════════════════════════════ */

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "team", label: "Team Members", icon: Users },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Subscription", icon: CreditCard },
];

/* ══════════════════════════════════════════
   Helper: Status Badge
   ══════════════════════════════════════════ */

function StatusBadge({ status }: { status: TeamMember["status"] }) {
  const map: Record<TeamMember["status"], { variant: "teal" | "gold" | "danger" | "beige"; dot: boolean }> = {
    Active: { variant: "teal", dot: true },
    Invited: { variant: "gold", dot: true },
    Expired: { variant: "danger", dot: true },
    Deactivated: { variant: "beige", dot: true },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant} size="sm" dot={cfg.dot}>{status}</Badge>;
}

/* ══════════════════════════════════════════
   Settings Page
   ══════════════════════════════════════════ */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  /* ── Session + store data (backend API) ── */
  const { data: session } = useSession();
  const { registrationData, onboardingProgress } = useAuthStore();
  const storedCompany = useEnterpriseCompanyStore((s) => s.company);
  const setCompanyInStore = useEnterpriseCompanyStore((s) => s.setCompany);
  const accessToken = (session as any)?.user?.accessToken ?? "";
  console.log("FULL SESSION:", session);

  /* ── Company Profile state — seeded from local store first, then registration/onboarding ── */
  const [companyName, setCompanyName] = useState(storedCompany.companyName || registrationData?.companyName || "");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [industryType, setIndustryType] = useState(storedCompany.industryType || registrationData?.industry || "Technology");
  const [companySize, setCompanySize] = useState(storedCompany.companySize || registrationData?.companySize || "51-200");
  const [addressLine1, setAddressLine1] = useState(storedCompany.addressLine1 || onboardingProgress?.step1?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(storedCompany.addressLine2 || onboardingProgress?.step1?.addressLine2 || "");
  const [city, setCity] = useState(storedCompany.city || onboardingProgress?.step1?.city || "");
  const [addrState, setAddrState] = useState(storedCompany.addrState || onboardingProgress?.step1?.stateProvince || "");
  const [postalCode, setPostalCode] = useState(storedCompany.postalCode || onboardingProgress?.step1?.postalCode || "");
  const [country, setCountry] = useState(storedCompany.country || registrationData?.countryOfIncorporation || "");
  const [website, setWebsite] = useState(storedCompany.website || registrationData?.website || "");
  const [primaryEmail, setPrimaryEmail] = useState(storedCompany.primaryEmail || registrationData?.adminEmail || "");
  const [taxId, setTaxId] = useState(storedCompany.taxId || onboardingProgress?.step1?.taxId || "");
  const [verificationStatus] = useState<"verified" | "pending" | "rejected">("verified");
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  /* ── Sync primaryEmail from session once loaded ── */
  useEffect(() => {
    if (!primaryEmail && session?.user?.email) {
      setPrimaryEmail(session.user.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  /* ── Team Members state ── */
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [addReviewerOpen, setAddReviewerOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newStatus, setNewStatus] = useState<"active" | "inactive">("active");
  const [newLanguage, setNewLanguage] = useState("");
  const [newTimeZone, setNewTimeZone] = useState("");
  const [editAccessOpen, setEditAccessOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editProjectAccess, setEditProjectAccess] = useState<string[]>([]);
  const [addError, setAddError] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  /* ── Compliance state ── */
  const [retentionPolicy, setRetentionPolicy] = useState("3 years");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");

  /* ── Notifications state ── */
  const [notifications, setNotifications] = useState<NotificationSetting[]>(initialNotifications);

  /* ── Billing state ── */
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesModalTitle, setSalesModalTitle] = useState("");

  /* ── Handlers ── */

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    setLogo(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetAddForm = () => {
    setNewEmail(""); setNewFirstName(""); setNewLastName("");
    setNewDesignation(""); setNewDepartment(""); setNewUsername("");
    setNewStatus("active"); setNewLanguage(""); setNewTimeZone("");
    setAddError("");
  };

  const handleAddReviewer = async () => {
    setAddError("");
    if (!newEmail || !newFirstName || !newLastName || !newDesignation || !newDepartment || !newUsername || !newLanguage || !newTimeZone) {
      setAddError("All fields are required.");
      return;
    }
    if (!newEmail.includes("@")) {
      setAddError("Please enter a valid email address.");
      return;
    }
    if (teamMembers.some((m) => m.email === newEmail)) {
      setAddError("A team member with this email already exists.");
      return;
    }

    setAddSaving(true);
    try {
      const adminName = session?.user?.name ?? "Enterprise Admin";
      const sessionAccessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;

      // Create the reviewer in the backend (single source of truth for the password).
      // If this throws, we must NOT email a locally-generated password — the backend
      // hasn't stored it and the reviewer would be unable to log in.
      const result = await authApi.createReviewer({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        designation: newDesignation,
        department: newDepartment,
        username: newUsername,
        language: newLanguage,
        timeZone: newTimeZone,
        invitedByName: adminName,
        accessToken: sessionAccessToken,
      });
      const tempPassword = result.temp_password;

      // Send welcome email via Gmail SMTP using the backend-issued password.
      const emailRes = await fetchInternal("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "welcome_reviewer",
          to: newEmail,
          payload: {
            firstName: newFirstName,
            loginEmail: newEmail,
            tempPassword,
            orgName: companyName || "Enterprise",
            dashboardUrl: `${window.location.origin}/enterprise/reviewer`,
            supportUrl: `${window.location.origin}/support`,
          },
        }),
      });
      if (!emailRes.ok) {
        const detail = await emailRes.json().catch(() => ({}));
        throw new Error(detail?.error ?? detail?.message ?? `Email send failed (HTTP ${emailRes.status}).`);
      }

      const member: TeamMember = {
        id: String(Date.now()),
        name: `${newFirstName} ${newLastName}`,
        email: newEmail,
        role: "Reviewer",
        status: "Invited",
        lastActive: "Never",
        projectAccess: [],
      };
      setTeamMembers((prev) => [...prev, member]);
      resetAddForm();
      setAddReviewerOpen(false);
      toast.success(`Welcome email sent to ${newEmail} with login credentials.`);
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes("already") || 
        err?.message?.toLowerCase().includes("exists")) {
      setAddError("A reviewer with this email already exists in the system.");
    } else {
      setAddError(err?.message ?? "Failed to send invitation. Please try again.");
    }
  } finally {
      setAddSaving(false);
    }
  };

  const handleDeactivate = (id: string) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: "Deactivated" as const } : m)));
  };

  const handleRemove = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleResendCredentials = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Invited" as const } : m))
    );
  };

  const handleEditAccessOpen = (member: TeamMember) => {
    setEditingMember(member);
    setEditProjectAccess(member.projectAccess);
    setEditAccessOpen(true);
  };

  const handleSaveAccess = () => {
    if (!editingMember) return;
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === editingMember.id ? { ...m, projectAccess: editProjectAccess } : m))
    );
    setEditAccessOpen(false);
    setEditingMember(null);
  };

  const toggleNotification = (id: string, field: "email" | "inApp") => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.locked ? { ...n, [field]: !n[field] } : n))
    );
  };

  const setDigest = (id: string, value: "Real-time" | "Daily" | "Weekly") => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, digest: value } : n))
    );
  };

  const openSalesModal = (title: string) => {
    setSalesModalTitle(title);
    setSalesModalOpen(true);
  };

  /* ══════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════ */

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">Settings</h1>
        <p className="text-sm text-beige-600 mt-1">
          Manage your company profile, team, compliance, notifications, and billing preferences.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* ── LEFT SIDEBAR ── */}
        <div className="md:w-64 shrink-0 md:sticky md:top-0 md:self-start">
          <GlassCard variant="heavy" padding="sm">
            <GlassCardContent>
              {/* Mobile: horizontal scroll, Desktop: vertical */}
              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap w-full text-left",
                        isActive
                          ? "bg-brown-100/80 text-brown-800 border-l-[3px] border-brown-500 shadow-sm"
                          : "text-beige-700 hover:bg-beige-100/60 hover:text-brown-700 border-l-[3px] border-transparent"
                      )}
                    >
                      <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-brown-600" : "text-beige-500")} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 min-w-0">
          {/* ═══════════════════════════════════
             TAB 0: My Profile
             ═══════════════════════════════════ */}
          {activeTab === "profile" && <ProfilePage />}

          {/* ═══════════════════════════════════
             TAB 1: Company Profile
             ═══════════════════════════════════ */}
          {activeTab === "company" && (
            <GlassCard variant="heavy" padding="lg">
              <GlassCardContent>
                {/* Section header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brown-100 text-brown-600">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-semibold text-brown-950">Company Profile</h2>
                      <p className="text-sm text-beige-600">Manage your organization&apos;s details and verification status.</p>
                    </div>
                  </div>
                  {!isEditingCompany ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingCompany(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingCompany(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm"
                        onClick={() => {
                          setCompanyInStore({
                            companyName,
                            industryType,
                            companySize,
                            addressLine1,
                            addressLine2,
                            city,
                            addrState,
                            postalCode,
                            country,
                            website,
                            primaryEmail,
                          });
                          setIsEditingCompany(false);
                          toast.success("Company profile saved successfully.");
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label className="text-brown-800">Company Name</Label>
                    {isEditingCompany ? (
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" />
                    ) : (
                      <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">
                        {companyName || "—"}
                      </div>
                    )}
                  </div>

                  {/* Company Logo */}
                  <div className="space-y-2">
                    <Label className="text-brown-800">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-xl border-2 border-dashed border-beige-300 flex items-center justify-center bg-beige-50/50 overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <Upload className="h-6 w-6 text-beige-400" />
                        )}
                      </div>
                      {isEditingCompany && (
                        <div className="space-y-2">
                          <label className="cursor-pointer">
                            <input type="file" accept=".png,.svg" className="hidden" onChange={handleLogoUpload} />
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-brown-300 text-sm font-medium text-brown-600 hover:bg-brown-50 transition-colors">
                              <Upload className="h-4 w-4" /> Upload Logo
                            </span>
                          </label>
                          <p className="text-xs text-beige-500">PNG or SVG, max 2MB, 200x200 to 2000x2000 px</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* Industry Type & Company Size */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-brown-800">Industry Type</Label>
                      {isEditingCompany ? (
                        <Select value={industryType} onValueChange={setIndustryType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", "Real Estate", "Other"].map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">{industryType}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-800">Company Size</Label>
                      {isEditingCompany ? (
                        <Select value={companySize} onValueChange={setCompanySize}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["1-10", "11-50", "51-200", "201-1000", "1001-5000", "5001-10000", "10000+"].map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">{companySize}</div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* Headquarters Address */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brown-500" />
                      <Label className="text-brown-800 text-base font-semibold">Headquarters Address</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(
                        [
                          { label: "Address Line 1", value: addressLine1, set: setAddressLine1, span: true },
                          { label: "Address Line 2", value: addressLine2, set: setAddressLine2, span: true },
                          { label: "City",        value: city,       set: setCity },
                          { label: "State",       value: addrState,  set: setAddrState },
                          { label: "Postal Code", value: postalCode, set: setPostalCode },
                          { label: "Country",     value: country,    set: setCountry },
                        ] as { label: string; value: string; set: (v: string) => void; span?: boolean }[]
                      ).map(({ label, value, set, span }) => (
                        <div key={label} className={cn("space-y-2", span && "md:col-span-2")}>
                          <Label className="text-brown-700 text-xs">{label}</Label>
                          {isEditingCompany ? (
                            <Input value={value} onChange={(e) => set(e.target.value)} />
                          ) : (
                            <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">{value || "—"}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* Website & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-brown-800 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Website URL
                      </Label>
                      {isEditingCompany ? (
                        <>
                          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                          {website && !website.startsWith("https://") && (
                            <p className="text-xs text-red-500">URL must begin with https://</p>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">{website || "—"}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-800 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> Primary Contact Email
                      </Label>
                      {isEditingCompany ? (
                        <Input type="email" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
                      ) : (
                        <div className="text-sm text-brown-950 py-2.5 px-3 rounded-xl bg-beige-50/50 border border-beige-200 min-h-[40px]">{primaryEmail || "—"}</div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* Tax ID & Verification — always readonly */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-brown-800">Tax ID / GSTIN</Label>
                      <Input value={taxId} disabled className="bg-beige-50/50" />
                      <p className="text-xs text-beige-500 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Edit via support — contact support@glimmora.com
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-800">Verification Status</Label>
                      <div className="flex items-center gap-3 mt-1">
                        {verificationStatus === "verified" && (
                          <Badge variant="teal" size="lg" dot>
                            <Check className="h-3.5 w-3.5" /> Verified
                          </Badge>
                        )}
                        {verificationStatus === "pending" && (
                          <Badge variant="gold" size="lg" dot>Pending Review</Badge>
                        )}
                        {verificationStatus === "rejected" && (
                          <div className="space-y-2">
                            <Badge variant="danger" size="lg" dot>Rejected</Badge>
                            <p className="text-xs text-red-600">Reason: Document quality insufficient. Please re-upload.</p>
                            <Button variant="outline" size="sm">
                              <Upload className="h-3.5 w-3.5" /> Re-upload Document
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* ═══════════════════════════════════
             TAB 2: Team Members
             ═══════════════════════════════════ */}
          {activeTab === "team" && (
            <GlassCard variant="heavy" padding="lg">
              <GlassCardContent>
                {/* Section header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-teal-100 text-teal-600">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-semibold text-brown-950">Team Members</h2>
                      <p className="text-sm text-beige-600">Manage reviewers and their project access.</p>
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => setAddReviewerOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Reviewer
                  </Button>
                </div>

                {/* Team Table */}
                <div className="rounded-xl border border-beige-200/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-beige-50/60">
                        <TableHead className="text-brown-700 font-semibold">Name</TableHead>
                        <TableHead className="text-brown-700 font-semibold">Email</TableHead>
                        <TableHead className="text-brown-700 font-semibold">Role</TableHead>
                        <TableHead className="text-brown-700 font-semibold">Status</TableHead>
                        <TableHead className="text-brown-700 font-semibold">Last Active</TableHead>
                        <TableHead className="text-brown-700 font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id} className="hover:bg-beige-50/40">
                          <TableCell className="font-medium text-brown-900">{member.name}</TableCell>
                          <TableCell className="text-beige-700">{member.email}</TableCell>
                          <TableCell>
                            <Badge variant="brown" size="sm">Reviewer</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={member.status} />
                          </TableCell>
                          <TableCell className="text-beige-600 text-sm">{member.lastActive}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAccessOpen(member)}
                              >
                                <Settings2 className="h-3.5 w-3.5" /> Access
                              </Button>
                              {member.status === "Expired" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendCredentials(member.id)}
                                  className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                >
                                  <Send className="h-3.5 w-3.5" /> Resend
                                </Button>
                              )}
                              {member.status !== "Deactivated" && member.status !== "Expired" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeactivate(member.id)}
                                  className="text-gold-700 hover:text-gold-800 hover:bg-gold-50"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(member.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* ═══════════════════════════════════
             TAB 3: Compliance
             ═══════════════════════════════════ */}
          {activeTab === "compliance" && (
            <GlassCard variant="heavy" padding="lg">
              <GlassCardContent>
                {/* Section header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-forest-100 text-forest-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-brown-950">Compliance</h2>
                    <p className="text-sm text-beige-600">Data retention, legal agreements, and audit controls.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Data Retention Policy */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-brown-800">Data Retention Policy</h3>
                    <div className="max-w-xs">
                      <Select value={retentionPolicy} onValueChange={setRetentionPolicy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["1 year", "3 years", "5 years", "7 years"].map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-beige-500">
                      Data older than the retention period will be automatically archived per compliance policy.
                    </p>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* NDA Status */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-brown-800">Non-Disclosure Agreement (NDA)</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="teal" size="lg" dot>
                        <FileSignature className="h-3.5 w-3.5" /> Signed
                      </Badge>
                      <span className="text-sm text-beige-600">Signed on 10 Jan 2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3.5 w-3.5" /> View NDA
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileSignature className="h-3.5 w-3.5" /> Re-sign
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* DPA Status */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-brown-800">Data Processing Agreement (DPA)</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="teal" size="lg" dot>
                        <FileSignature className="h-3.5 w-3.5" /> Signed
                      </Badge>
                      <span className="text-sm text-beige-600">Signed on 10 Jan 2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3.5 w-3.5" /> View DPA
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileSignature className="h-3.5 w-3.5" /> Re-sign
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* Data Subject Requests */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-brown-800">Data Subject Requests</h3>
                    <p className="text-xs text-beige-500">Submit GDPR/DPDP data requests on behalf of your organization.</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button variant="outline" size="sm">
                        <Download className="h-3.5 w-3.5" /> Submit Data Export Request
                      </Button>
                      <Button variant="danger" size="sm">
                        <Trash2 className="h-3.5 w-3.5" /> Submit Data Deletion Request
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* Audit Log Export */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-brown-800">Audit Log Export</h3>
                    <p className="text-xs text-beige-500">Download a full activity log for your organization within a date range.</p>
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-brown-700">Start Date</Label>
                        <Input
                          type="date"
                          value={auditStartDate}
                          onChange={(e) => setAuditStartDate(e.target.value)}
                          className="w-44"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-brown-700">End Date</Label>
                        <Input
                          type="date"
                          value={auditEndDate}
                          onChange={(e) => setAuditEndDate(e.target.value)}
                          className="w-44"
                        />
                      </div>
                      <Button variant="primary" size="sm">
                        <Download className="h-3.5 w-3.5" /> Download Full Activity Log — CSV
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* ═══════════════════════════════════
             TAB 4: Notifications
             ═══════════════════════════════════ */}
          {activeTab === "notifications" && (
            <GlassCard variant="heavy" padding="lg">
              <GlassCardContent>
                {/* Section header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gold-100 text-gold-700">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-brown-950">Notifications</h2>
                    <p className="text-sm text-beige-600">Configure how and when you receive alerts.</p>
                  </div>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-gold-50/80 border border-gold-200/60 mb-6">
                  <Lock className="h-4 w-4 text-gold-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-gold-800">
                    Notifications with financial impact cannot be disabled. These are marked with a lock icon.
                  </p>
                </div>

                {/* Notification Table */}
                <div className="rounded-xl border border-beige-200/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-beige-50/60">
                        <TableHead className="text-brown-700 font-semibold">Event</TableHead>
                        <TableHead className="text-brown-700 font-semibold text-center w-20">Email</TableHead>
                        <TableHead className="text-brown-700 font-semibold text-center w-20">In-App</TableHead>
                        <TableHead className="text-brown-700 font-semibold w-36">Digest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((n) => (
                        <TableRow key={n.id} className={cn("hover:bg-beige-50/40", n.locked && "bg-beige-50/30")}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-brown-800">{n.label}</span>
                              {n.locked && <Lock className="h-3 w-3 text-gold-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={n.email}
                                onCheckedChange={() => toggleNotification(n.id, "email")}
                                disabled={n.locked}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={n.inApp}
                                onCheckedChange={() => toggleNotification(n.id, "inApp")}
                                disabled={n.locked}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={n.digest}
                              onValueChange={(v) => setDigest(n.id, v as "Real-time" | "Daily" | "Weekly")}
                              disabled={n.locked}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {n.digestOptions.map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end mt-6">
                  <Button variant="primary" size="lg">
                    Save Preferences
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* ═══════════════════════════════════
             TAB 5: Billing & Subscription
             ═══════════════════════════════════ */}
          {activeTab === "billing" && (
            <GlassCard variant="heavy" padding="lg">
              <GlassCardContent>
                {/* Section header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brown-100 text-brown-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-brown-950">Billing & Subscription</h2>
                    <p className="text-sm text-beige-600">View your plan details and manage your subscription.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Plan Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-beige-200/60 p-5 bg-beige-50/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-gold-600" />
                        <span className="text-xs font-semibold text-beige-600 uppercase tracking-wider">Current Plan</span>
                      </div>
                      <p className="text-lg font-heading font-semibold text-brown-950">Enterprise Edition</p>
                    </div>

                    <div className="rounded-xl border border-beige-200/60 p-5 bg-beige-50/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-semibold text-beige-600 uppercase tracking-wider">Renewal Date</span>
                      </div>
                      <p className="text-lg font-heading font-semibold text-brown-950">15 Aug 2026</p>
                    </div>

                    <div className="rounded-xl border border-beige-200/60 p-5 bg-beige-50/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-forest-600" />
                        <span className="text-xs font-semibold text-beige-600 uppercase tracking-wider">Seats Used / Available</span>
                      </div>
                      <p className="text-lg font-heading font-semibold text-brown-950">
                        5 <span className="text-beige-500 font-normal">/</span> 25
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-beige-200/50" />

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-brown-800">Manage Subscription</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary" onClick={() => openSalesModal("Add Seats")}>
                        <Plus className="h-4 w-4" /> Add Seats
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4" /> Download Subscription Invoice
                      </Button>
                      <Button variant="ghost" onClick={() => openSalesModal("Request Upgrade / Downgrade")}>
                        <ChevronRight className="h-4 w-4" /> Request Upgrade / Downgrade
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
         DIALOGS
         ═══════════════════════════════════ */}

      {/* Add Reviewer Dialog */}
      <Dialog open={addReviewerOpen} onOpenChange={(open) => { if (!open) { setAddReviewerOpen(false); resetAddForm(); } }}>
        <DialogContent className="sm:max-w-[420px] bg-[#F9F7F5] border border-beige-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #A67763, #D0B060)" }}
              >
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-brown-900 font-heading">Add Reviewer</DialogTitle>
                <DialogDescription className="text-beige-500 text-[12px]">
                  Invite a new reviewer to your organization. They will receive an email invitation.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {addError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {addError}
              </div>
            )}

            {/* Row 1: First Name + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">First Name <span className="text-red-400">*</span></label>
                <Input placeholder="First name" value={newFirstName} onChange={(e) => { setNewFirstName(e.target.value); setAddError(""); }} className="h-8 text-[12px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Last Name <span className="text-red-400">*</span></label>
                <Input placeholder="Last name" value={newLastName} onChange={(e) => { setNewLastName(e.target.value); setAddError(""); }} className="h-8 text-[12px]" />
              </div>
            </div>

            {/* Row 2: Email + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Email <span className="text-red-400">*</span></label>
                <Input type="email" placeholder="user@company.com" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setAddError(""); }} className="h-8 text-[12px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Role</label>
                <Input value="Reviewer" disabled className="h-8 text-[12px] bg-beige-50/50 text-beige-500" />
              </div>
            </div>

            {/* Row 3: Designation + Department */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Designation <span className="text-red-400">*</span></label>
                <Input placeholder="e.g. Senior Reviewer" value={newDesignation} onChange={(e) => { setNewDesignation(e.target.value); setAddError(""); }} className="h-8 text-[12px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Department <span className="text-red-400">*</span></label>
                <Input placeholder="e.g. Engineering" value={newDepartment} onChange={(e) => { setNewDepartment(e.target.value); setAddError(""); }} className="h-8 text-[12px]" />
              </div>
            </div>

            {/* Row 4: Username + Status */}
            <div className="grid grid-cols-2 gap-3 items-start">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Username <span className="text-red-400">*</span></label>
                <Input placeholder="username" value={newUsername} onChange={(e) => { setNewUsername(e.target.value); setAddError(""); }} className="h-8 text-[12px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Status</label>
                <div className="flex items-center gap-4 h-8 rounded-lg border border-beige-200 bg-white/60 px-3">
                  {(["active", "inactive"] as const).map((val) => (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="ar-status"
                        value={val}
                        checked={newStatus === val}
                        onChange={() => setNewStatus(val)}
                        className="accent-[#A67763] w-3 h-3"
                      />
                      <span className="text-[12px] text-brown-700 capitalize">{val}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 5: Language + Time Zone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Language <span className="text-red-400">*</span></label>
                <Select value={newLanguage} onValueChange={(v) => { setNewLanguage(v); setAddError(""); }}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brown-700 block">Time Zone <span className="text-red-400">*</span></label>
                <Select value={newTimeZone} onValueChange={(v) => { setNewTimeZone(v); setAddError(""); }}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="UTC+05:30">UTC +05:30 (IST)</SelectItem>
                    <SelectItem value="UTC-05:00">UTC -05:00 (ET)</SelectItem>
                    <SelectItem value="UTC+01:00">UTC +01:00 (CET)</SelectItem>
                    <SelectItem value="UTC+08:00">UTC +08:00 (SGT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setAddReviewerOpen(false); resetAddForm(); }}>
              Cancel
            </Button>
            <Button variant="gradient-primary" size="sm" onClick={handleAddReviewer} disabled={addSaving}>
              {addSaving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                : <><Mail className="w-3.5 h-3.5" />Send Invitation</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Access Dialog */}
      <Dialog open={editAccessOpen} onOpenChange={setEditAccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project Access</DialogTitle>
            <DialogDescription>
              {editingMember ? `Manage project access for ${editingMember.name}.` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {mockProjects.map((project) => (
              <label key={project} className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={editProjectAccess.includes(project)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setEditProjectAccess((prev) => [...prev, project]);
                    } else {
                      setEditProjectAccess((prev) => prev.filter((p) => p !== project));
                    }
                  }}
                />
                <span className="text-sm text-brown-700">{project}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccessOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAccess}>
              Save Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Contact Dialog */}
      <Dialog open={salesModalOpen} onOpenChange={setSalesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{salesModalTitle}</DialogTitle>
            <DialogDescription>
              Reach out to our sales team to make changes to your subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brown-100 text-brown-600 mx-auto">
              <Phone className="h-7 w-7" />
            </div>
            <p className="text-sm text-brown-700">
              Contact our sales team at
            </p>
            <a
              href="mailto:sales@glimmorateam.com"
              className="text-lg font-semibold text-teal-600 hover:underline"
            >
              sales@glimmorateam.com
            </a>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSalesModalOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
