"use client";

/**
 * Meridian — MobileSidebar (Drawer)
 *
 * Mobile-only (<lg) sidebar fallback. Slides in from the left when
 * `useShell().mobileOpen` is true. Renders the full nav hierarchy in
 * expanded mode (no collapse on mobile). Closes on backdrop click,
 * Escape, or after a nav link click.
 *
 * Renders into a portal at the document body so it sits above the
 * topbar's sticky z-index.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { ModuleConfig, NavItem, NavSection } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useShell } from "./ShellContext";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

interface MobileSidebarProps {
  config: ModuleConfig;
  environment?: "production" | "preview" | "demo";
  attention?: Record<string, boolean>;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  config,
  environment = "demo",
  attention,
}) => {
  const { mobileOpen, closeMobile } = useShell();
  const pathname = usePathname() ?? "";
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Close on Escape
  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobile();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  if (!mounted || !mobileOpen || typeof document === "undefined") return null;

  const { primary, governance, utility } = partitionSections(config.sections);
  const utilityItems = utility.flatMap((s) => s.items);

  return createPortal(
    <div
      className="fixed inset-0 z-drawer lg:hidden"
      role="presentation"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        onClick={closeMobile}
        className="absolute inset-0 bg-overlay animate-fade-in"
        style={{ animationDuration: "180ms" }}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label={`${config.shortName} navigation`}
        aria-modal="true"
        className={cn(
          "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] flex flex-col",
          "bg-surface border-r border-stroke-subtle",
          "shadow-[var(--shadow-modal)]",
        )}
        style={{
          animation:
            "meridian-slide-in-right 220ms var(--ease-standard, cubic-bezier(0.16, 1, 0.3, 1))",
        }}
      >
        {/* Header — brand + close */}
        <div className="shrink-0 px-2 pt-3 pb-2 flex items-start gap-1">
          <div className="flex-1 min-w-0">
            {config.id === "admin" ? (
              <Link
                href={`${config.basePath}/dashboard`}
                onClick={closeMobile}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg min-w-0"
              >
                <span className="h-9 w-9 shrink-0 grid place-items-center rounded-lg bg-surface-inverse text-text-inverse font-body font-bold text-[16px]">
                  G
                </span>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-[14px] text-foreground truncate">Glimmora</p>
                  <p className="font-body text-[10.5px] text-text-tertiary truncate">Operations</p>
                </div>
              </Link>
            ) : (
              <WorkspaceSwitcher
                environment={environment}
                settingsHref={`${config.basePath}/settings`}
              />
            )}
          </div>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation"
            className={cn(
              "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md",
              "text-text-tertiary hover:bg-surface-hover hover:text-foreground",
              "transition-colors duration-fast ease-standard",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            )}
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {/* Nav */}
        <nav
          aria-label="Primary"
          className="flex-1 overflow-y-auto px-3 pt-3 pb-2"
        >
          {/* Anchor + labelled primary */}
          {primary.anchor.length > 0 && (
            <NavList
              items={primary.anchor}
              pathname={pathname}
              attention={attention}
              onNavigate={closeMobile}
            />
          )}
          {primary.labelled.length > 0 && (
            <div className={cn("space-y-4", primary.anchor.length > 0 && "mt-5")}>
              {primary.labelled.map((section, idx) => (
                <NavSectionBlock
                  key={section.title ?? `s-${idx}`}
                  section={section}
                  pathname={pathname}
                  attention={attention}
                  onNavigate={closeMobile}
                />
              ))}
            </div>
          )}

          {/* Governance — hairline separator, no label */}
          {governance.length > 0 && (
            <>
              <div
                aria-hidden
                role="separator"
                className="my-4 h-px bg-stroke-subtle"
              />
              {governance.map((section, idx) => (
                <NavSectionBlock
                  key={section.title ?? `gov-${idx}`}
                  section={section}
                  pathname={pathname}
                  attention={attention}
                  subdued
                  onNavigate={closeMobile}
                />
              ))}
            </>
          )}
        </nav>

        {/* Utility footer */}
        <div className="shrink-0 border-t border-stroke-subtle py-2 px-3 flex items-center gap-1">
          {utilityItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, pathname);
            const hasAttention = Boolean(attention?.[item.href]);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center justify-center h-9 w-9 rounded-md",
                  "transition-colors duration-fast ease-standard",
                  active
                    ? "bg-brand-subtle text-[var(--color-primary-subtle-text)]"
                    : "text-text-secondary hover:bg-surface-hover hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                {hasAttention && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-error-solid)] ring-2 ring-surface"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </aside>
    </div>,
    document.body,
  );
};

/* ─────────────────────── Inner pieces ─────────────────────── */

const NavSectionBlock: React.FC<{
  section: NavSection;
  pathname: string;
  attention?: Record<string, boolean>;
  subdued?: boolean;
  onNavigate: () => void;
}> = ({ section, pathname, attention, subdued, onNavigate }) => (
  <div>
    {section.title && (
      <p
        className={cn(
          "px-2.5 mb-1.5 font-body text-[10.5px] font-semibold uppercase tracking-[0.10em]",
          subdued ? "text-text-disabled" : "text-text-tertiary",
        )}
      >
        {section.title}
      </p>
    )}
    <NavList
      items={section.items}
      pathname={pathname}
      attention={attention}
      onNavigate={onNavigate}
    />
  </div>
);

const NavList: React.FC<{
  items: NavItem[];
  pathname: string;
  attention?: Record<string, boolean>;
  onNavigate: () => void;
}> = ({ items, pathname, attention, onNavigate }) => (
  <ul className="space-y-[2px]">
    {items.map((item) => {
      const active = isItemActive(item, pathname);
      const hasAttention = Boolean(attention?.[item.href]);
      const Icon = item.icon;
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 h-10 px-2 rounded-md",
              "font-body text-[13.5px]",
              "transition-colors duration-fast ease-standard",
              active
                ? "bg-brand-subtle text-[var(--color-primary-subtle-text)] font-semibold"
                : "text-text-secondary hover:bg-surface-hover hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            )}
          >
            <span
              className={cn(
                "shrink-0 grid place-items-center h-7 w-7 rounded-md",
                "transition-all duration-fast ease-standard",
                active
                  ? "bg-brand text-on-brand shadow-[var(--shadow-glow-primary)]"
                  : "bg-surface-sunken text-text-secondary",
              )}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden />
            </span>
            <span className="truncate flex-1">{item.label}</span>
            {hasAttention && !active && (
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-error-solid)] shrink-0"
              />
            )}
          </Link>
        </li>
      );
    })}
  </ul>
);

/* ─────────────────────── Helpers ─────────────────────── */

function isItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (pathname.startsWith(item.href + "/")) return true;
  return false;
}

function partitionSections(sections: NavSection[]): {
  primary: { anchor: NavItem[]; labelled: NavSection[] };
  governance: NavSection[];
  utility: NavSection[];
} {
  const anchor: NavItem[] = [];
  const labelled: NavSection[] = [];
  const governance: NavSection[] = [];
  const utility: NavSection[] = [];
  for (const s of sections) {
    const zone = s.zone ?? "primary";
    if (zone === "governance") {
      governance.push(s);
    } else if (zone === "utility") {
      utility.push(s);
    } else if (s.items.length === 1 && s.title) {
      anchor.push(...s.items);
    } else {
      labelled.push(s);
    }
  }
  return { primary: { anchor, labelled }, governance, utility };
}
