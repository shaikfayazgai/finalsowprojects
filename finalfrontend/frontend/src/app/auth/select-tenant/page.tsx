"use client";

/**
 * Tenant selector — spec doc 02 §5.A.1.
 *
 * Shown when a user belongs to multiple tenants. Single-tenant users
 * skip this page entirely. Phase 1 backend doesn't yet expose a
 * multi-tenant listing endpoint; this is a UI shell.
 */

import * as React from "react";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TenantOptionMock {
  id: string;
  name: string;
  activeProjects: number;
  lastVisitLabel: string;
}

const TENANTS: TenantOptionMock[] = [
  { id: "glimmora-hq", name: "Glimmora HQ", activeProjects: 12, lastVisitLabel: "yesterday" },
  { id: "helios-studios", name: "Helios Studios", activeProjects: 3, lastVisitLabel: "last week" },
];

export default function TenantSelectorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md space-y-5">
        <header className="text-center">
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
            Select organization
          </p>
          <h1 className="font-body text-[20px] font-semibold text-foreground tracking-[-0.02em] leading-tight">
            You're a member of multiple organizations.
          </h1>
          <p className="mt-1.5 font-body text-[13px] text-text-secondary">
            Choose where to continue.
          </p>
        </header>

        <div className="space-y-2">
          {TENANTS.map((t) => (
            <Link
              key={t.id}
              href="/enterprise/dashboard"
              className={cn(
                "group rounded-lg border border-stroke bg-surface px-4 py-3",
                "flex items-center gap-3",
                "hover:bg-surface-hover transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            >
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-bg-subtle"
              >
                <Building2
                  className="h-4 w-4 text-text-secondary"
                  strokeWidth={2}
                  aria-hidden
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[14px] font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="font-mono text-[11px] text-text-tertiary tabular-nums">
                  {t.activeProjects} active project{t.activeProjects === 1 ? "" : "s"} · last visit {t.lastVisitLabel}
                </p>
              </div>
              <ArrowRight
                className="h-3.5 w-3.5 text-text-tertiary group-hover:text-foreground transition-colors duration-fast"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          ))}
        </div>

        <p className="text-center font-body text-[12px] text-text-tertiary">
          Single-tenant users are auto-skipped to their dashboard.
        </p>
      </div>
    </div>
  );
}
