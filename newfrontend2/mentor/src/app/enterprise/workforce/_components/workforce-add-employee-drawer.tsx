"use client";

/**
 * Add internal employee manually — popup (same fields as CSV import).
 */

import * as React from "react";
import { Loader2, UserPlus } from "lucide-react";
import { AdminModal, AuroraInput, secondaryBtnClass, primaryBtnClass, primaryStyle, TONE } from "@/app/admin/_shell/aurora-ui";
import { addWorkforceEmployee } from "@/lib/api/workforce";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  employeeId: "",
  primarySkills: "",
  managerEmail: "",
  costCenter: "",
};

function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{title}</p>
        {hint ? <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function WorkforceAddEmployeeDrawer({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = React.useState(EMPTY);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setSubmitError(null);
      setSaving(false);
    }
  }, [open]);

  const canSubmit = form.firstName.trim().length >= 1 && form.email.trim().includes("@") && form.department.trim().length >= 1;

  function setField<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  }

  async function onSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const result = await addWorkforceEmployee({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        employeeId: form.employeeId.trim() || undefined,
        primarySkills: form.primarySkills.trim() || undefined,
        managerEmail: form.managerEmail.trim().toLowerCase() || undefined,
        costCenter: form.costCenter.trim() || undefined,
      });
      toast.success(
        result.created ? "Employee added" : "Employee updated",
        result.created
          ? `${result.member.displayName} is now in your organization roster.`
          : `${result.member.displayName} was updated in the roster.`,
      );
      onSaved?.();
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not save employee.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      icon={UserPlus}
      tone="ai"
      title="Add employee"
      description="Add one internal employee when you don't have a CSV export — same fields as the bulk import."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="button" onClick={() => void onSubmit()} disabled={!canSubmit || saving} style={primaryStyle} className={cn(primaryBtnClass, "px-5", (!canSubmit || saving) && "opacity-55 cursor-not-allowed")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden /> : <UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden />}
            Add employee
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {submitError ? (
          <p role="alert" className="rounded-lg border px-3 py-2 font-body text-[12.5px]" style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}>
            {submitError}
          </p>
        ) : null}

        <FormSection title="Identity" hint="Work email must match company SSO.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name *">
              <AuroraInput value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} placeholder="e.g. Amrita" autoComplete="given-name" />
            </Field>
            <Field label="Last name">
              <AuroraInput value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} placeholder="e.g. Bose" autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Work email *">
            <AuroraInput type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="e.g. amrita@acme.com" autoComplete="email" />
          </Field>
          <Field label="Employee ID (optional)">
            <AuroraInput value={form.employeeId} onChange={(e) => setField("employeeId", e.target.value)} placeholder="e.g. EMP-104" />
          </Field>
        </FormSection>

        <FormSection title="Organization" hint="Used for matching and direct assignment.">
          <Field label="Department *">
            <AuroraInput value={form.department} onChange={(e) => setField("department", e.target.value)} placeholder="e.g. Engineering" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Manager email (optional)">
              <AuroraInput type="email" value={form.managerEmail} onChange={(e) => setField("managerEmail", e.target.value)} placeholder="e.g. rahul@acme.com" />
            </Field>
            <Field label="Cost center (optional)">
              <AuroraInput value={form.costCenter} onChange={(e) => setField("costCenter", e.target.value)} placeholder="e.g. CC-200" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Skills" hint="Comma-separated — same as the CSV primary_skills column.">
          <Field label="Primary skills (optional)">
            <AuroraInput value={form.primarySkills} onChange={(e) => setField("primarySkills", e.target.value)} placeholder="e.g. React, TypeScript" />
          </Field>
        </FormSection>
      </div>
    </AdminModal>
  );
}
