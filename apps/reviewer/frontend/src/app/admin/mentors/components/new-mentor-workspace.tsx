"use client";

/**
 * New mentor invite — aligned with new pool + competency editor patterns.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { Select } from "@/components/meridian";
import {
  canAssignCrossPool,
  inviteAdminMentor,
} from "@/lib/admin/mocks/mentors-service";
import { useAdminPoolsList } from "@/lib/hooks/use-admin-mentors";
import type { MockAdminMentor } from "@/mocks/admin/mentors";
import { cn } from "@/lib/utils/cn";

const COUNTRIES = ["India", "USA", "Singapore", "UK", "Germany", "Italy", "Spain"] as const;

const DEFAULT_ROLES = { mentor: true, senior: false, lead: false };

type RoleToggleKey = keyof typeof DEFAULT_ROLES;

const ROLE_OPTIONS: Array<{
  key: RoleToggleKey;
  role: MockAdminMentor["roles"][number];
  label: string;
  hint: string;
}> = [
  { key: "mentor", role: "mentor", label: "Mentor", hint: "Standard review routing" },
  { key: "senior", role: "mentor.senior", label: "Senior mentor", hint: "Cross-pool eligible" },
  { key: "lead", role: "mentor.lead", label: "Lead mentor", hint: "Pool lead designation" },
];

export function NewMentorWorkspace() {
  const router = useRouter();
  const pools = useAdminPoolsList();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [country, setCountry] = React.useState<string>("India");
  const [roles, setRoles] = React.useState(DEFAULT_ROLES);
  const [poolIds, setPoolIds] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const roleList = React.useMemo(() => {
    const r: MockAdminMentor["roles"] = [];
    if (roles.mentor) r.push("mentor");
    if (roles.senior) r.push("mentor.senior");
    if (roles.lead) r.push("mentor.lead");
    return r;
  }, [roles]);

  const canSubmit =
    name.trim().length > 1 && email.includes("@") && roleList.length > 0 && !submitting;

  function toggleRole(key: RoleToggleKey) {
    setRoles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const any = next.mentor || next.senior || next.lead;
      if (!any) return prev;
      return next;
    });
    setError(null);
  }

  function togglePool(id: string) {
    setPoolIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const crossPool = pools.find((p) => p.scope === "cross-tenant");
    if (crossPool && poolIds.includes(crossPool.id) && !canAssignCrossPool(roleList)) {
      setError("Cross-pool requires Senior or Lead role.");
      return;
    }

    void (async () => {
      setSubmitting(true);
      setError(null);
      try {
        // Credential-based provisioning (locked flow — NO invite links):
        // a random temp password is generated, the account is must-change-
        // password, and (since email may be unavailable) the temp password is
        // returned so the admin can hand it over. First sign-in forces a reset.
        const res = await fetch("/api/superadmin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            role: "mentor",
            sendCredentials: true,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          tempPassword?: string;
          emailSent?: boolean;
        };
        if (!res.ok) {
          throw new Error(body.error ?? body.message ?? "Could not create mentor.");
        }

        const created = inviteAdminMentor({
          name: name.trim(),
          email: email.trim(),
          country,
          roles: roleList,
          poolIds,
          note: note.trim() || undefined,
        });

        const qs = new URLSearchParams({ provisioned: "1" });
        if (body.tempPassword) qs.set("tempPassword", body.tempPassword);
        if (body.emailSent) qs.set("emailSent", "1");
        router.push(`/admin/mentors/${created.id}?${qs.toString()}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create mentor.");
        setSubmitting(false);
      }
    })();
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Mentors</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">New mentor</span>
      </nav>

      <header className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Talent
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Add a new mentor
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Creates the mentor account with a temporary password. They set their own
          password on first sign-in. Assign pools and competency after creation.
        </p>
      </header>

      <div className="rounded-xl border border-brand-border/40 bg-brand-subtle/15 px-4 py-3">
        <p className="font-body text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 shrink-0 text-brand-emphasis" strokeWidth={2} aria-hidden />
          What happens next
        </p>
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
          Mentor receives a welcome email and appears as{" "}
          <span className="font-medium text-foreground">Pending</span> until first sign-in.
          Add competency rows from their detail page to enable review matching.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden"
      >
        <FormSection
          title="Contact details"
          description="Name and email for the platform invite"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className={inputCls}
                placeholder="e.g. Divya Krishnan"
                required
                autoComplete="name"
              />
            </Field>
            <Field label="Work email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className={inputCls}
                placeholder="mentor@glimmora.team"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Country" required className="sm:col-span-2 sm:max-w-xs">
              <Select
                variant="outline"
                size="sm"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Role tier"
          description="At least one role required — affects cross-pool eligibility"
          bordered
        >
          <ul className="space-y-2">
            {ROLE_OPTIONS.map((r) => (
              <li key={r.key}>
                <label
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors duration-fast",
                    roles[r.key]
                      ? "border-brand bg-brand-subtle/30"
                      : "border-stroke-subtle hover:bg-bg-subtle/60",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={roles[r.key]}
                    onChange={() => toggleRole(r.key)}
                    className="mt-0.5 h-4 w-4 rounded border-stroke text-brand"
                  />
                  <span>
                    <span className="block font-body text-[13px] font-medium text-foreground">
                      {r.label}
                    </span>
                    <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5">
                      {r.hint}
                    </span>
                    <code className="font-mono text-[10px] text-text-tertiary mt-1 inline-block">
                      {r.role}
                    </code>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </FormSection>

        <FormSection
          title="Pool assignment"
          description="Optional — assign now or from the mentor detail page later"
          bordered
        >
          {pools.length === 0 ? (
            <p className="font-body text-[13px] text-text-secondary">
              No pools yet.{" "}
              <Link href="/admin/mentors/pools/new" className="font-semibold text-text-link">
                Create a pool →
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {pools.map((p) => {
                const selected = poolIds.includes(p.id);
                const needsSenior =
                  p.scope === "cross-tenant" &&
                  selected &&
                  !canAssignCrossPool(roleList);
                return (
                  <li key={p.id}>
                    <label
                      className={cn(
                        "flex items-start gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors duration-fast",
                        selected
                          ? needsSenior
                            ? "border-warning-border bg-warning-subtle/30"
                            : "border-brand bg-brand-subtle/30"
                          : "border-stroke-subtle hover:bg-bg-subtle/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePool(p.id)}
                        className="mt-0.5 h-4 w-4 rounded border-stroke text-brand"
                      />
                      <span className="min-w-0">
                        <span className="block font-body text-[13px] font-medium text-foreground">
                          {p.name}
                        </span>
                        <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5">
                          {p.scope === "tenant" ? p.tenantName ?? "Tenant pool" : "Cross-tenant"}
                          {p.scope === "cross-tenant" && " · Senior+ required"}
                          {" · "}
                          {p.loadPct}% load
                        </span>
                        {needsSenior && (
                          <span className="block font-body text-[11px] text-warning-text mt-1">
                            Select Senior or Lead role for this pool
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </FormSection>

        <FormSection title="Competency" description="Configured after invite is sent" bordered>
          <div className="flex items-start gap-3 rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5">
            <Sparkles
              className="h-4 w-4 shrink-0 text-text-tertiary mt-0.5"
              strokeWidth={2}
              aria-hidden
            />
            <p className="font-body text-[12px] text-text-secondary leading-relaxed">
              Competency rows are added from the mentor detail page after the invite is sent.
              Matching requires at least one role × skill × level combination.
            </p>
          </div>
        </FormSection>

        <FormSection
          title="Welcome note"
          description="Optional — included in the mentor welcome email"
          bordered
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={textareaCls}
            placeholder="e.g. Looking forward to having you on the Helios review pool."
          />
        </FormSection>

        {error && (
          <div className="px-5 pb-4">
            <p
              role="alert"
              className="rounded-xl border border-error-border bg-error-subtle px-4 py-2.5 font-body text-[12.5px] text-error-text"
            >
              {error}
            </p>
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-stroke-subtle">
          <Link
            href="/admin/mentors"
            className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
              "bg-brand text-on-brand font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {submitting ? "Creating…" : "Create mentor"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function FormSection({
  title,
  description,
  bordered,
  children,
}: {
  title: string;
  description: string;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("px-5 py-5", bordered && "border-t border-stroke-subtle")}>
      <header className="mb-4">
        <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
          {title}
        </h2>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary">{description}</p>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  required = false,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && (
          <span className="text-error-text normal-case tracking-normal"> *</span>
        )}
      </span>
      {children}
    </div>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const textareaCls = cn(
  "block w-full px-3 py-2.5 rounded-md border border-stroke bg-surface resize-y min-h-[88px]",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);
