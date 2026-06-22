"use client";

/**
 * Add internal employee manually — gradient-glass drawer (same fields as CSV import).
 */

import * as React from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  Drawer,
  GlassField,
  GlassSection,
} from "@/components/meridian";
import {
  AuroraInput,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
  TONE,
} from "@/app/admin/_shell/aurora-ui";
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

  const canSubmit =
    form.firstName.trim().length >= 1 &&
    form.email.trim().includes("@") &&
    form.department.trim().length >= 1;

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
    <Drawer
      open={open}
      onClose={onClose}
      appearance="gradient-glass"
      size="md"
      eyebrow="Workforce · My organization"
      title="Add employee"
      description="Add one internal employee when you don't have a CSV export. Same fields as bulk import."
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button type="button" onClick={onClose} disabled={saving} className={ghostBtnClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={!canSubmit || saving}
            style={primaryStyle}
            className={cn(primaryBtnClass, (!canSubmit || saving) && "opacity-50 cursor-not-allowed")}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <UserPlus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            )}
            Add employee
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {submitError && (
          <p
            role="alert"
            className="rounded-2xl border px-3 py-2 font-body text-[12.5px] backdrop-blur"
            style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
          >
            {submitError}
          </p>
        )}

        <GlassSection title="Identity" hint="Work email must match company SSO">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassField label="First name *">
              <AuroraInput
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                placeholder="Amrita"
                autoComplete="given-name"
              />
            </GlassField>
            <GlassField label="Last name">
              <AuroraInput
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                placeholder="Bose"
                autoComplete="family-name"
              />
            </GlassField>
          </div>
          <GlassField label="Work email *">
            <AuroraInput
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="amrita@acme.com"
              autoComplete="email"
            />
          </GlassField>
          <GlassField label="Employee ID (optional)">
            <AuroraInput
              value={form.employeeId}
              onChange={(e) => setField("employeeId", e.target.value)}
              placeholder="EMP-104"
            />
          </GlassField>
        </GlassSection>

        <GlassSection title="Organization" hint="Used for matching and direct assign">
          <GlassField label="Department *">
            <AuroraInput
              value={form.department}
              onChange={(e) => setField("department", e.target.value)}
              placeholder="Engineering"
            />
          </GlassField>
          <GlassField label="Manager email (optional)">
            <AuroraInput
              type="email"
              value={form.managerEmail}
              onChange={(e) => setField("managerEmail", e.target.value)}
              placeholder="rahul@acme.com"
            />
          </GlassField>
          <GlassField label="Cost center (optional)">
            <AuroraInput
              value={form.costCenter}
              onChange={(e) => setField("costCenter", e.target.value)}
              placeholder="CC-200"
            />
          </GlassField>
        </GlassSection>

        <GlassSection title="Skills" hint="Comma-separated — same as CSV primary_skills column">
          <GlassField label="Primary skills (optional)">
            <AuroraInput
              value={form.primarySkills}
              onChange={(e) => setField("primarySkills", e.target.value)}
              placeholder="React, TypeScript"
            />
          </GlassField>
        </GlassSection>
      </div>
    </Drawer>
  );
}
