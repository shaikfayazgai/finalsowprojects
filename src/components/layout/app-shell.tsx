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
    <div className="min-h-screen relative overflow-hidden bg-beige-50">
      {/* Warm atmospheric mesh — soft orbs bleeding warmth into the light canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute w-[800px] h-[800px] rounded-full opacity-[0.25] blur-[120px] -top-[200px] right-[10%] bg-brown-300" />
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.15] blur-[100px] top-[40%] left-[-5%] bg-teal-300" />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.18] blur-[100px] bottom-[-5%] right-[20%] bg-gold-300" />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.10] blur-[80px] top-[20%] left-[40%] bg-forest-300" />
      </div>

      <Sidebar config={config} />

      <motion.div
        animate={{ marginLeft: isCollapsed ? 72 : 264 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 flex flex-col h-screen lg:ml-[264px] ml-0"
      >
        <TopBar config={config} />
        <main className="flex-1 overflow-y-auto px-6 py-5 pb-10">
          {children}
        </main>
      </motion.div>

      <Toaster />
    </div>
  );
}
