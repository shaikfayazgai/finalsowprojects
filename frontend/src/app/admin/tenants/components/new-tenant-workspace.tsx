"use client";

/**
 * New tenant wizard — aligned with tenant registry / detail / provisioning UX.
 *
 *   · Vertical step rail (desktop) + compact numbered stepper (mobile)
 *   · rounded-xl panels, Meridian Select, uppercase field labels
 *   · Draft persisted on continue; provision → provisioning page
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  Globe2,
  Rocket,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { Input, Select } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { slugStatusHint } from "@/lib/admin/tenant-slugs";
import { PLATFORM_CONSENT_VERSIONS, consentLabel } from "@/lib/admin/consent-versions";
import {
  DEFAULT_TENANT_DRAFT,
  useAdminProvisioningStore,
  type TenantDraft,
} from "@/lib/stores/admin-provisioning-store";
import { ROLE_META } from "@/app/enterprise/settings/tenant/tenant-roles";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { id: "info", label: "Tenant info", short: "Info", icon: Building2 },
  { id: "admin", label: "Primary admin", short: "Admin", icon: UserPlus },
  { id: "roles", label: "Licensed roles", short: "Roles", icon: Users },
  { id: "region", label: "Region & currency", short: "Region", icon: Globe2 },
  { id: "compliance", label: "Compliance", short: "Compliance", icon: Shield },
  { id: "review", label: "Review & provision", short: "Review", icon: Rocket },
] as const;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewTenantWorkspace() {
  const router = useRouter();
  const provisionTenant = useAdminProvisioningStore((s) => s.provisionTenant);
  const saveWizardDraft = useAdminProvisioningStore((s) => s.saveWizardDraft);
  const clearWizardDraft = useAdminProvisioningStore((s) => s.clearWizardDraft);
  const storedDraft = useAdminProvisioningStore((s) => s.wizardDraft);
  const storedStep = useAdminProvisioningStore((s) => s.wizardStep);
  const tenants = useAdminProvisioningStore((s) => s.tenants);
  const dynamicSlugs = React.useMemo(() => tenants.map((t) => t.slug), [tenants]);

  const [step, setStep] = React.useState(storedStep);
  const [d, setD] = React.useState<TenantDraft>(storedDraft ?? DEFAULT_TENANT_DRAFT);
  const [hydrated, setHydrated] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(Boolean(storedDraft?.slug));
  const [provisioning, setProvisioning] = React.useState(false);

  React.useEffect(() => setHydrated(true), []);

  React.useEffect(() => {
    if (hydrated && storedDraft) {
      setD(storedDraft);
      setStep(storedStep);
      setSlugTouched(Boolean(storedDraft.slug));
    }
  }, [hydrated, storedDraft, storedStep]);

  const slugHint = slugStatusHint(d.slug, dynamicSlugs);
  const current = STEPS[step];
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  function onChange<K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) {
    setD((p) => {
      const next = { ...p, [k]: v };
      if (k === "name" && !slugTouched) {
        next.slug = slugify(String(v));
      }
      return next;
    });
  }

  function canContinue(): boolean {
    switch (step) {
      case 0:
        return (
          d.name.trim().length > 1 &&
          d.slug.trim().length > 1 &&
          !slugHint.taken &&
          d.domain.includes(".")
        );
      case 1:
        return d.adminEmail.includes("@") && d.adminName.trim().length > 1;
      case 2:
        return Object.values(d.rolesEnabled).some(Boolean);
      case 3:
        return d.region.length > 0 && d.currency.length > 0;
      case 4:
        return (
          d.retentionAudit.length > 0 &&
          d.retentionEvidence.length > 0 &&
          d.consentVersion.length > 0
        );
      default:
        return true;
    }
  }

  function goToStep(next: number) {
    if (next < 0 || next >= STEPS.length) return;
    if (next > step && !canContinue()) return;
    saveWizardDraft(d, next);
    setStep(next);
  }

  function goNext() {
    if (!canContinue()) return;
    goToStep(step + 1);
  }

  function goBack() {
    goToStep(step - 1);
  }

  function onProvision() {
    setProvisioning(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const record = provisionTenant(d, origin);
    router.push(`/admin/tenants/${record.id}/provisioning`);
  }

  function onCancel() {
    clearWizardDraft();
    router.push("/admin/tenants");
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Tenants</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">New tenant</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Tenants · Provision
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            New tenant
          </h1>
          <p className="mt-1.5 font-body text-[11.5px] text-text-secondary">
            Step {step + 1} of {STEPS.length} · {current.label}
            {storedDraft && step > 0 && (
              <span className="text-text-tertiary"> · draft saved locally</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-32">
            <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all duration-fast"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-[10px] text-text-tertiary tabular-nums text-right">
              {progressPct}%
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="font-body text-[12px] font-semibold text-text-link hover:underline"
          >
            Cancel
          </button>
        </div>
      </header>

      <MobileStepper current={step} onJump={goToStep} />

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
        <StepRail current={step} onJump={goToStep} />

        <section className="flex-1 min-w-0 rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          <header className="px-5 py-4 border-b border-stroke-subtle">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand-emphasis shrink-0">
                <current.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  {current.label}
                </h2>
                <p className="mt-1 font-body text-[11.5px] text-text-secondary leading-relaxed">
                  {stepDescription(step)}
                </p>
              </div>
            </div>
          </header>

          <div className="px-5 py-5 space-y-4">
            {step === 0 && (
              <StepTenantInfo
                d={d}
                onChange={onChange}
                slugHint={slugHint}
                onSlugTouched={() => setSlugTouched(true)}
              />
            )}
            {step === 1 && <StepPrimaryAdmin d={d} onChange={onChange} />}
            {step === 2 && <StepRoles d={d} setD={setD} />}
            {step === 3 && <StepRegion d={d} onChange={onChange} />}
            {step === 4 && <StepCompliance d={d} onChange={onChange} />}
            {step === 5 && <StepReview d={d} />}
          </div>

          <footer className="px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/30 flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canContinue()}
                onClick={goNext}
                className={cn(primaryBtnCls, !canContinue() && "opacity-50 cursor-not-allowed hover:bg-brand")}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                disabled={provisioning}
                onClick={onProvision}
                className={primaryBtnCls}
              >
                <Rocket className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                {provisioning ? "Provisioning…" : "Provision tenant"}
              </button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}

function stepDescription(step: number): string {
  switch (step) {
    case 0:
      return "Legal identity, domain, tier, and contract reference for the enterprise.";
    case 1:
      return "First ent.admin receives an invite after provisioning completes.";
    case 2:
      return "Enable only the ent.* roles licensed in the MSA — prune the rest.";
    case 3:
      return "Primary region, billing currency, and default timezone.";
    case 4:
      return "Consent version, retention policy, and data residency.";
    case 5:
      return "Confirm details — provisioning creates scope, policies, and admin invite.";
    default:
      return "";
  }
}

function StepTenantInfo({
  d,
  onChange,
  slugHint,
  onSlugTouched,
}: {
  d: TenantDraft;
  onChange: <K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) => void;
  slugHint: { message: string; taken: boolean };
  onSlugTouched: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Tenant name" required className="sm:col-span-2">
        <Input
          value={d.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Acme Corp"
          size="sm"
          className="h-9 text-[13px]"
        />
      </Field>
      <Field
        label="Tenant ID (URL slug)"
        required
        hint={d.slug ? slugHint.message : "Used in URLs and internal references"}
        hintTone={slugHint.taken ? "warning" : slugHint.message.startsWith("✓") ? "success" : "muted"}
      >
        <Input
          value={d.slug}
          onChange={(e) => {
            onSlugTouched();
            onChange(
              "slug",
              e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            );
          }}
          placeholder="acme-corp"
          size="sm"
          className="h-9 text-[13px] font-mono"
          invalid={slugHint.taken}
        />
      </Field>
      <Field label="Primary domain" required>
        <Input
          value={d.domain}
          onChange={(e) => onChange("domain", e.target.value)}
          placeholder="acme.com"
          size="sm"
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Subscription tier" hint="Feature flags + commercial terms">
        <Select
          value={d.tier}
          onChange={(e) => onChange("tier", e.target.value as TenantDraft["tier"])}
          variant="outline"
          size="sm"
        >
          <option value="Enterprise">Enterprise</option>
          <option value="Growth">Growth</option>
          <option value="Pilot">Pilot</option>
        </Select>
      </Field>
      <Field label="Contract reference (MSA)">
        <Input
          value={d.msaRef}
          onChange={(e) => onChange("msaRef", e.target.value)}
          placeholder="MSA-2026-0182"
          size="sm"
          className="h-9 text-[13px] font-mono"
        />
      </Field>
    </div>
  );
}

function StepPrimaryAdmin({
  d,
  onChange,
}: {
  d: TenantDraft;
  onChange: <K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) => void;
}) {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5">
        <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
          An invitation email is queued after provisioning. They become the first{" "}
          <code className="font-mono text-[11px]">ent.admin</code> for this tenant.
        </p>
      </div>
      <Field label="Admin full name" required>
        <Input
          value={d.adminName}
          onChange={(e) => onChange("adminName", e.target.value)}
          placeholder="Sandeep Kulkarni"
          size="sm"
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Admin work email" required>
        <Input
          type="email"
          value={d.adminEmail}
          onChange={(e) => onChange("adminEmail", e.target.value)}
          placeholder="sandeep@acme.com"
          size="sm"
          className="h-9 text-[13px]"
        />
      </Field>
    </div>
  );
}

function StepRoles({
  d,
  setD,
}: {
  d: TenantDraft;
  setD: React.Dispatch<React.SetStateAction<TenantDraft>>;
}) {
  const enabledCount = Object.values(d.rolesEnabled).filter(Boolean).length;

  return (
    <div className="space-y-3">
      <p className="font-body text-[11.5px] text-text-secondary">
        {enabledCount} role{enabledCount === 1 ? "" : "s"} enabled · assign members from the enterprise portal after sign-in
      </p>
      <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
        {Object.entries(d.rolesEnabled).map(([key, enabled]) => {
          const meta = ROLE_META[key as keyof typeof ROLE_META];
          return (
            <li key={key}>
              <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-bg-subtle/40 transition-colors duration-fast">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) =>
                    setD((p) => ({
                      ...p,
                      rolesEnabled: { ...p.rolesEnabled, [key]: e.target.checked },
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-stroke text-brand focus:ring-brand/25"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono text-[11px] text-brand-emphasis">ent.{key}</code>
                    {meta?.label && (
                      <span className="font-body text-[13px] font-medium text-foreground">
                        {meta.label}
                      </span>
                    )}
                  </span>
                  {meta?.description && (
                    <span className="font-body text-[11.5px] text-text-tertiary block mt-0.5">
                      {meta.description}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StepRegion({
  d,
  onChange,
}: {
  d: TenantDraft;
  onChange: <K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      <Field label="Primary region" required>
        <Select value={d.region} onChange={(e) => onChange("region", e.target.value)} variant="outline" size="sm">
          <option>Asia-South</option>
          <option>Asia-East</option>
          <option>Europe</option>
          <option>Americas</option>
        </Select>
      </Field>
      <Field label="Currency" required>
        <Select value={d.currency} onChange={(e) => onChange("currency", e.target.value)} variant="outline" size="sm">
          <option>INR</option>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
          <option>SGD</option>
        </Select>
      </Field>
      <Field label="Default timezone" className="sm:col-span-2">
        <Input
          value={d.timezone}
          onChange={(e) => onChange("timezone", e.target.value)}
          size="sm"
          className="h-9 text-[13px]"
        />
      </Field>
    </div>
  );
}

function StepCompliance({
  d,
  onChange,
}: {
  d: TenantDraft;
  onChange: <K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Platform consent" required hint="Accepted on first admin sign-in" className="sm:col-span-2">
        <Select
          value={d.consentVersion}
          onChange={(e) => onChange("consentVersion", e.target.value)}
          variant="outline"
          size="sm"
        >
          {PLATFORM_CONSENT_VERSIONS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} (effective {v.effectiveDate})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Audit retention" required>
        <Select
          value={d.retentionAudit}
          onChange={(e) => onChange("retentionAudit", e.target.value)}
          variant="outline"
          size="sm"
        >
          <option>indefinite</option>
          <option>10 years</option>
          <option>7 years</option>
        </Select>
      </Field>
      <Field label="Evidence retention" required>
        <Select
          value={d.retentionEvidence}
          onChange={(e) => onChange("retentionEvidence", e.target.value)}
          variant="outline"
          size="sm"
        >
          <option>7 years</option>
          <option>5 years</option>
          <option>3 years</option>
        </Select>
      </Field>
      <Field label="Data residency region" required className="sm:col-span-2">
        <Select
          value={d.residencyRegion}
          onChange={(e) => onChange("residencyRegion", e.target.value)}
          variant="outline"
          size="sm"
        >
          <option>Asia-South</option>
          <option>Asia-East</option>
          <option>Europe</option>
          <option>Americas</option>
        </Select>
      </Field>
    </div>
  );
}

function StepReview({ d }: { d: TenantDraft }) {
  const roles = Object.entries(d.rolesEnabled)
    .filter(([, v]) => v)
    .map(([k]) => `ent.${k}`)
    .join(", ");

  return (
    <div className="space-y-4">
      <DashboardSection bare title="Summary" description="Review before provisioning">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <ReviewRow label="Tenant" value={d.name || "—"} />
          <ReviewRow label="Tenant ID" value={d.slug || "—"} mono />
          <ReviewRow label="Domain" value={d.domain || "—"} />
          <ReviewRow label="Tier" value={d.tier} />
          <ReviewRow label="MSA" value={d.msaRef || "—"} mono />
          <ReviewRow label="Admin" value={`${d.adminName} · ${d.adminEmail}`} />
          <ReviewRow label="Region" value={`${d.region} · ${d.currency}`} />
          <ReviewRow label="Consent" value={consentLabel(d.consentVersion)} />
          <ReviewRow label="Roles" value={roles || "—"} className="sm:col-span-2" />
          <ReviewRow
            label="Retention"
            value={`Audit ${d.retentionAudit} · Evidence ${d.retentionEvidence}`}
            className="sm:col-span-2"
          />
        </dl>
      </DashboardSection>

      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
          Provisioning creates
        </p>
        <ul className="space-y-1.5">
          {[
            "Tenant database scope",
            "Default policies (SLA, escalation, governance)",
            "Primary admin invitation email",
            "Glimmora Commercial auto-assigned at SOW stage 2",
          ].map((line) => (
            <li key={line} className="flex items-center gap-2 font-body text-[12px] text-text-secondary">
              <Check className="h-3.5 w-3.5 text-success-text shrink-0" strokeWidth={2.5} aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepRail({
  current,
  onJump,
}: {
  current: number;
  onJump: (step: number) => void;
}) {
  return (
    <nav
      aria-label="Wizard steps"
      className="hidden lg:block w-52 shrink-0 space-y-1"
    >
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            type="button"
            disabled={i > current}
            onClick={() => done && onJump(i)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors duration-fast",
              active && "bg-brand-subtle/50 border border-brand/20",
              done && !active && "hover:bg-bg-subtle cursor-pointer",
              i > current && "opacity-50 cursor-not-allowed",
            )}
          >
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                done
                  ? "bg-success-subtle text-success-text"
                  : active
                    ? "bg-brand text-on-brand"
                    : "bg-bg-subtle text-text-tertiary border border-stroke-subtle",
              )}
            >
              {done ? (
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              ) : (
                <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
              )}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block font-body text-[12px] leading-tight",
                  active ? "font-semibold text-foreground" : "text-text-secondary",
                )}
              >
                {s.label}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileStepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (step: number) => void;
}) {
  return (
    <ol
      aria-label="Wizard progress"
      className="lg:hidden flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1"
    >
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s.id}>
            <li>
              <button
                type="button"
                disabled={i > current}
                onClick={() => done && onJump(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md whitespace-nowrap",
                  active && "bg-brand-subtle/50",
                  done && "cursor-pointer",
                  i > current && "opacity-50 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-semibold",
                    active
                      ? "bg-brand text-on-brand"
                      : done
                        ? "bg-success-subtle text-success-text"
                        : "bg-bg-subtle text-text-tertiary border border-stroke-subtle",
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "font-body text-[11px]",
                    active ? "font-semibold text-foreground" : "text-text-tertiary",
                  )}
                >
                  {s.short}
                </span>
              </button>
            </li>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-3 bg-stroke-subtle shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function ReviewRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground leading-snug",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  hint,
  hintTone = "muted",
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  hintTone?: "muted" | "warning" | "success";
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && <span className="text-error-text normal-case tracking-normal"> *</span>}
      </span>
      {children}
      {hint && (
        <span
          className={cn(
            "block mt-1 font-body text-[11px]",
            hintTone === "warning"
              ? "text-warning-text"
              : hintTone === "success"
                ? "text-success-text"
                : "text-text-tertiary",
          )}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);
