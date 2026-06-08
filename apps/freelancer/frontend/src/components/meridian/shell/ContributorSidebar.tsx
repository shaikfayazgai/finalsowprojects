"use client";

/**
 * Meridian — ContributorSidebar
 *
 * Mirrors EnterpriseSidebar chrome exactly. The only contributor-specific
 * differences:
 *   • IA is Today / My work / My record (vs enterprise's 6-section grammar)
 *   • Footer adds an identity + this-month-earnings pin above the collapse
 *     toggle (enterprise has no identity pin — its operator lives in topbar)
 *
 * Everything else — selected-state white card lift, section title style,
 * brand strip, collapse-button-in-footer position — matches enterprise so
 * the two portals feel like the same product.
 */

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import type {
  ModuleConfig,
  NavItem,
  NavSection,
} from "@/lib/config/navigation";
import { Tooltip } from "../primitives/Tooltip";

interface ContributorSidebarProps {
  config: ModuleConfig;
}

export function ContributorSidebar({ config }: ContributorSidebarProps) {
  const pathname = usePathname() ?? "";
  const { isCollapsed, isMobileOpen, toggle, closeMobile } = useSidebarStore();

  return (
    <>
      <DesktopDrawer
        config={config}
        pathname={pathname}
        collapsed={isCollapsed}
        toggle={toggle}
      />
      {isMobileOpen && (
        <MobileDrawer
          config={config}
          pathname={pathname}
          onClose={closeMobile}
        />
      )}
    </>
  );
}

/* ───────────────────────── Desktop drawer ───────────────────────── */

function DesktopDrawer({
  config,
  pathname,
  collapsed,
  toggle,
}: {
  config: ModuleConfig;
  pathname: string;
  collapsed: boolean;
  toggle: () => void;
}) {
  const { primary, tail } = splitSections(config.sections);

  return (
    <aside
      aria-label="Contributor navigation"
      data-collapsed={collapsed || undefined}
      className={cn(
        "fixed inset-y-0 left-0 z-sidebar hidden lg:flex flex-col",
        "border-r border-stroke-subtle",
        "transition-[width] duration-base ease-standard",
        collapsed ? "w-[72px]" : "w-[256px]",
      )}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      <BrandStrip collapsed={collapsed} />

      <nav
        aria-label="Primary"
        className={cn(
          "flex-1 overflow-y-auto",
          collapsed ? "px-2 pt-2 pb-3" : "px-3 pt-2 pb-3",
        )}
      >
        {primary.map((section, idx) => (
          <SectionBlock
            key={section.title ?? `s-${idx}`}
            title={section.title}
            items={section.items}
            pathname={pathname}
            collapsed={collapsed}
            withTopGap={idx > 0}
          />
        ))}

        {tail && tail.items.length > 0 && (
          <SectionBlock
            items={tail.items}
            pathname={pathname}
            collapsed={collapsed}
            withTopGap
          />
        )}
      </nav>

      <ToggleFooter collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}

/* ───────────────────────── Mobile drawer ───────────────────────── */

function MobileDrawer({
  config,
  pathname,
  onClose,
}: {
  config: ModuleConfig;
  pathname: string;
  onClose: () => void;
}) {
  const { primary, tail } = splitSections(config.sections);
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <aside
        aria-label="Contributor navigation"
        className="absolute inset-y-0 left-0 w-[280px] flex flex-col border-r border-stroke-subtle"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex items-center justify-between h-[60px] px-4 border-b border-stroke-subtle">
          <BrandMark />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-text-tertiary hover:text-foreground hover:bg-[var(--sidebar-accent)]"
          >
            <X className="w-4 h-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
          {primary.map((section, idx) => (
            <SectionBlock
              key={section.title ?? `s-${idx}`}
              title={section.title}
              items={section.items}
              pathname={pathname}
              collapsed={false}
              withTopGap={idx > 0}
              onItemClick={onClose}
            />
          ))}
          {tail && tail.items.length > 0 && (
            <SectionBlock
              items={tail.items}
              pathname={pathname}
              collapsed={false}
              withTopGap
              onItemClick={onClose}
            />
          )}
        </nav>
      </aside>
    </div>
  );
}

/* ───────────────────────── Brand strip ───────────────────────── */

