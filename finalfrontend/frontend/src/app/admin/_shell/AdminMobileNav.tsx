"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { ModuleConfig, NavItem, NavSection } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useShell } from "@/components/meridian/shell/ShellContext";
import { SHELL_HEADER_ROW_CLASS } from "@/components/meridian/shell/shell-chrome";
import { SHELL_SIDEBAR } from "./aurora";
import { allHrefsOf, isItemActive } from "./nav-utils";

function partitionSections(sections: NavSection[]) {
  const anchor: NavSection[] = [];
  const work: NavSection[] = [];
  const platform: NavSection[] = [];

  for (const s of sections) {
    if (!s.title && s.items.length === 1) {
      anchor.push(s);
      continue;
    }
    if (s.zone === "governance") platform.push(s);
    else work.push(s);
  }

  return { anchor, work, platform };
}

export function AdminMobileNav({ config }: { config: ModuleConfig }) {
  const { mobileOpen, closeMobile } = useShell();
  const pathname = usePathname() ?? "";
  const allHrefs = React.useMemo(() => allHrefsOf(config), [config]);
  const { anchor, work, platform } = React.useMemo(
    () => partitionSections(config.sections),
    [config.sections],
  );

  React.useEffect(() => {
    if (mobileOpen) closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMobile();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  return (
    <div className={cn("lg:hidden", !mobileOpen && "pointer-events-none")} aria-hidden={!mobileOpen}>
      <div
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-drawer bg-foreground/20 transition-opacity duration-base",
          mobileOpen ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Operations navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-drawer w-[280px] max-w-[85vw] flex flex-col",
          SHELL_SIDEBAR,
          "shadow-xl transition-transform duration-slow ease-standard",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn(SHELL_HEADER_ROW_CLASS, "justify-between px-4 border-b border-stroke-subtle shrink-0")}>
          <span className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg ring-1 ring-stroke-subtle bg-surface grid place-items-center font-body text-[14px] font-bold text-brand">
              G
            </span>
            <span className="font-body text-[14px] font-semibold text-foreground">Glimmora</span>
          </span>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation"
            className="grid place-items-center h-9 w-9 rounded-lg text-text-tertiary hover:bg-bg-subtle"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4">
          {anchor.flatMap((s) =>
            s.items.map((item) => (
              <Row key={item.href} item={item} active={isItemActive(item, pathname, allHrefs)} anchor />
            )),
          )}

          <div className="mt-4 space-y-5">
            {work.map((section, i) => (
              <Section key={section.title ?? `w-${i}`} section={section} pathname={pathname} allHrefs={allHrefs} />
            ))}
          </div>

          {platform.length > 0 && (
            <div className="mt-6 pt-5 border-t border-stroke-subtle space-y-4">
              {platform.map((section, i) => (
                <Section
                  key={section.title ?? `p-${i}`}
                  section={section}
                  pathname={pathname}
                  allHrefs={allHrefs}
                  muted
                />
              ))}
            </div>
          )}
        </nav>
      </aside>
    </div>
  );
}

function Section({
  section,
  pathname,
  allHrefs,
  muted,
}: {
  section: NavSection;
  pathname: string;
  allHrefs: string[];
  muted?: boolean;
}) {
  return (
    <div>
      {section.title && (
        <p className={cn("mb-1.5 px-2.5 font-body text-[11px] font-medium", muted ? "text-text-disabled" : "text-text-tertiary")}>
          {section.title}
        </p>
      )}
      <ul className="space-y-0.5">
        {section.items.map((item) => (
          <li key={item.href}>
            <Row item={item} active={isItemActive(item, pathname, allHrefs)} muted={muted} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ item, active, anchor, muted }: { item: NavItem; active: boolean; anchor?: boolean; muted?: boolean }) {
  const Icon = item.icon;
  const disabled = item.disabled === true;

  const className = cn(
    "flex items-center gap-2.5 w-full px-2.5 rounded-lg font-body transition-colors duration-fast",
    anchor ? "h-10 text-[13.5px]" : "h-9 text-[13px]",
    active
      ? "bg-surface text-foreground font-medium shadow-[var(--shadow-xs)] ring-1 ring-stroke-subtle"
      : disabled
        ? "text-text-disabled opacity-55"
        : cn(muted ? "text-text-tertiary" : "text-text-secondary", "hover:bg-bg-subtle/80 hover:text-foreground"),
  );

  const inner = (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.75} aria-hidden />
      <span className="truncate flex-1 text-left">{item.label}</span>
      {item.badge != null && item.badge !== "" && !disabled && (
        <span className="font-mono text-[10px] font-semibold tabular-nums text-text-tertiary">{item.badge}</span>
      )}
    </>
  );

  if (disabled) return <span className={className} aria-disabled="true">{inner}</span>;
  return (
    <Link href={item.href} prefetch={false} aria-current={active ? "page" : undefined} className={className}>
      {inner}
    </Link>
  );
}
