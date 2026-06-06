"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { Sidebar } from "./sidebar";
import { ContributorSidebar } from "@/components/meridian/shell/ContributorSidebar";
import { ContributorTopbar } from "@/components/meridian/shell/ContributorTopbar";
import { TopBar } from "./top-bar";
import { Toaster } from "@/components/ui/toaster";
import type { ModuleConfig } from "@/lib/config/navigation";

interface AppShellProps {
  config: ModuleConfig;
  children: React.ReactNode;
}

export function AppShell({ config, children }: AppShellProps) {
  const { isCollapsed } = useSidebarStore();

  // Contributor portal uses the V2 Meridian sidebar; mentor/admin/analytics
  // still ride the legacy sidebar until they're migrated.
  const useMeridianSidebar = config.id === "contributor";
  const expandedWidth = useMeridianSidebar ? 256 : 220;
  const collapsedWidth = useMeridianSidebar ? 72 : 64;

  return (
    <div
      className={
        useMeridianSidebar
          ? "min-h-screen relative overflow-x-clip bg-bg text-foreground"
          : "min-h-screen relative overflow-x-clip"
      }
      style={
        useMeridianSidebar
          ? undefined
          : {
              background: `
          radial-gradient(ellipse 80% 50% at 80% -10%, color-mix(in srgb, var(--color-gold-200) 12%, transparent) 0%, transparent 70%),
          radial-gradient(ellipse 60% 60% at -5% 60%, color-mix(in srgb, var(--color-teal-200) 8%, transparent) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 50% 100%, color-mix(in srgb, var(--color-brown-200) 6%, transparent) 0%, transparent 50%),
          linear-gradient(180deg, var(--color-beige-50) 0%, #FFFFFF 40%, var(--color-gray-50) 100%)
        `,
            }
      }
    >
      {useMeridianSidebar ? (
        <ContributorSidebar config={config} />
      ) : (
        <Sidebar config={config} />
      )}

      <motion.div
        animate={{ marginLeft: isCollapsed ? collapsedWidth : expandedWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={
          useMeridianSidebar
            ? "min-h-screen lg:ml-[256px] ml-0"
            : "min-h-screen lg:ml-[220px] ml-0"
        }
      >
        {useMeridianSidebar ? (
          <ContributorTopbar config={config} />
        ) : (
          <TopBar config={config} />
        )}
        <main>
          <div className="mx-auto w-full max-w-[var(--meridian-content-max)] px-5 sm:px-6 lg:px-10 pt-8 lg:pt-10 pb-20">
            {children}
          </div>
        </main>
      </motion.div>

      {/* AI Chat Widget removed from contributor portal during Stabilization
        * phase. V2 surfaces use summoned per-workflow AI (workroom, revision,
        * NextStepCard) — the floating chatbot competed with that pattern. */}
      <Toaster />
    </div>
  );
}
