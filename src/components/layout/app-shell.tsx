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
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ background: "var(--page-bg)" }}
    >
      {/* Ambient gradient mesh orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute"
          style={{
            top: "-8%",
            right: "-8%",
            width: "45vw",
            height: "45vh",
            background:
              "radial-gradient(circle, rgba(208,176,96,0.10) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute animate-float"
          style={{
            bottom: "5%",
            left: "-8%",
            width: "40vw",
            height: "40vh",
            background:
              "radial-gradient(circle, rgba(91,155,162,0.08) 0%, transparent 60%)",
            filter: "blur(100px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "35%",
            right: "10%",
            width: "30vw",
            height: "30vh",
            background:
              "radial-gradient(circle, rgba(166,119,99,0.05) 0%, transparent 55%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "20%",
            left: "25%",
            width: "25vw",
            height: "25vh",
            background:
              "radial-gradient(circle, rgba(77,87,65,0.05) 0%, transparent 50%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <Sidebar config={config} />

      <motion.div
        animate={{ marginLeft: isCollapsed ? 64 : 220 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 min-h-screen lg:ml-[220px] ml-0"
      >
        <TopBar config={config} />
        <main className="px-8 py-8 pb-20" style={{ maxWidth: 1380 }}>
          {children}
        </main>
      </motion.div>

      <Toaster />
    </div>
  );
}
