"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  FileText,
  FolderKanban,
  CircleDollarSign,
  UserCog,
  BarChart3,
  Pencil,
  Trash2,
  Search,
  Info,
  Loader2,
  Check,
  Eye,
  UserPlus,
  Mail,
  CheckCircle2,
  Copy,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
// Direct initial/animate used instead of stagger variants (fixes Next.js client-nav animation bug)
import {
  Badge,
  Switch,
  Input,
  Label,
  Textarea,
  Checkbox,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import { mockRoles } from "@/mocks/data/enterprise-analytics";

/* ── Permission grid categories with sub-permissions ── */
const permissionGrid = [
  { key: "SOW", icon: FileText, permissions: { read: "sow:read", write: "sow:edit", full: "sow:*" } },
  { key: "Project", icon: FolderKanban, permissions: { read: "project:read", write: "project:edit", full: "project:*" } },
  { key: "Billing", icon: CircleDollarSign, permissions: { read: "billing:read", write: "billing:edit", full: "billing:*" } },
  { key: "Team", icon: Users, permissions: { read: "team:read", write: "team:edit", full: "team:*" } },
  { key: "Admin", icon: UserCog, permissions: { read: "admin:users", write: "admin:config", full: "admin:*" } },
  { key: "Analytics", icon: BarChart3, permissions: { read: "analytics:read", write: "analytics:cost", full: "analytics:*" } },
];

/* ── Human-readable permission labels ── */
const permissionLabels: Record<string, string> = {
  "sow:read": "SOW Read",
  "sow:edit": "SOW Write",
  "sow:*": "SOW Full",
  "project:read": "Project Read",
  "project:edit": "Project Write",
  "project:*": "Project Full",
  "billing:read": "Billing Read",
  "billing:edit": "Billing Write",
  "billing:*": "Billing Full",
  "team:read": "Team Read",
  "team:edit": "Team Write",
  "team:*": "Team Full",
  "admin:users": "Admin Users",
  "admin:config": "Admin Config",
  "admin:*": "Admin Full",
  "analytics:read": "Analytics Read",
  "analytics:cost": "Analytics Cost",
  "analytics:*": "Analytics Full",
};

/* ── Helper to check permission ── */
function hasPermission(rolePerms: string[], perm: string): boolean {
  return (
    rolePerms.includes(perm) ||
    rolePerms.some(
      (p) => p.endsWith(":*") && perm.startsWith(p.replace(":*", ":"))
    ) ||
    rolePerms.includes(perm.split(":")[0] + ":*")
  );
}

/* ── Pluralize helper ── */
function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

/* ════════════════════════════════════════
   USER MANAGEMENT — Types & Data
   ════════════════════════════════════════ */

interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  department: string;
  username: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean; // true on first login until password is reset
  language?: string;
  timeZone?: string;
}

/* ── Temp password generator ── */
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#$!";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base = [pick(upper), pick(upper), pick(lower), pick(lower), pick(digits), pick(digits), pick(special)];
  for (let i = 0; i < 3; i++) base.push(pick(upper + lower + digits));
  return base.sort(() => Math.random() - 0.5).join("");
}

/* ── Available roles (add more here to expand dropdown) ── */
const AVAILABLE_ROLES = [
  { value: "reviewer", label: "Reviewer" },
  // { value: "manager", label: "Manager" },  ← add future roles here
] as const;

/* ── Language options ── */
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
] as const;

/* ── Time zone options ── */
const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "UTC+05:30", label: "UTC +05:30 (India Standard Time)" },
  { value: "UTC-05:00", label: "UTC -05:00 (Eastern Time)" },
  { value: "UTC+01:00", label: "UTC +01:00 (Central European Time)" },
  { value: "UTC+08:00", label: "UTC +08:00 (Singapore Time)" },
] as const;

