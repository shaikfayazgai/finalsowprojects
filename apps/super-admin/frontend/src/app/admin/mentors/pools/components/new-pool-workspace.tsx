"use client";

/**
 * New mentor pool — aligned with competency editor + tenant form patterns.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Select } from "@/components/meridian";
import { createAdminPool } from "@/lib/admin/mocks/mentors-service";
import { useAdminMentorsList } from "@/lib/hooks/use-admin-mentors";
import type { MockTenant } from "@/mocks/admin/tenants";
import { cn } from "@/lib/utils/cn";

export function NewPoolWorkspace() {
  const router = useRouter();
  const mentors = useAdminMentorsList().filter(
    (m) => m.status === "active" || m.status === "pending",
  );

  // No real tenant registry endpoint exists yet — start empty rather than
  // seeding a fabricated tenant list. The tenant picker shows an empty state
  // until a backend source is connected.
  const [tenants] = React.useState<MockTenant[]>([]);
  const [name, setName] = React.useState("");
  const [scope, setScope] = React.useState<"tenant" | "cross-tenant">("tenant");
  const [tenantId, setTenantId] = React.useState("");
  const [leadMentorId, setLeadMentorId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!leadMentorId && mentors[0]) setLeadMentorId(mentors[0].id);
  }, [mentors, leadMentorId]);

  const canSubmit = name.trim().length > 2 && leadMentorId && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const tenant = tenants.find((t) => t.id === tenantId);
    const pool = createAdminPool({
      name: name.trim(),
      scope,
      tenantId: scope === "tenant" ? tenantId : undefined,
      tenantName: scope === "tenant" ? tenant?.name : undefined,
      leadMentorId,
    });
    router.push(`/admin/mentors/pools/${pool.id}?created=1`);
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/mentors/pools"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Mentor pools</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">New pool</span>
      </nav>

      <header className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Pool
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          New mentor pool
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Create a tenant-scoped or cross-tenant review pool. Assign mentors after creation from
          the mentor registry.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden"
      >
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Pool configuration
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Name, scope, and initial lead mentor
          </p>
        </header>

        <div className="px-5 py-5 space-y-5">
          <Field label="Pool name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Design review pool"
              required
            />
          </Field>

          <Field label="Scope" required>
            <Select
              variant="outline"
              size="sm"
              value={scope}
              onChange={(e) => setScope(e.target.value as "tenant" | "cross-tenant")}
            >
              <option value="tenant">Tenant-scoped</option>
              <option value="cross-tenant">Cross-tenant (senior+ mentors)</option>
            </Select>
            <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
              {scope === "tenant"
                ? "Reviews route only within the selected tenant's work."
                : "Global pool — only senior and lead mentors can be assigned."}
            </p>
          </Field>

          {scope === "tenant" && (
            <Field label="Tenant" required>
              {tenants.length === 0 ? (
                <p className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2 font-body text-[12px] text-text-tertiary">
                  No tenants available yet. Provision a tenant before creating a tenant-scoped pool, or choose cross-tenant scope.
                </p>
              ) : (
                <Select
                  variant="outline"
                  size="sm"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}

          <Field label="Lead mentor" required>
            <Select
              variant="outline"
              size="sm"
              value={leadMentorId}
              onChange={(e) => setLeadMentorId(e.target.value)}
              required
            >
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-stroke-subtle">
          <Link
            href="/admin/mentors/pools"
            className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "inline-flex items-center h-9 px-4 rounded-md shadow-xs",
              "bg-brand text-on-brand font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {submitting ? "Creating…" : "Create pool"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
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
