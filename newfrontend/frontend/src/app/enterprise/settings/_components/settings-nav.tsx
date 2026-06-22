"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEnterpriseTenantRoles } from "@/lib/hooks/use-enterprise-tenant-roles";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { cn } from "@/lib/utils/cn";

export function SettingsNav() {
  const pathname = usePathname() ?? "";
  const { accessibleSections, canAccessSettings } = useEnterpriseTenantRoles();

  if (!canAccessSettings) return null;

  const isOverview = pathname === "/enterprise/settings";

  return (
    <nav
      aria-label="Settings sections"
      className={cn(DASH_CARD, "overflow-hidden mb-5")}
    >
      <div className="px-5 pt-3 pb-3">
        <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-stroke-subtle bg-bg-subtle/60 w-fit">
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
        "relative inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg",
        "font-body text-[13px] font-semibold whitespace-nowrap transition-colors duration-fast",
        active
          ? "text-white"
          : "text-text-secondary hover:text-foreground hover:bg-surface",
      )}
      style={active ? GLASS_GRADIENT : undefined}
    >
      {label}
      {access === "view" && (
        <span
          className={cn(
            "font-body text-[9px] font-semibold uppercase tracking-wide",
            active ? "text-white/80" : "text-text-tertiary",
          )}
        >
          view
        </span>
      )}
    </Link>
  );
}
