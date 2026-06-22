"use client";

/**
 * Meridian — EnterpriseSidebar
 *
 * Editorial rail navigation on the gradient sidebar canvas.
 * Background stays `var(--gradient-sidebar)`; everything else is
 * typography-led hierarchy with a left-rail active indicator.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type {
  ModuleConfig,
  NavItem,
  NavSection,
} from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { SidebarSubscriptionChip } from "@/components/enterprise/subscription/SidebarSubscriptionChip";
import { Tooltip } from "../primitives/Tooltip";
import { useShell } from "./ShellContext";
import { SHELL_HEADER_ROW_CLASS } from "./shell-chrome";

interface EnterpriseSidebarProps {
  config: ModuleConfig;
  brand?: React.ReactNode;
  operator?: { name: string; initials: string; email?: string };
  environment?: "production" | "preview" | "demo";
  workspace?: string;
  attention?: Record<string, "ai" | "critical" | true>;
  counts?: Record<string, number>;
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  config,
  workspace = "Glimmora HQ",
  attention,
  counts,
}) => {
  const pathname = usePathname() ?? "";
  const { sidebarCollapsed, toggleSidebar } = useShell();

  const { work, platform, footer } = React.useMemo(
    () => partitionSections(config.sections),
    [config.sections],
  );

  const allHrefs = React.useMemo(
    () =>
      [...work, ...platform, ...footer].flatMap((s) =>
        s.items.map((i) => i.href),
      ),
    [work, platform, footer],
  );

  return (
    <aside
      aria-label={`${config.shortName} navigation`}
      data-collapsed={sidebarCollapsed || undefined}
      className={cn(
        "fixed inset-y-0 left-0 z-sidebar hidden lg:flex flex-col",
        "border-r border-stroke/60",
        "transition-[width] duration-base ease-standard",
        sidebarCollapsed ? "w-[68px]" : "w-[248px]",
      )}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      <BrandHeader collapsed={sidebarCollapsed} workspace={workspace} config={config} />

      <nav
        aria-label="Primary"
        className={cn(
          "flex-1 overflow-y-auto sidebar-scroll",
          sidebarCollapsed ? "px-2 py-3" : "px-3 py-4",
        )}
      >
        <div className={cn(!sidebarCollapsed && "space-y-6")}>
          {work.map((section, idx) => (
            <NavSection
              key={section.title ?? `work-${idx}`}
              section={section}
              pathname={pathname}
              allHrefs={allHrefs}
              collapsed={sidebarCollapsed}
              attention={attention}
              counts={counts}
              tone="work"
              showDivider={sidebarCollapsed && idx > 0}
            />
          ))}
        </div>

        {platform.length > 0 && (
          <div
            className={cn(
              sidebarCollapsed ? "mt-5 pt-5 border-t border-stroke/70" : "mt-7 pt-6 border-t border-stroke/70",
            )}
          >
            <div className={cn(!sidebarCollapsed && "space-y-5")}>
              {platform.map((section, idx) => (
                <NavSection
                  key={section.title ?? `plat-${idx}`}
                  section={section}
                  pathname={pathname}
                  allHrefs={allHrefs}
                  collapsed={sidebarCollapsed}
                  attention={attention}
                  counts={counts}
                  tone="platform"
                  showDivider={sidebarCollapsed && idx > 0}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {footer.length > 0 && (
        <div
          className={cn(
            "shrink-0 border-t border-stroke/70",
            sidebarCollapsed ? "px-2 py-2.5" : "px-3 py-2.5",
          )}
        >
          {footer.flatMap((s) =>
            s.items.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                active={isItemActive(item, pathname, allHrefs)}
                collapsed={sidebarCollapsed}
                attention={attention?.[item.href]}
                count={counts?.[item.href]}
                size="compact"
              />
            )),
          )}
        </div>
      )}

      {config.id === "enterprise" && (
        <SidebarSubscriptionChip collapsed={sidebarCollapsed} />
      )}

      <CollapseControl collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
    </aside>
  );
};

/* ─── Brand ─── */

