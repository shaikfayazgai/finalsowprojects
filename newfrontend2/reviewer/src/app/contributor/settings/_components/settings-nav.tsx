"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTRIBUTOR_SETTINGS_SECTIONS } from "../lib/settings-sections";
import { cn } from "@/lib/utils/cn";

export function SettingsNav() {
  const pathname = usePathname() ?? "";
  const isOverview = pathname === "/contributor/settings";
  const isDeleteFlow = pathname.startsWith("/contributor/settings/delete");

  if (isDeleteFlow) return null;

  return (
    <nav
      aria-label="Settings sections"
      className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden mb-5"
    >
      <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle overflow-x-auto">
        <div className="flex flex-wrap gap-x-1 -mb-px min-w-max">
          <NavTab href="/contributor/settings" label="Overview" active={isOverview} />
          {CONTRIBUTOR_SETTINGS_SECTIONS.map((section) => {
            const active =
              section.href === pathname || pathname.startsWith(`${section.href}/`);
            return (
              <NavTab
                key={section.id}
                href={section.href}
                label={section.label}
                active={active}
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
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 py-2.5",
        "font-body text-[13px] font-medium whitespace-nowrap",
        active ? "text-foreground" : "text-text-secondary hover:text-foreground",
      )}
    >
      {label}
      {active && (
        <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
      )}
    </Link>
  );
}
