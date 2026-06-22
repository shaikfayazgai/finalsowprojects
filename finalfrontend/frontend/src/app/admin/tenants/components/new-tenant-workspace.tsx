"use client";

/**
 * New tenant wizard — Journey A (Platform Admin §5.C.2).
 *
 *   1. Tenant info → 2. Primary admin → 3. Licensed roles
 *   → 4. Region → 5. Compliance → 6. Review & provision
 *
 * Draft persists on each Continue. Success → provisioning status page.
 *
 * Solid two-column layout: vertical stepper (left) + form panel (right).
 * Matches the admin solid-card system — stroke + soft shadow, gradient as a
 * single accent, deliberate radius hierarchy.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Globe2,
  Info,
  Pencil,
  Rocket,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { slugStatusHint } from "@/lib/admin/tenant-slugs";
import { PLATFORM_CONSENT_VERSIONS, consentLabel } from "@/lib/admin/consent-versions";
import {
  DEFAULT_TENANT_DRAFT,
  useAdminProvisioningStore,
  type TenantDraft,
} from "@/lib/stores/admin-provisioning-store";
import {
  ENTERPRISE_ROLE_GROUPS,
  RELEASE_ENTERPRISE_ROLES,
  ROLE_META,
} from "@/app/enterprise/settings/tenant/tenant-roles";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, AURORA_ACCENT, GLASS_GRADIENT } from "../../_shell/aurora";
import { TONE, primaryBtnClass, primaryStyle } from "../../_shell/aurora-ui";
import { NewTenantSkeleton } from "./new-tenant-skeleton";

const STEPS = [
  { id: "info", label: "Tenant info", desc: "Name, domain & tier", icon: Building2 },
  { id: "admin", label: "Primary admin", desc: "First admin invite", icon: UserPlus },
  { id: "roles", label: "Licensed roles", desc: "Roles this tenant gets", icon: Users },
  { id: "region", label: "Region & currency", desc: "Locale defaults", icon: Globe2 },
  { id: "compliance", label: "Compliance baseline", desc: "Retention & residency", icon: Shield },
  { id: "review", label: "Review & provision", desc: "Confirm & launch", icon: Rocket },
] as const;

const RELEASE_ROLE_SET = new Set(RELEASE_ENTERPRISE_ROLES);
const PROVISION_ROLE_GROUP_IDS = new Set(["core", "governance", "delivery"]);
const PROVISION_ROLE_GROUPS = ENTERPRISE_ROLE_GROUPS.filter((g) => PROVISION_ROLE_GROUP_IDS.has(g.id))
  .map((g) => ({ ...g, roles: g.roles.filter((r) => RELEASE_ROLE_SET.has(r)) }))
  .filter((g) => g.roles.length > 0);

/* Solid field surface — neutral border, violet focus ring, no glass. */
const FIELD =
  "w-full h-10 px-3 rounded-lg bg-surface border border-stroke-subtle font-body text-[13.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13.5px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors disabled:opacity-50",
);

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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

  const [step, setStep] = React.useState(0);
  const [d, setD] = React.useState<TenantDraft>(DEFAULT_TENANT_DRAFT);
  const [hydrated, setHydrated] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [provisioning, setProvisioning] = React.useState(false);

  React.useEffect(() => setHydrated(true), []);

  React.useEffect(() => {
    if (!hydrated) return;
    if (storedDraft) {
      setD(storedDraft);
      setSlugTouched(Boolean(storedDraft.slug));
    }
    // Map legacy 5-step index: old step 4 (review) → new step 5
    const mapped = storedStep >= 4 ? Math.min(storedStep + 1, STEPS.length - 1) : Math.min(storedStep, STEPS.length - 1);
    setStep(mapped);
  }, [hydrated, storedDraft, storedStep]);

  const slugHint = slugStatusHint(d.slug, dynamicSlugs);
  const current = STEPS[step];
  const blockers = stepBlockers(step, d, slugHint.taken);
  const canContinue = blockers.length === 0;
  const isLast = step === STEPS.length - 1;

  function onChange<K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) {
    setD((p) => {
      const next = { ...p, [k]: v };
      if (k === "name" && !slugTouched) next.slug = slugify(String(v));
      return next;
    });
  }

  function goToStep(next: number) {
    if (next < 0 || next >= STEPS.length) return;
    if (next > step && !canContinue) return;
    saveWizardDraft(d, next);
    setStep(next);
  }

  function goNext() {
    if (!canContinue) return;
    saveWizardDraft(d, step + 1);
    setStep((s) => s + 1);
  }

  function goBack() {
    saveWizardDraft(d, step - 1);
    setStep((s) => s - 1);
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

  if (!hydrated) return <NewTenantSkeleton />;

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        Tenants
      </Link>

      <header>
        <h1 className="font-display text-[26px] font-bold tracking-[-0.03em] text-foreground leading-none">New tenant</h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          Stand up a new enterprise — you&apos;ll invite their admin when provisioning finishes.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[264px_1fr] items-start">
        {/* ── Left: vertical stepper ── */}
        <aside className="lg:sticky lg:top-4">
          <div className={cn(DASH_CARD, "p-4")}>
            <div className="flex items-center justify-between px-2 mb-2.5">
              <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                Step {step + 1} / {STEPS.length}
              </p>
              <span className="font-mono text-[11px] font-semibold text-text-secondary tabular-nums">{pct}%</span>
            </div>
            <div className="mx-2 mb-4 h-1 rounded-full bg-foreground/[0.07] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-base" style={{ width: `${pct}%`, backgroundImage: AURORA_ACCENT }} />
            </div>
            <VerticalStepper current={step} onJump={goToStep} />
          </div>
        </aside>

        {/* ── Right: form panel ── */}
        <div className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
            <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-foreground">{current.label}</h2>
            <p className="mt-1 font-body text-[13px] text-text-secondary leading-relaxed">{stepHelp(step)}</p>
          </div>

          <div className="px-5 sm:px-6 py-5">
            {step === 0 && <StepTenantInfo d={d} onChange={onChange} slugHint={slugHint} onSlugTouched={() => setSlugTouched(true)} />}
            {step === 1 && <StepPrimaryAdmin d={d} onChange={onChange} />}
            {step === 2 && <StepRoles d={d} setD={setD} />}
            {step === 3 && <StepRegion d={d} onChange={onChange} />}
            {step === 4 && <StepCompliance d={d} onChange={onChange} />}
            {step === 5 && <StepReview d={d} onEdit={goToStep} />}

            {!isLast && blockers.length > 0 && (
              <div
                className="mt-5 flex items-start gap-2 rounded-lg px-3.5 py-2.5"
                style={{ background: TONE.warning.soft, border: `1px solid ${TONE.warning.border}` }}
              >
                <Info className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.2} style={{ color: TONE.warning.text }} aria-hidden />
                <p className="font-body text-[12.5px]" style={{ color: TONE.warning.text }}>
                  To continue, add: {blockers.join(", ")}.
                </p>
              </div>
            )}
          </div>

          <footer className="px-5 sm:px-6 py-4 border-t border-stroke-subtle flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" onClick={goBack} className={BTN_SECONDARY}>
                <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                Back
              </button>
            ) : (
              <button type="button" onClick={onCancel} className={BTN_SECONDARY}>
                Cancel
              </button>
            )}

            {!isLast ? (
              <button type="button" onClick={goNext} disabled={!canContinue} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
                Continue
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              </button>
            ) : (
              <button type="button" disabled={provisioning} onClick={onProvision} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
                <Rocket className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                {provisioning ? "Provisioning…" : "Provision tenant"}
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

function stepBlockers(step: number, d: TenantDraft, slugTaken: boolean): string[] {
  switch (step) {
    case 0: {
      const b: string[] = [];
      if (d.name.trim().length <= 1) b.push("tenant name");
      if (d.slug.trim().length <= 1) b.push("tenant ID");
      else if (slugTaken) b.push("a unique tenant ID");
      if (!d.domain.includes(".")) b.push("primary domain");
      return b;
    }
    case 1: {
      const b: string[] = [];
      if (d.adminName.trim().length <= 1) b.push("admin name");
      if (!d.adminEmail.includes("@")) b.push("admin email");
      return b;
    }
    case 2:
      return Object.values(d.rolesEnabled).some(Boolean) ? [] : ["at least one licensed role"];
    case 3: {
      const b: string[] = [];
      if (!d.region) b.push("region");
      if (!d.currency) b.push("currency");
      return b;
    }
    case 4: {
      const b: string[] = [];
      if (!d.consentVersion) b.push("consent version");
      if (!d.retentionAudit) b.push("audit retention");
      if (!d.retentionEvidence) b.push("evidence retention");
      if (!d.residencyRegion) b.push("data residency");
      return b;
    }
    default:
      return [];
  }
}

function stepHelp(step: number): string {
  switch (step) {
    case 0:
      return "Who is this enterprise? Name, domain, tier, and contract reference.";
    case 1:
      return "Who receives the first login invite as ent.admin?";
    case 2:
      return "Enable only the roles this customer licensed.";
    case 3:
      return "Primary region, currency, and timezone defaults.";
    case 4:
      return "Retention, consent, and where data is stored.";
    case 5:
      return "Confirm everything, then provision scope, policies, and the admin invite.";
    default:
      return "";
  }
}

function VerticalStepper({ current, onJump }: { current: number; onJump: (step: number) => void }) {
  return (
    <ol className="relative">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === STEPS.length - 1;
        const clickable = done;
        return (
          <li key={s.id} className="relative">
            {!last && (
              <span
                aria-hidden
                className="absolute left-[19px] top-9 h-[calc(100%-1.25rem)] w-[2px] rounded-full"
                style={{ background: done ? AURORA_ACCENT : "var(--color-stroke-subtle)" }}
              />
            )}
            <button
              type="button"
              disabled={!clickable && !active}
              onClick={() => clickable && onJump(i)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "group relative flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                clickable && "cursor-pointer hover:bg-bg-subtle",
                active && "bg-[rgba(124,92,246,0.06)]",
                !clickable && !active && "cursor-not-allowed",
              )}
            >
              <span
                className={cn(
                  "relative z-10 grid place-items-center h-8 w-8 rounded-full shrink-0 font-body text-[12px] font-bold",
                  !done && !active && "bg-bg-subtle text-text-tertiary border border-stroke-subtle",
                )}
                style={done || active ? GLASS_GRADIENT : undefined}
              >
                {done ? (
                  <Check className="h-4 w-4 text-white" strokeWidth={2.6} aria-hidden />
                ) : (
                  <span className={active ? "text-white" : undefined}>{i + 1}</span>
                )}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className={cn("block font-body text-[13px] font-semibold", active || done ? "text-foreground" : "text-text-tertiary")}>
                  {s.label}
                </span>
                <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5">{s.desc}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ── solid form primitives ── */

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
  const hintColor =
    hintTone === "warning" ? TONE.warning.text : hintTone === "success" ? TONE.success.text : "var(--color-text-tertiary)";
  return (
    <div className={className}>
      <label className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
        {label}
        {required && (
          <span style={{ color: TONE.error.text }}> *</span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1.5 font-body text-[11.5px]" style={{ color: hintColor }}>{hint}</p>}
    </div>
  );
}

function Input({ className, invalid, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(FIELD, invalid && "border-[var(--color-error-border)] focus-visible:border-[var(--color-error-border)] focus-visible:ring-[var(--color-error-subtle)]", className)}
      {...rest}
    />
  );
}

function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(FIELD, "appearance-none pr-9 cursor-pointer", className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={2} aria-hidden />
    </div>
  );
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
        <Input value={d.name} onChange={(e) => onChange("name", e.target.value)} placeholder="e.g. Acme Corp" />
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
            onChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
          }}
          placeholder="e.g. acme-corp"
          invalid={slugHint.taken}
          className="font-mono"
        />
      </Field>
      <Field label="Primary domain" required>
        <Input value={d.domain} onChange={(e) => onChange("domain", e.target.value)} placeholder="e.g. acme.com" />
      </Field>
      <Field label="Subscription tier" hint="Sets feature flags and commercial terms">
        <Select value={d.tier} onChange={(e) => onChange("tier", e.target.value as TenantDraft["tier"])}>
          <option value="Enterprise">Enterprise</option>
          <option value="Growth">Growth</option>
          <option value="Pilot">Pilot</option>
        </Select>
      </Field>
      <Field label="Contract reference (MSA)" className="sm:col-span-2">
        <Input value={d.msaRef} onChange={(e) => onChange("msaRef", e.target.value)} placeholder="e.g. MSA-2026-0182" className="font-mono" />
      </Field>
    </div>
  );
}