/* ── Seed mock users ── */
const initialMockUsers: ManagedUser[] = [
  {
    id: "u-001",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@company.com",
    designation: "Senior Reviewer",
    department: "Quality Assurance",
    username: "sjohnson",
    role: "reviewer",
    isActive: true,
    mustChangePassword: false,
    language: "English",
    timeZone: "UTC-5",
  },
  {
    id: "u-002",
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@company.com",
    designation: "Reviewer",
    department: "Engineering",
    username: "mchen",
    role: "reviewer",
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: "u-003",
    firstName: "Priya",
    lastName: "Sharma",
    email: "p.sharma@company.com",
    designation: "Lead Reviewer",
    department: "Compliance",
    username: "psharma",
    role: "reviewer",
    isActive: false,
    mustChangePassword: true,
    language: "English",
    timeZone: "UTC+5:30",
  },
];

/* ── User form initial state ── */
const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  designation: "",
  department: "",
  username: "",
  role: "reviewer",
  isActive: true,
  language: "",
  timeZone: "",
};

type UserFormState = typeof emptyUserForm;
type UserFormErrors = Partial<Record<keyof UserFormState, string>>;

/* ── Validation ── */
function validateUserForm(form: UserFormState): UserFormErrors {
  const errors: UserFormErrors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!form.designation.trim()) errors.designation = "Designation is required";
  if (!form.department.trim()) errors.department = "Department is required";
  if (!form.username.trim()) errors.username = "Username is required";
  if (!form.role) errors.role = "User role is required";
  if (!form.language) errors.language = "Language is required";
  if (!form.timeZone) errors.timeZone = "Time zone is required";
  return errors;
}

