"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, CreditCard, Plug, ScrollText, ShieldCheck } from "lucide-react";
import { useEnterpriseTenantRoles } from "@/lib/hooks/use-enterprise-tenant-roles";
import {
  pathnameToSettingsSection,
  type SettingsSectionId,
} from "@/lib/settings/settings-rbac";
import { SettingsNav } from "./settings-nav";
import { GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

const SECTION_ICONS: Record<SettingsSectionId, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  tenant: Building2,
  plan: CreditCard,
  integrations: Plug,
  policies: ScrollText,
  workspace: ShieldCheck,
};

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { status, canAccessSettings, accessibleSections, sectionAccess } =
    useEnterpriseTenantRoles();

  const activeSection = pathnameToSettingsSection(pathname);
  const isIndex = pathname === "/enterprise/settings";

  React.useEffect(() => {
    if (status === "loading") return;
    if (isIndex) return;
    if (!canAccessSettings) {
      router.replace("/enterprise/profile");
      return;
    }
    if (!activeSection) return;
    if (sectionAccess(activeSection) === "none") {
      router.replace("/enterprise/settings");
    }
  }, [status, isIndex, canAccessSettings, activeSection, sectionAccess, router]);

  if (status === "loading") {
    return <div className="animate-fade-in">{children}</div>;
  }

  if (!canAccessSettings && !isIndex) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      {canAccessSettings && <SettingsNav />}
      {children}
    </div>
  );
}

export function SettingsIndexWorkspace() {
  const { accessibleSections } = useEnterpriseTenantRoles();

  if (accessibleSections.length === 0) {
    return (
      <div className="space-y-5 pb-12">
        <SettingsHeader />
        <div className={cn(GLASS_CARD, "overflow-hidden px-5 py-8 text-center")} style={GLASS_SHADOW}>
          <p className="font-body text-[14px] font-medium text-foreground">
            No workspace settings for your role
          </p>
          <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-md mx-auto">
            Tenant configuration is limited to admins and specialist roles. Manage your personal
            account from Profile.
          </p>
          <Link
            href="/enterprise/profile"
            className={cn(primaryBtnClass, "mt-4")}
            style={primaryStyle}
          >
            Go to profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <SettingsHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {accessibleSections.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          return (
            <Link
              key={section.id}
              href={section.href}
              className={cn(
                GLASS_CARD,
                "group overflow-hidden p-4 transition-colors duration-fast hover:bg-white/70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
              )}
              style={GLASS_SHADOW}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/55 bg-white/40 text-text-secondary shrink-0"
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <h2 className="font-display text-[14px] font-semibold text-foreground truncate">
                    {section.label}
                  </h2>
                </div>
                <ArrowRight
                  className="h-3.5 w-3.5 text-text-tertiary shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
              </div>
              <p className="font-body text-[12.5px] text-text-secondary">{section.description}</p>
              {section.access === "view" && (
                <p className="mt-2 font-body text-[11px] text-text-tertiary">Read-only for your role</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SettingsHeader() {
  return (
    <header>
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
        Enterprise · Settings
      </p>
      <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
        Workspace settings
      </h1>
      <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
        Org-wide configuration — tenant, integrations, policies, and workspace security. Personal
        sign-in controls live on your Profile.
      </p>
    </header>
  );
}