function BrandHeader({
  collapsed,
  workspace,
  config,
}: {
  collapsed: boolean;
  workspace: string;
  config: ModuleConfig;
}) {
  const homeHref = config.homePath ?? `${config.basePath}/dashboard`;
  const subtitle =
    config.id === "admin"
      ? "Operations"
      : `${config.shortName} · ${workspace}`;

  return (
    <div
      className={cn(
        SHELL_HEADER_ROW_CLASS,
        collapsed ? "justify-center px-2.5" : "px-4",
      )}
    >
      <Link
        href={homeHref}
        aria-label={config.name}
        className={cn(
          "flex items-center rounded-lg min-w-0",
          collapsed ? "justify-center" : "gap-2.5",
          "transition-opacity duration-fast hover:opacity-85",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
        )}
      >
        <span className="relative shrink-0 h-8 w-8 rounded-lg overflow-hidden ring-1 ring-stroke/80 bg-surface flex items-center justify-center">
          <span className="font-body text-[14px] font-bold text-brand" aria-hidden>G</span>
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-none">
            <p className="font-body text-[14px] font-semibold tracking-[-0.02em] text-foreground truncate">
              Glimmora
            </p>
            <p className="mt-0.5 font-body text-[10.5px] text-text-tertiary truncate">
              {subtitle}
            </p>
          </div>
        )}
      </Link>
    </div>
  );
}

/* ─── Section ─── */

