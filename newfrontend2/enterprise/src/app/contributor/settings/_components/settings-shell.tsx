"use client";

import { usePathname } from "next/navigation";
import { SettingsNav } from "./settings-nav";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isIndex = pathname === "/contributor/settings";
  const isDeleteFlow = pathname.startsWith("/contributor/settings/delete");

  return (
    <div className="animate-fade-in">
      {!isIndex && !isDeleteFlow && <SettingsNav />}
      {children}
    </div>
  );
}