function StepPrimaryAdmin({ d, onChange }: { d: TenantDraft; onChange: <K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) => void }) {
  return (
    <div className="space-y-4">
      <div
        className="flex items-start gap-2 rounded-lg px-3.5 py-3"
        style={{ background: TONE.info.soft, border: `1px solid ${TONE.info.border}` }}
      >
        <Info className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.2} style={{ color: TONE.info.text }} aria-hidden />
        <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
          After provisioning, an invitation email is sent. This person becomes the first{" "}
          <code className="font-mono text-[12px] text-foreground">ent.admin</code> for the tenant.
        </p>
      </div>
      <Field label="Admin full name" required>
        <Input value={d.adminName} onChange={(e) => onChange("adminName", e.target.value)} placeholder="e.g. Sandeep Kulkarni" />
      </Field>
      <Field label="Admin work email" required>
        <Input type="email" value={d.adminEmail} onChange={(e) => onChange("adminEmail", e.target.value)} placeholder="e.g. sandeep@acme.com" />
      </Field>
    </div>
  );
}

function StepRoles({ d, setD }: { d: TenantDraft; setD: React.Dispatch<React.SetStateAction<TenantDraft>> }) {
  const enabledCount = Object.values(d.rolesEnabled).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <p className="font-body text-[13px] text-text-secondary">
        <span className="font-semibold text-foreground">{enabledCount}</span> role{enabledCount === 1 ? "" : "s"} selected. Only checked
        roles appear when the enterprise admin invites members.
      </p>
      {PROVISION_ROLE_GROUPS.map((group) => (
        <section key={group.id} className="rounded-lg border border-stroke-subtle overflow-hidden">
          <header className="px-4 py-3 border-b border-stroke-subtle bg-bg-subtle/50">
            <h3 className="font-body text-[13px] font-semibold text-foreground">{group.title}</h3>
            <p className="font-body text-[12px] text-text-tertiary mt-0.5">{group.description}</p>
          </header>
          <ul className="divide-y divide-stroke-subtle">
            {group.roles.map((key) => {
              const enabled = d.rolesEnabled[key] ?? false;
              const meta = ROLE_META[key];
              return (
                <li key={key}>
                  <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-bg-subtle/60 transition-colors duration-fast">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setD((p) => ({ ...p, rolesEnabled: { ...p.rolesEnabled, [key]: e.target.checked } }))}
                      className="mt-0.5 h-4 w-4 rounded border-stroke accent-[var(--c-violet-500)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <code className="font-mono text-[11px] text-text-tertiary">ent.{key}</code>
                        <span className="font-body text-[13px] font-medium text-foreground">{meta.label}</span>
                      </span>
                      <span className="font-body text-[12px] text-text-tertiary block mt-0.5">{meta.description}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function StepRegion({ d, onChange }: { d: TenantDraft; onChange: <K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Primary region" required>
        <Select value={d.region} onChange={(e) => onChange("region", e.target.value)}>
          <option>Asia-South</option>
          <option>Asia-East</option>
          <option>Europe</option>
          <option>Americas</option>
        </Select>
      </Field>
      <Field label="Currency" required>
        <Select value={d.currency} onChange={(e) => onChange("currency", e.target.value)}>
          <option>INR</option>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
          <option>SGD</option>
        </Select>
      </Field>
      <Field label="Default timezone" className="sm:col-span-2">
        <Input value={d.timezone} onChange={(e) => onChange("timezone", e.target.value)} placeholder="e.g. Asia/Kolkata" />
      </Field>
    </div>
  );
}

function StepCompliance({ d, onChange }: { d: TenantDraft; onChange: <K extends keyof TenantDraft>(k: K, v: TenantDraft[K]) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Platform consent" required hint="Accepted on first admin sign-in" className="sm:col-span-2">
        <Select value={d.consentVersion} onChange={(e) => onChange("consentVersion", e.target.value)}>
          {PLATFORM_CONSENT_VERSIONS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} (effective {v.effectiveDate})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Audit retention" required>
        <Select value={d.retentionAudit} onChange={(e) => onChange("retentionAudit", e.target.value)}>
          <option>indefinite</option>
          <option>10 years</option>
          <option>7 years</option>
        </Select>
      </Field>
      <Field label="Evidence retention" required>
        <Select value={d.retentionEvidence} onChange={(e) => onChange("retentionEvidence", e.target.value)}>
          <option>7 years</option>
          <option>5 years</option>
          <option>3 years</option>
        </Select>
      </Field>
      <Field label="Data residency region" required className="sm:col-span-2">
        <Select value={d.residencyRegion} onChange={(e) => onChange("residencyRegion", e.target.value)}>
          <option>Asia-South</option>
          <option>Asia-East</option>
          <option>Europe</option>
          <option>Americas</option>
        </Select>
      </Field>
    </div>
  );
}

function StepReview({ d, onEdit }: { d: TenantDraft; onEdit: (step: number) => void }) {
  const roles = Object.entries(d.rolesEnabled)
    .filter(([k, v]) => v && RELEASE_ROLE_SET.has(k as (typeof RELEASE_ENTERPRISE_ROLES)[number]))
    .map(([k]) => k)
    .join(", ");

  const rows: Array<{ label: string; value: string; editStep?: number }> = [
    { label: "Tenant", value: `${d.name || "—"} · ${d.slug || "—"}`, editStep: 0 },
    { label: "Domain", value: d.domain || "—", editStep: 0 },
    { label: "Tier", value: d.msaRef ? `${d.tier} · ${d.msaRef}` : d.tier, editStep: 0 },
    { label: "Admin", value: d.adminEmail || "—", editStep: 1 },
    { label: "Roles", value: roles || "—", editStep: 2 },
    { label: "Region", value: `${d.region} · ${d.currency}`, editStep: 3 },
    { label: "Retention", value: `Audit ${d.retentionAudit} · Evidence ${d.retentionEvidence}`, editStep: 4 },
    { label: "Consent", value: consentLabel(d.consentVersion), editStep: 4 },
  ];

  return (
    <div className="space-y-5">
      <dl className="rounded-lg border border-stroke-subtle divide-y divide-stroke-subtle overflow-hidden">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <dt className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">{row.label}</dt>
              <dd className="mt-1 font-body text-[13.5px] text-foreground leading-snug break-words">{row.value}</dd>
            </div>
            {row.editStep != null && (
              <button
                type="button"
                onClick={() => onEdit(row.editStep!)}
                className="inline-flex items-center gap-1 shrink-0 font-body text-[12px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
              >
                <Pencil className="h-3 w-3" strokeWidth={2} aria-hidden />
                Edit
              </button>
            )}
          </div>
        ))}
      </dl>

      <div className="rounded-lg px-4 py-4" style={{ background: TONE.success.soft, border: `1px solid ${TONE.success.border}` }}>
        <p className="font-body text-[13px] font-bold mb-3" style={{ color: TONE.success.text }}>
          Provisioning will create
        </p>
        <ul className="space-y-2">
          {[
            "Tenant database scope",
            "Default policies (SLA, escalation, governance)",
            "Primary admin invitation email",
            "Glimmora Commercial auto-assigned at SOW stage 2",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 font-body text-[13px] text-text-secondary">
              <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: TONE.success.text }} strokeWidth={2.5} aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
