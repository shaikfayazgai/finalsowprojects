"use client";

/**
 * Meridian — EnterpriseShell
 *
 * Composes the redesigned shell. Renders sidebar (lg+) + topbar
 * + main content area + global command palette. Mobile sidebar
 * is delivered as a Drawer-style overlay in a future iteration —
 * desktop is the priority for the enterprise stakeholder experience.
 *
 * Wraps children with the ShellProvider so any descendant can read
 * sidebar/command state.
 */

import * as React from "react";
import type { ModuleConfig } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { ShellProvider, useShell } from "./ShellContext";
import { EnterpriseSidebar } from "./EnterpriseSidebar";
import { EnterpriseTopbar } from "./EnterpriseTopbar";
import { CommandPalette } from "./CommandPalette";
import { EnvironmentBanner } from "./EnvironmentBanner";
import { MobileSidebar } from "./MobileSidebar";
import { PageActionsProvider } from "./PageActionsContext";

interface EnterpriseShellProps {
  config: ModuleConfig;
  children: React.ReactNode;
  operator?: { name: string; initials: string; email?: string };
}

/**
 * Skip link — visible only on keyboard focus. Lets screen-reader /
 * keyboard users jump past the navigation chrome.
 */
function SkipLink() {
  return (
    <a
      href="#meridian-main"
      className={cn(
        "fixed left-2 top-2 z-critical -translate-y-16 focus:translate-y-0",
        "bg-brand text-on-brand font-body font-semibold text-body-sm",
        "px-3 py-2 rounded-md shadow-md",
        "transition-transform duration-base ease-standard",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
      )}
    >
      Skip to main content
    </a>
  );
}

function ShellInner({ config, children, operator }: EnterpriseShellProps) {
  const { sidebarCollapsed } = useShell();
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <SkipLink />
      <EnvironmentBanner />
      <EnterpriseSidebar
        config={config}
        operator={operator ? { name: operator.name, initials: operator.initials } : undefined}
      />
      <MobileSidebar config={config} />
      <div
        className={cn(
          "min-h-screen flex flex-col",
          "transition-[margin] duration-base ease-standard",
          // Sidebar reserves space only at lg+ (where it's visible).
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[248px]",
        )}
      >
        <EnterpriseTopbar config={config} operator={operator} />
        <main
          id="meridian-main"
          tabIndex={-1}
          className="flex-1 pb-20"
        >
          {/*
            Canonical content canvas. Width comes from the Azure token
            `--meridian-content-max` (default 1440px); pages can override
            locally for ultra-wide tables. Padding scales 20 → 24 → 40px.
            Page-level vertical rhythm is owned by the page primitives;
            the shell sets only the canvas top spacing.
          */}
          <div className="mx-auto w-full max-w-[var(--meridian-content-max)] px-5 sm:px-6 lg:px-10 pt-8 lg:pt-10">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette config={config} />
    </div>
  );
}

export const EnterpriseShell: React.FC<EnterpriseShellProps> = (props) => (
  <ShellProvider>
    <PageActionsProvider>
      <ShellInner {...props} />
    </PageActionsProvider>
  </ShellProvider>
);
