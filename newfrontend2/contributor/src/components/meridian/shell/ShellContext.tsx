"use client";

/**
 * Meridian — ShellContext
 *
 * Shared UI state for the enterprise shell: sidebar collapsed,
 * mobile sidebar open, command palette open. Centralizing here lets
 * topbar / sidebar / command palette communicate without prop drilling.
 */

import * as React from "react";

interface ShellState {
  /** Sidebar collapsed (icon-only) state. Persists across navigation. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Mobile sidebar drawer state. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;

  /** Global command palette visibility. */
  commandOpen: boolean;
  openCommand: () => void;
  closeCommand: () => void;
}

const ShellContext = React.createContext<ShellState | null>(null);

const COLLAPSED_KEY = "meridian-shell-collapsed";

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  // Hydrate collapsed preference from localStorage.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_KEY);
      if (stored === "1") setSidebarCollapsed(true);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = React.useMemo<ShellState>(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
      commandOpen,
      openCommand: () => setCommandOpen(true),
      closeCommand: () => setCommandOpen(false),
    }),
    [sidebarCollapsed, mobileOpen, commandOpen, toggleSidebar],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellState {
  const ctx = React.useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
