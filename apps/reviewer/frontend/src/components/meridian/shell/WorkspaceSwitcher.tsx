"use client";

/**
 * Meridian — WorkspaceSwitcher
 *
 * Replaces the static brand band with an actionable workspace
 * switcher. Click → opens a dropdown listing the operator's
 * available workspaces + a "Manage workspaces" footer.
 *
 * Phase 1: placeholder workspace list (single "Glimmora HQ" entry).
 * Phase 3 wires this to the real workspace store / backend.
 *
 * Used by both EnterpriseSidebar (expanded) and EnterpriseSidebar
 * (collapsed → renders as a mark-only button without the dropdown
 * affordance text).
 */

import * as React from "react";
import { Check, ChevronsUpDown, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface Workspace {
  id: string;
  name: string;
  envLabel?: string;
}

interface WorkspaceSwitcherProps {
  workspaces?: Workspace[];
  currentId?: string;
  collapsed?: boolean;
  /** Custom brand mark (defaults to "G"). */
  brand?: React.ReactNode;
  environment?: "production" | "preview" | "demo";
  onSwitch?: (id: string) => void;
  /** Footer link for workspace settings (portal-specific). */
  settingsHref?: string;
  /** Primary title in expanded mode. */
  title?: string;
  /** Subtitle under title. */
  subtitle?: string;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "glimmora-hq", name: "Glimmora HQ" },
];

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces = DEFAULT_WORKSPACES,
  currentId = "glimmora-hq",
  collapsed = false,
  brand,
  environment = "demo",
  onSwitch,
  settingsHref = "/enterprise/settings",
  title = "GlimmoraTeam",
  subtitle,
}) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];

  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch workspace"
        aria-haspopup="menu"
        aria-expanded={open}
        title={current?.name}
        className={cn(
          "w-full rounded-lg",
          "transition-colors duration-fast ease-standard",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          collapsed ? "py-1" : "px-2 py-1.5 hover:bg-surface-hover",
          open && !collapsed && "bg-surface-hover",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-2.5",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "relative h-9 w-9 shrink-0 grid place-items-center rounded-lg",
              // Neutral brand mark — slate-inverse on inverse text. Inside
              // .theme-eclipse this becomes white square with dark "G".
              // In light shell contexts (mobile drawer header) it becomes
              // dark square with light "G".
              "bg-surface-inverse text-text-inverse",
            )}
          >
            {brand ?? (
              <span className="font-body font-bold text-[16px] leading-none tracking-[-0.02em]">
                G
              </span>
            )}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="font-body font-semibold text-[14px] text-foreground leading-tight tracking-[-0.01em] truncate">
                {title}
              </p>
              <p className="mt-1 font-body text-[10.5px] text-text-tertiary leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">{subtitle ?? current?.name}</span>
                <span aria-hidden className="text-text-disabled">·</span>
                <EnvChip env={environment} />
              </p>
            </div>
          )}
          {!collapsed && (
            <ChevronsUpDown
              className="h-3.5 w-3.5 shrink-0 text-text-disabled"
              strokeWidth={2}
              aria-hidden
            />
          )}
        </div>
      </button>

      {open && !collapsed && (
        <div
          role="menu"
          aria-label="Workspace switcher"
          className={cn(
            "absolute left-0 right-0 top-full mt-1 z-dropdown",
            "rounded-lg bg-surface border border-stroke-subtle",
            "shadow-[var(--shadow-dropdown)]",
            "py-1.5",
            "animate-fade-in",
          )}
          style={{ animationDuration: "120ms" }}
        >
          <p className="px-3 pt-1 pb-1.5 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
            Workspaces
          </p>
          {workspaces.map((ws) => {
            const active = ws.id === currentId;
            return (
              <button
                key={ws.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSwitch?.(ws.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center w-full gap-2 px-3 h-8 mx-0",
                  "font-body text-[12.5px]",
                  "transition-colors duration-fast ease-standard",
                  active
                    ? "text-foreground font-semibold"
                    : "text-text-secondary hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <span className="truncate flex-1 text-left">{ws.name}</span>
                {active && (
                  <Check
                    className="h-3.5 w-3.5 text-text-link shrink-0"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
          <div className="mx-1.5 my-1 h-px bg-stroke-subtle" />
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "mx-1.5 flex items-center gap-2 px-3 h-8 rounded-md",
              "font-body text-[12px]",
              "text-text-tertiary hover:bg-surface-hover hover:text-foreground",
              "transition-colors duration-fast ease-standard",
            )}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">Manage workspaces</span>
          </Link>
        </div>
      )}
    </div>
  );
};

const EnvChip: React.FC<{ env: "production" | "preview" | "demo" }> = ({
  env,
}) => {
  const tone =
    env === "production"
      ? "text-success-text"
      : env === "preview"
        ? "text-warning-text"
        : "text-ai-text";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-body text-[9.5px] font-bold uppercase tracking-[0.10em]",
        tone,
      )}
    >
      <span
        aria-hidden
        className="inline-block h-1 w-1 rounded-full bg-current opacity-80"
      />
      {env}
    </span>
  );
};