function BrandStrip({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center",
        collapsed ? "px-3 py-4 justify-center" : "px-4 py-4 gap-2.5",
      )}
    >
      <Link
        href="/contributor/dashboard"
        aria-label="Glimmora"
        className={cn(
          "flex items-center gap-3 min-w-0 flex-1 rounded-md",
          "transition-opacity duration-fast ease-standard",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          !collapsed && "hover:opacity-80",
        )}
      >
        <BrandMark />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p
              className="font-body text-[14px] font-semibold leading-tight tracking-[-0.01em] truncate"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              Glimmora
            </p>
            <p className="mt-0.5 font-body text-[11px] text-text-tertiary leading-tight truncate">
              Glimmora HQ
            </p>
          </div>
        )}
      </Link>
    </div>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 grid place-items-center h-8 w-8 rounded-md overflow-hidden",
        "font-body font-bold text-[13px] leading-none tracking-[-0.02em]",
      )}
      style={{
        background: "var(--sidebar-primary)",
        color: "var(--sidebar-primary-foreground)",
      }}
    >
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="object-cover w-full h-full"
        priority
      />
    </span>
  );
}

/* ───────────────────────── Section block ───────────────────────── */

function SectionBlock({
  title,
  items,
  pathname,
  collapsed,
  withTopGap,
  onItemClick,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  withTopGap?: boolean;
  onItemClick?: () => void;
}) {
  return (
    <div className={cn(withTopGap && (collapsed ? "mt-4" : "mt-6"))}>
      {!collapsed && title && (
        <p className="px-3 mb-2 font-body text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
          {title}
        </p>
      )}
      {collapsed && withTopGap && (
        <div aria-hidden className="mx-auto h-px w-6 bg-stroke-subtle mb-3" />
      )}
      <ul className={cn(collapsed ? "space-y-1.5" : "space-y-1")}>
        {items.map((item) => (
          <li key={item.href}>
            <NavLink
              item={item}
              active={isItemActive(item, pathname)}
              collapsed={collapsed}
              onClick={onItemClick}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (pathname.startsWith(item.href + "/")) return true;
  return false;
}

/* ───────────────────────── Nav link ───────────────────────── */

function NavLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right">
        <Link
          href={item.href}
          prefetch={false}
          onClick={onClick}
          aria-current={active ? "page" : undefined}
          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2"
        >
          <span
            className={cn(
              "relative grid place-items-center h-10 w-10 mx-auto rounded-md",
              "transition-all duration-fast ease-standard",
              active
                ? "bg-surface text-foreground shadow-[var(--shadow-xs)] ring-1 ring-stroke-subtle"
                : "text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-foreground",
            )}
          >
            <Icon className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />
          </span>
        </Link>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 h-9 px-3 rounded-md",
        "font-body text-[13px]",
        "transition-all duration-fast ease-standard",
        active
          ? "bg-surface text-foreground font-semibold shadow-[var(--shadow-xs)] ring-1 ring-stroke-subtle"
          : "text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors duration-fast",
          active ? "text-foreground" : "text-text-tertiary group-hover:text-text-secondary",
        )}
        strokeWidth={2}
        aria-hidden
      />
      <span className="truncate flex-1">{item.label}</span>
      {item.badge != null && (
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[15px] px-1 rounded",
            "font-body text-[9.5px] font-bold tabular-nums",
            active
              ? "bg-bg-subtle text-text-secondary"
              : "bg-muted text-text-tertiary",
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ───────────────────────── Footer ─ collapse / expand toggle ───────────────────────── */

function ToggleFooter({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  return (
    <div
      className={cn(
        "shrink-0 border-t border-stroke-subtle",
        collapsed ? "p-2 flex justify-center" : "px-3 py-2 flex justify-end",
      )}
    >
      <Tooltip content={label} side={collapsed ? "right" : "top"}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-pressed={!collapsed}
          className={cn(
            "inline-flex items-center justify-center h-9 w-9 rounded-md",
            "text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-foreground",
            "transition-colors duration-fast ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
      </Tooltip>
    </div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function splitSections(sections: NavSection[]): {
  primary: NavSection[];
  tail: NavSection | null;
} {
  const primary: NavSection[] = [];
  let tail: NavSection | null = null;
  for (const s of sections) {
    if (!s.title) {
      tail = s;
    } else {
      primary.push(s);
    }
  }
  return { primary, tail };
}