function NavSection({
  section,
  pathname,
  allHrefs,
  collapsed,
  attention,
  counts,
  tone,
  showDivider,
}: {
  section: NavSection;
  pathname: string;
  allHrefs: string[];
  collapsed: boolean;
  attention?: Record<string, "ai" | "critical" | true>;
  counts?: Record<string, number>;
  tone: "work" | "platform";
  showDivider?: boolean;
}) {
  const emphasized = section.emphasis === "primary";

  return (
    <div>
      {showDivider && (
        <div aria-hidden className="mx-auto mb-3 h-px w-5 bg-stroke/80" />
      )}

      {!collapsed && section.title && (
        <p
          className={cn(
            "mb-2 px-2.5 font-body uppercase leading-none",
            tone === "work"
              ? emphasized
                ? "text-[10px] font-bold tracking-[0.14em] text-foreground"
                : "text-[10px] font-semibold tracking-[0.12em] text-text-tertiary"
              : "text-[9.5px] font-medium tracking-[0.14em] text-text-disabled",
          )}
        >
          {section.title}
        </p>
      )}

      <ul className={cn(collapsed ? "space-y-1" : "space-y-0.5")}>
        {section.items.map((item) => (
          <li key={item.href}>
            <NavItemLink
              item={item}
              active={isItemActive(item, pathname, allHrefs)}
              collapsed={collapsed}
              attention={attention?.[item.href]}
              count={counts?.[item.href]}
              size={emphasized ? "default" : "default"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Nav item ─── */

function NavItemLink({
  item,
  active,
  collapsed,
  attention,
  count,
  size = "default",
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  attention?: "ai" | "critical" | true;
  count?: number;
  size?: "default" | "compact";
}) {
  const Icon = item.icon;
  const disabled = item.disabled === true;
  const compact = size === "compact";

  const className = cn(
    "group relative flex items-center rounded-md transition-colors duration-fast ease-standard",
    collapsed
      ? "justify-center h-9 w-9 mx-auto"
      : cn(
          "gap-2.5 w-full",
          compact ? "h-8 px-2.5 text-[12.5px]" : "h-9 px-2.5 text-[13px]",
          "font-body",
        ),
    active
      ? "bg-surface text-foreground font-medium shadow-[var(--shadow-xs)] ring-1 ring-stroke-subtle"
      : disabled
        ? "text-text-disabled cursor-not-allowed opacity-55"
        : "text-text-secondary hover:bg-surface/60 hover:text-foreground",
    !disabled &&
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-1",
  );

  const label = (
    <>
      <Icon
        className={cn(
          "shrink-0 transition-colors duration-fast",
          collapsed ? "h-4 w-4" : compact ? "h-[15px] w-[15px]" : "h-4 w-4",
          active
            ? "text-foreground"
            : disabled
              ? "text-text-disabled"
              : "text-text-tertiary group-hover:text-text-secondary",
        )}
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          <ItemTrailing
            disabled={disabled}
            count={count}
            badge={item.badge}
            active={active}
            attention={attention}
          />
        </>
      )}
      {collapsed && (
        <AttentionDot attention={attention} active={active} collapsed />
      )}
    </>
  );

  if (collapsed) {
    const node = disabled ? (
      <span aria-disabled="true" className={className}>
        {label}
      </span>
    ) : (
      <Link
        href={item.href}
        prefetch={false}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        className={className}
      >
        {label}
      </Link>
    );

    return (
      <Tooltip content={disabled ? `${item.label} · coming soon` : item.label} side="right">
        {node}
      </Tooltip>
    );
  }

  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {label}
    </Link>
  );
}

function ItemTrailing({
  disabled,
  count,
  badge,
  active,
  attention,
}: {
  disabled: boolean;
  count?: number;
  badge?: string;
  active: boolean;
  attention?: "ai" | "critical" | true;
}) {
  if (disabled) {
    return (
      <span className="font-body text-[9px] uppercase tracking-wider text-text-disabled">
        Soon
      </span>
    );
  }
  if (typeof count === "number") {
    return (
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          active ? "text-text-secondary" : "text-text-tertiary",
        )}
      >
        {count}
      </span>
    );
  }
  if (badge) {
    return (
      <span
        className={cn(
          "inline-flex min-w-[18px] h-4 px-1 items-center justify-center rounded-md",
          "font-mono text-[10px] font-semibold tabular-nums",
          active ? "bg-bg-subtle text-text-secondary" : "bg-surface-sunken text-text-tertiary",
        )}
      >
        {badge}
      </span>
    );
  }
  return <AttentionDot attention={attention} active={active} />;
}

function AttentionDot({
  attention,
  active,
  collapsed,
}: {
  attention?: "ai" | "critical" | true;
  active?: boolean;
  collapsed?: boolean;
}) {
  if (!attention || active) return null;
  const kind = attention === true ? "critical" : attention;
  return (
    <span
      aria-hidden
      className={cn(
        "rounded-full shrink-0",
        collapsed
          ? "absolute top-1.5 right-1.5 h-1.5 w-1.5 ring-2 ring-surface"
          : "h-1.5 w-1.5",
        kind === "ai" ? "bg-[var(--c-violet-500)]" : "bg-[var(--destructive)]",
        kind === "critical" && "animate-pulse",
      )}
    />
  );
}

function CollapseControl({
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
        "shrink-0 border-t border-stroke/70",
        collapsed ? "p-2 flex justify-center" : "px-3 py-2 flex items-center justify-between",
      )}
    >
      {!collapsed && (
        <span className="font-body text-[10px] text-text-disabled tracking-wide">
          Navigation
        </span>
      )}
      <Tooltip content={label} side={collapsed ? "right" : "top"}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-pressed={!collapsed}
          className={cn(
            "inline-flex items-center justify-center h-8 w-8 rounded-lg",
            "text-text-tertiary hover:text-foreground hover:bg-surface/55",
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

/* ─── Helpers ─── */

function isItemActive(
  item: NavItem,
  pathname: string,
  allHrefs: string[],
): boolean {
  if (pathname === item.href) return true;
  if (!pathname.startsWith(item.href + "/")) return false;
  for (const other of allHrefs) {
    if (other === item.href) continue;
    if (other.length <= item.href.length) continue;
    if (!other.startsWith(item.href + "/")) continue;
    if (pathname === other || pathname.startsWith(other + "/")) {
      return false;
    }
  }
  return true;
}

function partitionSections(sections: NavSection[]): {
  work: NavSection[];
  platform: NavSection[];
  footer: NavSection[];
} {
  const work: NavSection[] = [];
  const platform: NavSection[] = [];
  const footer: NavSection[] = [];

  for (const s of sections) {
    const zone = s.zone ?? "primary";
    if (zone === "utility") continue;
    if (zone === "footer") {
      footer.push(s);
      continue;
    }
    if (zone === "governance") {
      platform.push(s);
      continue;
    }
    work.push(s);
  }

  return { work, platform, footer };
}