/* ── UserRoleDropdown — reusable role selector ── */
function UserRoleDropdown({
  value,
  onChange,
  id,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  hasError?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className={cn(hasError && "border-red-400 focus:ring-red-400")}
      >
        <SelectValue placeholder="Select user role" />
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── Field error message ── */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 font-medium mt-1">{message}</p>;
}

/* ── CreateUserDialog ── */
function CreateUserDialog({
  trigger,
  onCreated,
}: {
  trigger: React.ReactNode;
  onCreated: (user: Omit<ManagedUser, "id">) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "success">("form");
  const [form, setForm] = React.useState<UserFormState>(emptyUserForm);
  const [errors, setErrors] = React.useState<UserFormErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [tempPassword, setTempPassword] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const set = (field: keyof UserFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof UserFormErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleClose = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setForm(emptyUserForm);
      setErrors({});
      setStep("form");
      setTempPassword("");
      setCopied(false);
    }
  };

  const handleCreate = () => {
    const errs = validateUserForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    const pwd = generateTempPassword();
    setTimeout(() => {
      onCreated({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        designation: form.designation.trim(),
        department: form.department.trim(),
        username: form.username.trim(),
        role: form.role,
        isActive: form.isActive,
        mustChangePassword: true,
        language: form.language.trim() || undefined,
        timeZone: form.timeZone.trim() || undefined,
      });
      setTempPassword(pwd);
      setSaving(false);
      setStep("success");
    }, 600);
  };

  const handleCopyCredentials = () => {
    const text = `Login URL: https://app.glimmorateam.com/auth/login\nEmail: ${form.email.trim()}\nTemporary Password: ${tempPassword}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      // Fallback for non-HTTPS / unsupported environments
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLabel = AVAILABLE_ROLES.find((r) => r.value === form.role)?.label ?? form.role;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">

        {/* ── Step 1: Form ── */}
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-brown-900 font-heading">Create New User</DialogTitle>
              <DialogDescription className="text-beige-500">
                A temporary password will be auto-generated and emailed to the user.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[65vh] overflow-y-auto pr-1">
              <div className="space-y-4 py-4">

                {/* User Role — first field */}
                <div className="space-y-1.5">
                  <Label htmlFor="cu-role" className="text-[12px] text-brown-700">
                    User Role <span className="text-red-400">*</span>
                  </Label>
                  <UserRoleDropdown
                    id="cu-role"
                    value={form.role}
                    onChange={(v) => set("role", v)}
                    hasError={!!errors.role}
                  />
                  <FieldError message={errors.role} />
                </div>

                {/* First Name + Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-fname" className="text-[12px] text-brown-700">
                      First Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="cu-fname"
                      placeholder="First name"
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      className={cn(errors.firstName && "border-red-400")}
                    />
                    <FieldError message={errors.firstName} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-lname" className="text-[12px] text-brown-700">
                      Last Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="cu-lname"
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      className={cn(errors.lastName && "border-red-400")}
                    />
                    <FieldError message={errors.lastName} />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="cu-email" className="text-[12px] text-brown-700">
                    Email ID <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="cu-email"
                    type="email"
                    placeholder="user@company.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={cn(errors.email && "border-red-400")}
                  />
                  <FieldError message={errors.email} />
                </div>

                {/* Designation + Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-designation" className="text-[12px] text-brown-700">
                      Designation <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="cu-designation"
                      placeholder="e.g. Senior Reviewer"
                      value={form.designation}
                      onChange={(e) => set("designation", e.target.value)}
                      className={cn(errors.designation && "border-red-400")}
                    />
                    <FieldError message={errors.designation} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-dept" className="text-[12px] text-brown-700">
                      Department <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="cu-dept"
                      placeholder="e.g. Engineering"
                      value={form.department}
                      onChange={(e) => set("department", e.target.value)}
                      className={cn(errors.department && "border-red-400")}
                    />
                    <FieldError message={errors.department} />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="cu-username" className="text-[12px] text-brown-700">
                    Username <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="cu-username"
                    placeholder="username"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                    className={cn(errors.username && "border-red-400")}
                  />
                  <FieldError message={errors.username} />
                </div>

                {/* Active User toggle */}
                <div className="flex items-center justify-between rounded-xl border border-beige-200/50 bg-beige-50/40 px-4 py-3">
                  <div>
                    <p className="text-[13px] font-medium text-brown-800">Active User</p>
                    <p className="text-[11px] text-beige-500 mt-0.5">
                      User can log in and access the platform
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => set("isActive", v)}
                    aria-label="Active user toggle"
                  />
                </div>

                {/* Language + Time Zone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-lang" className="text-[12px] text-brown-700">
                      Language <span className="text-red-400">*</span>
                    </Label>
                    <Select value={form.language} onValueChange={(v) => set("language", v)}>
                      <SelectTrigger
                        id="cu-lang"
                        className={cn(errors.language && "border-red-400 focus:ring-red-400")}
                      >
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.language} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cu-tz" className="text-[12px] text-brown-700">
                      Time Zone <span className="text-red-400">*</span>
                    </Label>
                    <Select value={form.timeZone} onValueChange={(v) => set("timeZone", v)}>
                      <SelectTrigger
                        id="cu-tz"
                        className={cn(errors.timeZone && "border-red-400 focus:ring-red-400")}
                      >
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.timeZone} />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                variant="gradient-primary"
                size="sm"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    Create & Send Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Email sent confirmation ── */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-brown-900 font-heading">Invitation Sent</DialogTitle>
              <DialogDescription className="text-beige-500">
                An email with login credentials has been sent to {form.email.trim()}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Success banner */}
              <div className="flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-teal-700">
                    {form.firstName.trim()} {form.lastName.trim()} added as {roleLabel}
                  </p>
                  <p className="text-[11px] text-teal-600 mt-0.5">
                    They will be prompted to change their password on first login.
                  </p>
                </div>
              </div>

              {/* Email preview */}
              <div className="rounded-xl border border-beige-200/60 bg-beige-50/40 overflow-hidden">
                {/* Email header bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/70 border-b border-beige-100">
                  <Mail className="w-3.5 h-3.5 text-beige-400" />
                  <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
                    Email Preview
                  </span>
                </div>

                {/* Email body */}
                <div className="px-5 py-4 space-y-3 text-[12px] text-brown-700 leading-relaxed">
                  <p>
                    <span className="text-beige-500">To:</span>{" "}
                    <span className="font-medium">{form.email.trim()}</span>
                  </p>
                  <p>
                    <span className="text-beige-500">Subject:</span>{" "}
                    <span className="font-medium">
                      You&apos;ve been invited to GlimmoraTeam
                    </span>
                  </p>
                  <div className="border-t border-beige-100 pt-3 space-y-2">
                    <p>Hi {form.firstName.trim()},</p>
                    <p>
                      You&apos;ve been invited to join{" "}
                      <span className="font-semibold">GlimmoraTeam</span> as a{" "}
                      <span className="font-semibold">{roleLabel}</span>.
                    </p>
                    <p className="text-beige-500">Your login credentials:</p>
                    {/* Credentials box */}
                    <div className="rounded-lg bg-white border border-beige-200 px-4 py-3 space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-beige-500">Email</span>
                        <span className="font-semibold text-brown-800">{form.email.trim()}</span>
                      </div>
                      <div className="border-t border-beige-100" />
                      <div className="flex justify-between items-center">
                        <span className="text-beige-500">Temporary Password</span>
                        <span className="font-semibold text-brown-800 tracking-widest">{tempPassword}</span>
                      </div>
                      <div className="border-t border-beige-100" />
                      <div className="flex justify-between items-center">
                        <span className="text-beige-500">Login URL</span>
                        <span className="font-semibold text-teal-600">app.glimmorateam.com/auth/login</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-brown-500 font-medium">
                      ⚠ For security, the user will be asked to set a new password on first login.
                    </p>
                  </div>
                </div>
              </div>

              {/* Copy credentials button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCopyCredentials}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-500" />
                    Credentials copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy credentials to clipboard
                  </>
                )}
              </Button>
            </div>

            <DialogFooter>
              <Button variant="gradient-primary" size="sm" onClick={() => handleClose(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}

/* ── ViewUserDialog ── */
function ViewUserDialog({
  user,
  trigger,
}: {
  user: ManagedUser;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const roleLabel =
    AVAILABLE_ROLES.find((r) => r.value === user.role)?.label ?? user.role;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">User Details</DialogTitle>
          <DialogDescription className="text-beige-500">
            {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {[
            { label: "Full Name", value: `${user.firstName} ${user.lastName}` },
            { label: "Email ID", value: user.email },
            { label: "Designation", value: user.designation },
            { label: "Department", value: user.department },
            { label: "Username", value: user.username },
            { label: "User Role", value: roleLabel },
            { label: "Status", value: user.isActive ? "Active" : "Inactive" },
            ...(user.language ? [{ label: "Language", value: user.language }] : []),
            ...(user.timeZone ? [{ label: "Time Zone", value: user.timeZone }] : []),
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-beige-100 last:border-0"
            >
              <span className="text-[12px] font-medium text-beige-500 w-32 shrink-0">
                {label}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium text-brown-800 text-right",
                  label === "Status" &&
                    (user.isActive ? "text-teal-600" : "text-beige-400")
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── EditUserDialog ── */
function EditUserDialog({
  user,
  trigger,
  onSaved,
}: {
  user: ManagedUser;
  trigger: React.ReactNode;
  onSaved: (updated: Omit<ManagedUser, "id">) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    designation: user.designation,
    department: user.department,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    language: user.language ?? "",
    timeZone: user.timeZone ?? "",
  });
  const [errors, setErrors] = React.useState<Partial<typeof form & { email: string }>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        designation: user.designation,
        department: user.department,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        language: user.language ?? "",
        timeZone: user.timeZone ?? "",
      });
      setErrors({});
    }
  }, [open, user]);

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.designation.trim()) errs.designation = "Designation is required";
    if (!form.department.trim()) errs.department = "Department is required";
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.role) errs.role = "User role is required";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    setTimeout(() => {
      onSaved({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        designation: form.designation.trim(),
        department: form.department.trim(),
        username: form.username.trim(),
        role: form.role,
        isActive: form.isActive,
        mustChangePassword: false,
        language: form.language.trim() || undefined,
        timeZone: form.timeZone.trim() || undefined,
      });
      toast.success("User updated", `${form.firstName.trim()} ${form.lastName.trim()} has been updated.`);
      setSaving(false);
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrors({}); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">Edit User</DialogTitle>
          <DialogDescription className="text-beige-500">
            Update details for {user.firstName} {user.lastName}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eu-fname" className="text-[12px] text-brown-700">
                  First Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="eu-fname"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className={cn(errors.firstName && "border-red-400")}
                />
                <FieldError message={errors.firstName} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eu-lname" className="text-[12px] text-brown-700">
                  Last Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="eu-lname"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className={cn(errors.lastName && "border-red-400")}
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eu-email" className="text-[12px] text-brown-700">
                Email ID <span className="text-red-400">*</span>
              </Label>
              <Input
                id="eu-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={cn(errors.email && "border-red-400")}
              />
              <FieldError message={errors.email} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eu-designation" className="text-[12px] text-brown-700">
                  Designation <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="eu-designation"
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                  className={cn(errors.designation && "border-red-400")}
                />
                <FieldError message={errors.designation} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eu-dept" className="text-[12px] text-brown-700">
                  Department <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="eu-dept"
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                  className={cn(errors.department && "border-red-400")}
                />
                <FieldError message={errors.department} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eu-username" className="text-[12px] text-brown-700">
                  Username <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="eu-username"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  className={cn(errors.username && "border-red-400")}
                />
                <FieldError message={errors.username} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eu-role" className="text-[12px] text-brown-700">
                  User Role <span className="text-red-400">*</span>
                </Label>
                <UserRoleDropdown
                  id="eu-role"
                  value={form.role}
                  onChange={(v) => set("role", v)}
                  hasError={!!errors.role}
                />
                <FieldError message={errors.role} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-beige-200/50 bg-beige-50/40 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-brown-800">Active User</p>
                <p className="text-[11px] text-beige-500 mt-0.5">
                  User can log in and access the platform
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => set("isActive", v)}
                aria-label="Active user toggle"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eu-lang" className="text-[12px] text-brown-700">
                  Language{" "}
                  <span className="text-beige-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="eu-lang"
                  value={form.language}
                  onChange={(e) => set("language", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eu-tz" className="text-[12px] text-brown-700">
                  Time Zone{" "}
                  <span className="text-beige-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="eu-tz"
                  value={form.timeZone}
                  onChange={(e) => set("timeZone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="gradient-primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── DeleteUserDialog ── */
function DeleteUserDialog({
  fullName,
  trigger,
  onConfirm,
}: {
  fullName: string;
  trigger: React.ReactNode;
  onConfirm: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      onConfirm();
      toast.success("User deleted", `"${fullName}" has been removed.`);
      setDeleting(false);
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">Delete User</DialogTitle>
          <DialogDescription className="text-beige-500">
            Are you sure you want to delete &ldquo;{fullName}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── UsersTable ── */
function UsersTable({
  users,
  onEdit,
  onDelete,
}: {
  users: ManagedUser[];
  onEdit: (id: string, updated: Omit<ManagedUser, "id">) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Email ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const fullName = `${user.firstName} ${user.lastName}`;
            const roleLabel =
              AVAILABLE_ROLES.find((r) => r.value === user.role)?.label ?? user.role;

            return (
              <TableRow key={user.id} className="group hover:bg-beige-50/60 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-white">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-brown-800">{fullName}</p>
                        {user.mustChangePassword && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gold-100 text-gold-700 border border-gold-200 cursor-default">
                                  <KeyRound className="w-2.5 h-2.5" />
                                  Pending
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Awaiting first login — password reset required</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-[11px] text-beige-400">@{user.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[13px] text-brown-700">{user.email}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="teal" size="sm">
                    {roleLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-[13px] text-brown-700">{user.designation}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ViewUserDialog
                      user={user}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`View ${fullName}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-beige-500 hover:text-teal-600"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                    <EditUserDialog
                      user={user}
                      onSaved={(updated) => onEdit(user.id, updated)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${fullName}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-beige-500 hover:text-brown-700"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                    <DeleteUserDialog
                      fullName={fullName}
                      onConfirm={() => onDelete(user.id)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${fullName}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <p className="text-[13px] text-beige-400">No users found.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Count footer */}
      <div className="px-5 py-3 border-t border-beige-100 bg-beige-50/30">
        <span className="text-[11px] text-beige-500">
          <span className="font-semibold text-brown-700">{users.length}</span>{" "}
          {pluralize(users.length, "user", "users")}
        </span>
      </div>
    </div>
  );
}

/* ── Create Role Dialog ── */
function CreateRoleDialog({ trigger, onCreated }: { trigger: React.ReactNode; onCreated: (role: { name: string; description: string; permissions: string[] }) => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedPerms, setSelectedPerms] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; perms?: string }>({});

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
    // Clear perm error when user selects something
    if (errors.perms) setErrors((e) => ({ ...e, perms: undefined }));
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Role name is required";
    if (selectedPerms.length === 0) newErrors.perms = "Select at least one permission";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      onCreated({ name: name.trim(), description: description.trim(), permissions: selectedPerms });
      toast.success("Role created", `"${name.trim()}" has been added to your organization.`);
      setSaving(false);
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedPerms([]);
      setErrors({});
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrors({}); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">Create Custom Role</DialogTitle>
          <DialogDescription className="text-beige-500">
            Define a new role with specific permissions for your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role-name" className="text-[12px] text-brown-700">Role Name</Label>
            <Input
              id="role-name"
              placeholder="e.g. Project Lead"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((er) => ({ ...er, name: undefined })); }}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500 font-medium">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description" className="text-[12px] text-brown-700">Description</Label>
            <Textarea
              id="role-description"
              placeholder="Describe what this role can do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 text-[12px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[12px] text-brown-700">
              Permissions ({selectedPerms.length} selected)
            </Label>
            {errors.perms && (
              <p className="text-[11px] text-red-500 font-medium">{errors.perms}</p>
            )}
            <div className="rounded-xl border border-beige-100 bg-beige-50/40 p-4 max-h-[240px] overflow-y-auto">
              {permissionGrid.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.key} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CatIcon className="w-3.5 h-3.5 text-beige-400" />
                      <span className="text-[11px] font-semibold text-brown-700">{cat.key}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-5">
                      {Object.entries(cat.permissions).map(([level, perm]) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <Checkbox
                            checked={selectedPerms.includes(perm)}
                            onCheckedChange={() => togglePerm(perm)}
                          />
                          <span className="text-[11px] text-beige-600 group-hover:text-brown-700 transition-colors">
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="gradient-primary"
            size="sm"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Create Role
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Role Dialog (for custom roles) ── */
function EditRoleDialog({
  role,
  trigger,
  onSaved,
}: {
  role: { name: string; description: string; permissions: string[] };
  trigger: React.ReactNode;
  onSaved: (updated: { name: string; description: string; permissions: string[] }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(role.name);
  const [description, setDescription] = React.useState(role.description);
  const [selectedPerms, setSelectedPerms] = React.useState<string[]>(role.permissions);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(role.name);
      setDescription(role.description);
      setSelectedPerms([...role.permissions]);
    }
  }, [open, role]);

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      onSaved({ name: name.trim(), description: description.trim(), permissions: selectedPerms });
      toast.success("Role updated", `"${name.trim()}" permissions have been saved.`);
      setSaving(false);
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">Edit Role</DialogTitle>
          <DialogDescription className="text-beige-500">
            Modify the permissions for &ldquo;{role.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-role-name" className="text-[12px] text-brown-700">Role Name</Label>
            <Input
              id="edit-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-desc" className="text-[12px] text-brown-700">Description</Label>
            <Textarea
              id="edit-role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 text-[12px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[12px] text-brown-700">
              Permissions ({selectedPerms.length} selected)
            </Label>
            <div className="rounded-xl border border-beige-100 bg-beige-50/40 p-4 max-h-[240px] overflow-y-auto">
              {permissionGrid.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.key} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CatIcon className="w-3.5 h-3.5 text-beige-400" />
                      <span className="text-[11px] font-semibold text-brown-700">{cat.key}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-5">
                      {Object.entries(cat.permissions).map(([level, perm]) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <Checkbox
                            checked={selectedPerms.includes(perm)}
                            onCheckedChange={() => togglePerm(perm)}
                          />
                          <span className="text-[11px] text-beige-600 group-hover:text-brown-700 transition-colors">
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="gradient-primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Delete Role Confirmation ── */
function DeleteRoleDialog({
  roleName,
  trigger,
  onConfirm,
}: {
  roleName: string;
  trigger: React.ReactNode;
  onConfirm: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      onConfirm();
      toast.success("Role deleted", `"${roleName}" has been removed.`);
      setDeleting(false);
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">Delete Role</DialogTitle>
          <DialogDescription className="text-beige-500">
            Are you sure you want to delete &ldquo;{roleName}&rdquo;? Users with this role will lose their custom permissions and revert to the default Viewer role.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete Role
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Role card component ── */
function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: (typeof mockRoles)[0];
  onEdit?: (updated: { name: string; description: string; permissions: string[] }) => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const accentGradients: Record<string, string> = {
    Owner: "from-brown-400 to-brown-600",
    Admin: "from-teal-400 to-teal-600",
    Manager: "from-forest-400 to-forest-600",
    Viewer: "from-beige-400 to-beige-500",
    "Finance Lead": "from-gold-400 to-gold-600",
  };

  return (
    <div
      className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:shadow-brown-100/15 transition-all"
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm",
                accentGradients[role.name] || "from-brown-400 to-brown-600"
              )}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-brown-800">{role.name}</h3>
                <Badge variant={role.isSystem ? "teal" : "gold"} size="sm">
                  {role.isSystem ? "System" : "Custom"}
                </Badge>
              </div>
              <p className="text-[11px] text-beige-500 mt-0.5">{role.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Custom role actions */}
            {!role.isSystem && onEdit && onDelete && (
              <div className="flex items-center gap-1">
                <EditRoleDialog
                  role={role}
                  onSaved={onEdit}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${role.name}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  }
                />
                <DeleteRoleDialog
                  roleName={role.name}
                  onConfirm={onDelete}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${role.name}`} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  }
                />
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 bg-beige-100/80 rounded-lg px-2.5 py-1">
                    <Users className="w-3 h-3 text-beige-500" />
                    <span className="text-[11px] font-bold text-brown-700">{role.userCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{role.userCount} {pluralize(role.userCount, "user", "users")} assigned to this role</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Permission count + tags */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          <Badge variant="beige" size="sm">
            {role.permissions.length} {pluralize(role.permissions.length, "permission", "permissions")}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {role.permissions.map((perm) => (
            <span
              key={perm}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-beige-100 text-beige-700"
              title={perm}
            >
              {permissionLabels[perm] || perm}
            </span>
          ))}
        </div>

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 px-0 h-auto text-[11px] font-semibold text-teal-600 hover:text-teal-700"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide permission grid
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              View permission grid
            </>
          )}
        </Button>
      </div>

      {/* Expandable permission grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="border-t border-beige-100 bg-beige-50/40 px-5 py-4">
              {/* System role notice */}
              {role.isSystem && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-teal-50 border border-teal-100">
                  <Info className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span className="text-[11px] text-teal-700">
                    System roles are managed by the platform and cannot be modified.
                  </span>
                </div>
              )}

              {/* Grid header */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">Category</div>
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider text-center">Read</div>
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider text-center">Write</div>
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider text-center">Full</div>
              </div>

              {/* Grid rows */}
              {permissionGrid.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    className="grid grid-cols-4 gap-2 py-2 border-b border-beige-100 last:border-0 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <CatIcon className="w-3.5 h-3.5 text-beige-400" />
                      <span className="text-[12px] font-medium text-brown-700">{cat.key}</span>
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={hasPermission(role.permissions, cat.permissions.read)}
                        disabled
                        aria-label={`${cat.key} read permission`}
                        className="scale-75 pointer-events-none"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={hasPermission(role.permissions, cat.permissions.write)}
                        disabled
                        aria-label={`${cat.key} write permission`}
                        className="scale-75 pointer-events-none"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={hasPermission(role.permissions, cat.permissions.full)}
                        disabled
                        aria-label={`${cat.key} full permission`}
                        className="scale-75 pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════
   ROLES & PERMISSIONS PAGE
   ═══════════════════════════════ */
export default function RolesPage() {
  const [roles, setRoles] = React.useState(mockRoles);
  const [users, setUsers] = React.useState(initialMockUsers);
  const [search, setSearch] = React.useState("");
  const [userSearch, setUserSearch] = React.useState("");

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  const systemCount = systemRoles.length;
  const customCount = customRoles.length;
  const totalUsers = roles.reduce((sum, r) => sum + r.userCount, 0);

  // Filter by search
  const filteredSystem = systemRoles.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCustom = customRoles.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  );

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.designation.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  // ── Role handlers ──
  const handleCreateRole = (newRole: { name: string; description: string; permissions: string[] }) => {
    setRoles((prev) => [
      ...prev,
      {
        id: `role-${String(prev.length + 1).padStart(3, "0")}`,
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        userCount: 0,
        isSystem: false,
      },
    ]);
  };

  const handleEditRole = (roleId: string) => (updated: { name: string; description: string; permissions: string[] }) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, name: updated.name, description: updated.description, permissions: updated.permissions } : r
      )
    );
  };

  const handleDeleteRole = (roleId: string) => () => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-fade-up"
      >
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em] font-heading">
            Roles & Access
          </h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Define access levels and permission sets for your organization.
          </p>
        </div>
        <CreateRoleDialog
          onCreated={handleCreateRole}
          trigger={
            <Button variant="gradient-primary" size="sm">
              <Plus className="w-3.5 h-3.5" />
              Create Role
            </Button>
          }
        />
      </div>

      {/* Summary bar + search */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 rounded-xl border border-beige-200/50 bg-white/60 backdrop-blur-sm animate-fade-up [animation-delay:100ms]"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-beige-400" />
            <span className="text-[12px] text-beige-600">
              <span className="font-semibold text-brown-800">{systemCount}</span>{" "}
              system {pluralize(systemCount, "role", "roles")}
            </span>
          </div>
          <div className="w-px h-4 bg-beige-200" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span className="text-[12px] text-beige-600">
              <span className="font-semibold text-brown-800">{customCount}</span>{" "}
              custom {pluralize(customCount, "role", "roles")}
            </span>
          </div>
          <div className="w-px h-4 bg-beige-200" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-500" />
            <span className="text-[12px] text-beige-600">
              <span className="font-semibold text-brown-800">{totalUsers}</span>{" "}
              total {pluralize(totalUsers, "user", "users")}
            </span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400" />
          <Input
            placeholder="Search roles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 w-56 text-[12px]"
          />
        </div>
      </div>

      {/* System Roles Section */}
      <div
        className="space-y-3 animate-fade-up [animation-delay:200ms]"
      >
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-beige-400" />
          <h2 className="text-[14px] font-semibold text-brown-800">System Roles</h2>
          <span className="text-[11px] text-beige-500">— managed by platform</span>
        </div>
        {filteredSystem.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSystem.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-beige-500 py-4 text-center">No system roles match your search.</p>
        )}
      </div>

      {/* Custom Roles Section */}
      <div
        className="space-y-3 animate-fade-up [animation-delay:300ms]"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-500" />
          <h2 className="text-[14px] font-semibold text-brown-800">Custom Roles</h2>
          <span className="text-[11px] text-beige-500">— created by your organization</span>
        </div>
        {filteredCustom.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCustom.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={handleEditRole(role.id)}
                onDelete={handleDeleteRole(role.id)}
              />
            ))}
          </div>
        ) : customRoles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-beige-300 bg-beige-50/40 px-6 py-8 text-center">
            <Sparkles className="w-8 h-8 text-gold-300 mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-brown-700">No custom roles yet</p>
            <p className="text-[12px] text-beige-500 mt-1">
              Create a custom role to define specific permission sets for your team members.
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-beige-500 py-4 text-center">No custom roles match your search.</p>
        )}
      </div>
    </div>
  );
}
