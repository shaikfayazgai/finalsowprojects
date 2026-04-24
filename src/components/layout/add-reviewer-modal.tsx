"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

/* ── Constants ─────────────────────────────────────── */

const AVAILABLE_ROLES = [
  { value: "reviewer", label: "Reviewer" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
] as const;

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "UTC+05:30", label: "UTC +05:30 (India Standard Time)" },
  { value: "UTC-05:00", label: "UTC -05:00 (Eastern Time)" },
  { value: "UTC+01:00", label: "UTC +01:00 (Central European Time)" },
  { value: "UTC+08:00", label: "UTC +08:00 (Singapore Time)" },
] as const;

/* ── Helpers ────────────────────────────────────────── */

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

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  designation: "",
  department: "",
  username: "",
  role: "reviewer",
  status: "active" as "active" | "inactive",
  language: "",
  timeZone: "",
};

type FormState = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
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
  if (!form.role) errors.role = "Role is required";
  if (!form.language) errors.language = "Language is required";
  if (!form.timeZone) errors.timeZone = "Time zone is required";
  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 font-medium mt-1">{message}</p>;
}

/* ── Component ──────────────────────────────────────── */

interface AddReviewerModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddReviewerModal({ open, onClose }: AddReviewerModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = React.useState<"form" | "success">("form");
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [tempPassword, setTempPassword] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const set = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      onClose();
      setForm(emptyForm);
      setErrors({});
      setStep("form");
      setTempPassword("");
      setCopied(false);
    }
  };

  const handleCreate = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    const localPwd = generateTempPassword();

    let resolvedPassword = localPwd;

    try {
      const res = await fetch("/api/reviewers/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          designation: form.designation.trim(),
          department: form.department.trim(),
          username: form.username.trim(),
          role: form.role,
          status: form.status,
          language: form.language,
          timeZone: form.timeZone,
          tempPassword: localPwd,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors({ email: data?.error ?? data?.message ?? "Failed to send invitation. Please try again." });
        setSaving(false);
        return;
      }

      resolvedPassword = data?.tempPassword ?? localPwd;
    } catch {
      setErrors({ email: "Network error. Please try again." });
      setSaving(false);
      return;
    }

    // Send invitation email using the API-returned password
    try {
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "reviewer_invitation",
          to: form.email.trim(),
          payload: {
            reviewerName: `${form.firstName.trim()} ${form.lastName.trim()}`,
            designation: form.designation.trim(),
            inviterName: session?.user?.name ?? "GlimmoraTeam Admin",
            inviterOrg: "GlimmoraTeam",
            loginEmail: form.email.trim(),
            tempPassword: resolvedPassword,
            loginUrl: `${window.location.origin}/auth/login`,
          },
        }),
      });
    } catch {
      // Email failure is non-blocking — invitation was already created
    }

    setTempPassword(resolvedPassword);
    setSaving(false);
    setStep("success");
  };

  const handleCopyCredentials = () => {
    const text = `Login URL: https://app.glimmorateam.com/auth/login\nEmail: ${form.email.trim()}\nTemporary Password: ${tempPassword}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
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
      <DialogContent className="sm:max-w-[420px] bg-[#F9F7F5] border border-beige-200">

        {/* ── Step 1: Form ── */}
        {step === "form" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg, #A67763, #D0B060)" }}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-brown-900 font-heading">Add Team Member</DialogTitle>
                  <DialogDescription className="text-beige-500 text-[12px]">
                    Fill in the details below. A temporary password will be sent to the reviewer.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {/* Row 1: First Name + Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ar-fname" className="text-[11px] font-medium text-brown-700">First Name <span className="text-red-400">*</span></Label>
                  <Input id="ar-fname" placeholder="First name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={cn("h-8 text-[12px]", errors.firstName && "border-red-400")} />
                  <FieldError message={errors.firstName} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ar-lname" className="text-[11px] font-medium text-brown-700">Last Name <span className="text-red-400">*</span></Label>
                  <Input id="ar-lname" placeholder="Last name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={cn("h-8 text-[12px]", errors.lastName && "border-red-400")} />
                  <FieldError message={errors.lastName} />
                </div>
              </div>

              {/* Row 2: Email + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ar-email" className="text-[11px] font-medium text-brown-700">Email <span className="text-[11px] text-red-400">*</span></Label>
                  <Input id="ar-email" type="email" placeholder="user@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={cn("h-8 text-[12px]", errors.email && "border-red-400")} />
                  <FieldError message={errors.email} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ar-role" className="text-[11px] font-medium text-brown-700">Role <span className="text-red-400">*</span></Label>
                  <Select value={form.role} onValueChange={(v) => set("role", v)}>
                    <SelectTrigger id="ar-role" className={cn("h-8 text-[12px]", errors.role && "border-red-400")}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.role} />
                </div>
              </div>

              {/* Row 3: Designation + Department */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ar-designation" className="text-[11px] font-medium text-brown-700">Designation <span className="text-red-400">*</span></Label>
                  <Input id="ar-designation" placeholder="e.g. Senior Reviewer" value={form.designation} onChange={(e) => set("designation", e.target.value)} className={cn("h-8 text-[12px]", errors.designation && "border-red-400")} />
                  <FieldError message={errors.designation} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ar-dept" className="text-[11px] font-medium text-brown-700">Department <span className="text-red-400">*</span></Label>
                  <Input id="ar-dept" placeholder="e.g. Engineering" value={form.department} onChange={(e) => set("department", e.target.value)} className={cn("h-8 text-[12px]", errors.department && "border-red-400")} />
                  <FieldError message={errors.department} />
                </div>
              </div>

              {/* Row 4: Username + Active toggle */}
              <div className="grid grid-cols-2 gap-3 items-start">
                <div className="space-y-1">
                  <Label htmlFor="ar-username" className="text-[11px] font-medium text-brown-700">Username <span className="text-red-400">*</span></Label>
                  <Input id="ar-username" placeholder="username" value={form.username} onChange={(e) => set("username", e.target.value)} className={cn("h-8 text-[12px]", errors.username && "border-red-400")} />
                  <FieldError message={errors.username} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-brown-700">Status</Label>
                  <div className="flex items-center gap-4 h-8 rounded-lg border border-beige-200 bg-white/60 px-3">
                    {(["active", "inactive"] as const).map((val) => (
                      <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="modal-status"
                          value={val}
                          checked={form.status === val}
                          onChange={() => set("status", val)}
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
                  <Label htmlFor="ar-lang" className="text-[11px] font-medium text-brown-700">Language <span className="text-red-400">*</span></Label>
                  <Select value={form.language} onValueChange={(v) => set("language", v)}>
                    <SelectTrigger id="ar-lang" className={cn("h-8 text-[12px]", errors.language && "border-red-400")}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.language} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ar-tz" className="text-[11px] font-medium text-brown-700">Time Zone <span className="text-red-400">*</span></Label>
                  <Select value={form.timeZone} onValueChange={(v) => set("timeZone", v)}>
                    <SelectTrigger id="ar-tz" className={cn("h-8 text-[12px]", errors.timeZone && "border-red-400")}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.timeZone} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Cancel</Button>
              <Button variant="gradient-primary" size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Creating…</> : <><Mail className="w-3.5 h-3.5" />Create & Invite</>}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Success ── */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-brown-900 font-heading">Invitation Sent</DialogTitle>
              <DialogDescription className="text-beige-500 text-[12px]">
                Login credentials have been sent to <span className="font-medium text-brown-700">{form.email.trim()}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <p className="text-[12px] font-semibold text-teal-700">
                  {form.firstName.trim()} {form.lastName.trim()} added as <span className="capitalize">{roleLabel}</span>
                </p>
              </div>

              <div className="rounded-xl border border-beige-200 bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-beige-100 bg-beige-50/60">
                  <KeyRound className="w-3 h-3 text-beige-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-beige-500">Login Credentials</span>
                </div>
                <div className="px-4 py-3 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-beige-500">Email</span>
                    <span className="font-semibold text-brown-800">{form.email.trim()}</span>
                  </div>
                  <div className="border-t border-beige-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-beige-500">Temp Password</span>
                    <span className="font-semibold text-brown-800 tracking-widest">{tempPassword}</span>
                  </div>
                  <div className="border-t border-beige-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-beige-500">Login URL</span>
                    <span className="text-teal-600">app.glimmorateam.com</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={handleCopyCredentials}>
                {copied ? <><Check className="w-3.5 h-3.5 text-teal-500" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy credentials</>}
              </Button>
            </div>

            <DialogFooter>
              <Button variant="gradient-primary" size="sm" onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
