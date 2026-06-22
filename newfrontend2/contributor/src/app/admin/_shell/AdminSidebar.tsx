"use client";

/**
 * Admin sidebar — calm editorial rail.
 * Dashboard anchor → work sections → platform (governance zone).
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ModuleConfig, NavItem, NavSection } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { Tooltip } from "@/components/meridian/primitives/Tooltip";
import { useShell } from "@/components/meridian/shell/ShellContext";
import { GLASS_RAIL, GLASS_GRADIENT } from "./aurora";
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

export function AdminSidebar({
  config,
  brandSubtitle = "Operations",
}: {
  config: ModuleConfig;
  brandSubtitle?: string;
}) {
  const pathname = usePathname() ?? "";
  const { sidebarCollapsed, toggleSidebar } = useShell();
  const allHrefs = React.useMemo(() => allHrefsOf(config), [config]);
  const { anchor, work, platform } = React.useMemo(
    () => partitionSections(config.sections),
    [config.sections],
  );

  return (
    <aside
      aria-label="Operations navigation"
      data-collapsed={sidebarCollapsed || undefined}
      className={cn(
        "fixed inset-y-0 left-0 z-sidebar hidden lg:flex flex-col",
        GLASS_RAIL,
        "transition-[width] duration-base ease-standard",
        sidebarCollapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <BrandHeader
        collapsed={sidebarCollapsed}
        homeHref={config.homePath ?? `${config.basePath}/dashboard`}
        subtitle={brandSubtitle}
      />

      <nav
        aria-label="Primary"
        className={cn(
          "flex-1 overflow-y-auto sidebar-scroll",
          sidebarCollapsed ? "px-2 py-3" : "px-3.5 py-5",
        )}
      >
        {anchor.length > 0 && (
          <div className={cn(sidebarCollapsed ? "mb-2" : "mb-7")}>
            {anchor.flatMap((s) =>
              s.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={item}
                  active={isItemActive(item, pathname, allHrefs)}
                  collapsed={sidebarCollapsed}
                  variant="anchor"
                />
              )),
            )}
          </div>
        )}

        <div className={cn(!sidebarCollapsed && "space-y-7")}>
          {work.map((section, idx) => (
            <NavSection
              key={section.title ?? `work-${idx}`}
              section={section}
              pathname={pathname}
              allHrefs={allHrefs}
              collapsed={sidebarCollapsed}
              showDivider={sidebarCollapsed && idx > 0}
            />
          ))}
        </div>

        {platform.length > 0 && (
          <div
            className={cn(
              sidebarCollapsed ? "mt-4 pt-4 border-t border-stroke-subtle" : "mt-7 pt-6 border-t border-stroke-subtle",
            )}
          >
            <div className={cn(!sidebarCollapsed && "space-y-6")}>
              {platform.map((section, idx) => (
                <NavSection
                  key={section.title ?? `plat-${idx}`}
                  section={section}
                  pathname={pathname}
                  allHrefs={allHrefs}
                  collapsed={sidebarCollapsed}
                  tone="platform"
                  showDivider={sidebarCollapsed && idx > 0}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      <CollapseControl collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
    </aside>
  );
}

function BrandHeader({
  collapsed,
  homeHref,
  subtitle,
}: {
  collapsed: boolean;
  homeHref: string;
  subtitle: string;
}) {
  return (
    <div className={cn("h-[52px] shrink-0 flex items-center border-b border-stroke-subtle", collapsed ? "justify-center px-2.5" : "px-4")}>
      <Link
        href={homeHref}
        aria-label="Glimmora Operations"
        className={cn(
          "flex items-center rounded-lg min-w-0 transition-opacity duration-fast hover:opacity-85",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          collapsed ? "justify-center" : "gap-2.5",
        )}
      >
        <span
          className="relative shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
          style={GLASS_GRADIENT}
        >
          <span className="font-display text-[14px] font-bold text-white" aria-hidden>
            G
          </span>
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-none">
            <p className="font-display text-[14px] font-semibold tracking-[-0.02em] text-foreground truncate">Glimmora</p>
            <p className="mt-0.5 font-body text-[10.5px] text-text-tertiary truncate">{subtitle}</p>
          </div>
        )}
      </Link>
    </div>
  );
}

function NavSection({
  section,
  pathname,
  allHrefs,
  collapsed,
  tone = "work",
  showDivider,
}: {
  section: NavSection;
  pathname: string;
  allHrefs: string[];
  collapsed: boolean;
  tone?: "work" | "platform";
  showDivider?: boolean;
}) {
  return (
    <div>
      {showDivider && <div aria-hidden className="mx-auto mb-3 h-px w-5 bg-stroke-subtle" />}

      {!collapsed && section.title && (
        <p
          className={cn(
            "mb-3 px-3 font-body text-[10px] font-semibold uppercase tracking-[0.14em] leading-none",
            tone === "platform" ? "text-text-disabled" : "text-text-tertiary",
          )}
        >
          {section.title}
        </p>
      )}

      <ul className={cn(collapsed ? "space-y-1" : "space-y-1.5")}>
        {section.items.map((item) => (
          <li key={item.href}>
            <NavItemLink
              item={item}
              active={isItemActive(item, pathname, allHrefs)}
              collapsed={collapsed}
              variant={tone === "platform" ? "muted" : "default"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavItemLink({
  item,
  active,
  collapsed,
  variant = "default",
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  variant?: "anchor" | "default" | "muted";
}) {
  const Icon = item.icon;
  const disabled = item.disabled === true;
  const isAnchor = variant === "anchor";

  const className = cn(
    "group relative flex items-center rounded-lg transition-all duration-fast ease-standard",
    collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-3 w-full px-3 font-body",
    !collapsed && (isAnchor ? "h-11 text-[14px]" : "h-10 text-[13px]"),
    active
      ? "text-white font-semibold"
      : disabled
        ? "text-text-disabled cursor-not-allowed opacity-55"
        : cn(
            variant === "muted" ? "text-text-tertiary" : "text-text-secondary",
            "hover:bg-bg-subtle hover:text-foreground",
            isAnchor && !active && "font-semibold text-foreground",
          ),
    !disabled && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
  );

  const itemStyle = active && !disabled ? GLASS_GRADIENT : undefined;

  const label = (
    <>
      <Icon
        className={cn(
          "shrink-0 h-4 w-4 transition-colors duration-fast",
          active ? "text-white" : disabled ? "text-text-disabled" : "text-text-tertiary group-hover:text-text-secondary",
        )}
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      />
      {!collapsed && (
        <>
          <span className="truncate flex-1 text-left">{item.label}</span>
          <ItemTrailing disabled={disabled} badge={item.badge} active={active} />
        </>
      )}
      {collapsed && item.badge && !disabled && (
        <span aria-hidden className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--c-violet-500)] ring-2 ring-white/80" />
      )}
    </>
  );

  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {label}
      </span>
    );
  }

  const link = (
    <Link href={item.href} prefetch={false} aria-current={active ? "page" : undefined} className={className} style={itemStyle}>
      {label}
    </Link>
  );

  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function ItemTrailing({ disabled, badge, active }: { disabled: boolean; badge?: string | number; active: boolean }) {
  if (disabled) {
    return <span className="font-body text-[9px] uppercase tracking-wider text-text-disabled">Soon</span>;
  }
  if (badge != null && badge !== "") {
    return (
      <span
        className={cn(
          "inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-md",
          "font-mono text-[10px] font-semibold tabular-nums",
          active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
        )}
      >
        {badge}
      </span>
    );
  }
  return null;
}

function CollapseControl({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className={cn("shrink-0 border-t border-stroke-subtle", collapsed ? "p-2 flex justify-center" : "px-3 py-2 flex items-center justify-between")}>
      {!collapsed && (
        <span className="font-body text-[10px] uppercase tracking-[0.13em] text-text-disabled">Navigation</span>
      )}
      <Tooltip content={label} side={collapsed ? "right" : "top"}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-pressed={!collapsed}
          className={cn(
            "inline-flex items-center justify-center h-8 w-8 rounded-lg",
            "text-text-tertiary hover:text-foreground hover:bg-bg-subtle",
            "transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
      </Tooltip>
    </div>
  );
}
