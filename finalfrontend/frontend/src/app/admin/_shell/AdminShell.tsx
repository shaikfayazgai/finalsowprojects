"use client";

/**
 * Admin shell — UX-first layout.
 * Solid sidebar for navigation; mesh canvas for the work area.
 */

import * as React from "react";
import type { ModuleConfig } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { ShellProvider, useShell } from "@/components/meridian/shell/ShellContext";
import { PageActionsProvider } from "@/components/meridian/shell/PageActionsContext";
import { CommandPalette } from "@/components/meridian/shell/CommandPalette";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminMobileNav } from "./AdminMobileNav";
import { GLASS_MESH } from "./aurora";

interface AdminShellProps {
  config: ModuleConfig;
  children: React.ReactNode;
  operator?: { name: string; initials: string; email?: string };
  brandSubtitle?: string;
}

function SkipLink() {
  return (
    <a
      href="#admin-main"
      className={cn(
        "fixed left-3 top-3 z-toast -translate-y-20 focus:translate-y-0",
        "rounded-lg px-3 py-2 font-body text-[13px] font-semibold",
        "bg-brand text-on-brand shadow-md transition-transform duration-base",
      )}
    >
      Skip to main content
    </a>
  );
}

function ShellInner({ config, children, operator, brandSubtitle }: AdminShellProps) {
  const { sidebarCollapsed } = useShell();

  return (
    <div className="relative min-h-screen text-foreground" style={GLASS_MESH}>
      <SkipLink />
      <AdminSidebar config={config} brandSubtitle={brandSubtitle} />
      <AdminMobileNav config={config} />

      <div
        className={cn(
          "min-h-screen flex flex-col transition-[margin] duration-base ease-standard",
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[248px]",
        )}
      >
        <AdminTopbar config={config} operator={operator} />
        <main id="admin-main" tabIndex={-1} className="flex-1 relative">
          <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-5 lg:px-6 py-5 lg:py-7 pb-14">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette config={config} />
    </div>
  );
}

export function AdminShell(props: AdminShellProps) {
  return (
    <ShellProvider>
      <PageActionsProvider>
        <ShellInner {...props} />
      </PageActionsProvider>
    </ShellProvider>
  );
}
