"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEnterpriseTenantRoles } from "@/lib/hooks/use-enterprise-tenant-roles";
import { cn } from "@/lib/utils/cn";

export function SettingsNav() {
  const pathname = usePathname() ?? "";
  const { accessibleSections, canAccessSettings } = useEnterpriseTenantRoles();

  if (!canAccessSettings) return null;

  const isOverview = pathname === "/enterprise/settings";

  return (
    <nav
      aria-label="Settings sections"
      className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden mb-5"
    >
      <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
        <div className="flex flex-wrap gap-x-1 -mb-px">
          <NavTab href="/enterprise/settings" label="Overview" active={isOverview} />
          {accessibleSections.map((section) => {
            const active =
              section.href === pathname || pathname.startsWith(`${section.href}/`);
            return (
              <NavTab
                key={section.id}
                href={section.href}
                label={section.label}
                active={active}
                access={section.access === "view" ? "view" : section.access === "manage" ? "manage" : undefined}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  active,
  access,
}: {
  href: string;
  label: string;
  active: boolean;
  access?: "view" | "manage";
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 py-2.5",
        "font-body text-[13px] font-medium whitespace-nowrap",
        active ? "text-foreground" : "text-text-secondary",
      )}
    >
      {label}
      {access === "view" && (
        <span className="font-body text-[9px] font-semibold uppercase tracking-wide text-text-tertiary">
          view
        </span>
      )}
      {active && (
        <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
      )}
    </Link>
  );
}
