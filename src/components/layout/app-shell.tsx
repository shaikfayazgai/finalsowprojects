"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { Toaster } from "@/components/ui/toaster";
import type { ModuleConfig } from "@/lib/config/navigation";

interface AppShellProps {
  config: ModuleConfig;
  children: React.ReactNode;
}

export function AppShell({ config, children }: AppShellProps) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen relative overflow-x-clip" style={{ background: 'var(--page-bg)' }}>
      {/* Ambient gradient glow in top-right of content area */}
      <div className="fixed pointer-events-none z-0" style={{
        top: 0, right: 0, width: '50vw', height: '40vh',
        background: 'radial-gradient(ellipse at 80% 10%, rgba(208,176,96,0.04) 0%, transparent 60%), radial-gradient(ellipse at 60% 30%, rgba(91,155,162,0.03) 0%, transparent 50%)',
      }} />

      <Sidebar config={config} />

      <motion.div
        animate={{ marginLeft: isCollapsed ? 68 : 228 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 min-h-screen lg:ml-[228px] ml-0"
      >
        <TopBar config={config} />
        <main className="px-11 py-11 pb-20" style={{ maxWidth: 1400 }}>
          {children}
        </main>
      </motion.div>

      <Toaster />
    </div>
  );
}
